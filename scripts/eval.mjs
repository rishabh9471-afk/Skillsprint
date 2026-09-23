#!/usr/bin/env node
/* Golden-set evaluation for the AI grader.
 *
 *   npm run eval                 # grade every answer once
 *   npm run eval -- --repeat 3   # grade each answer 3 times (consistency check)
 *
 * Reads evals/golden-set.json (answers + YOUR human grades), grades each answer
 * with the live prompt and model (keys from .env), and writes a report to
 * evals/reports/. Compare reports across prompt versions before shipping a change. */
import fs from 'node:fs';
import path from 'node:path';

// --- load .env without dependencies
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const { scenarioById } = await import('../src/shared/scenarios.js');
const { buildGradePrompt, checkGrade } = await import('../server/prompts.js');
const { runJsonTask, mockGrade, aiConfigured } = await import('../server/ai.js');
const { rubrics } = await import('../server/rubrics.js');
const { overallFromDimensions } = await import('../server/scoring.js');
const { verifyQuote } = await import('../server/validate.js');
const { PROMPT_VERSION, config } = await import('../server/config.js');

const repeatArg = process.argv.indexOf('--repeat');
const REPEAT = repeatArg > -1 ? Math.max(1, Number(process.argv[repeatArg + 1]) || 1) : 1;
const only = process.argv.includes('--provider') ? process.argv[process.argv.indexOf('--provider') + 1] : null;
if (only === 'groq') process.env.GEMINI_API_KEY = '';
if (only === 'gemini') process.env.GROQ_API_KEY = '';

if (!aiConfigured()) {
  console.error('No AI key found. Add GEMINI_API_KEY (and/or GROQ_API_KEY) to .env, or set MOCK_AI=true to test the script.');
  process.exit(1);
}

const golden = JSON.parse(fs.readFileSync('evals/golden-set.json', 'utf8'));
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const item of golden.items) {
  const scenario = scenarioById[item.scenarioId];
  if (!scenario) {
    console.warn(`skip ${item.id}: unknown scenario ${item.scenarioId}`);
    continue;
  }
  const runs = [];
  for (let r = 0; r < REPEAT; r++) {
    const { system, user } = buildGradePrompt(scenario, item.answer, null);
    const dimNames = rubrics[scenario.skill].map((d) => d.name);
    try {
      const out = await runJsonTask({ system, user, check: (o) => checkGrade(o, scenario.skill), mock: () => mockGrade(item.answer, dimNames) });
      const g = out.value;
      if (g.status === 'not_an_answer') runs.push({ status: 'not_an_answer', provider: out.provider, ms: out.latencyMs });
      else {
        const quoted = g.dimensions.filter((d) => !/^not addressed/i.test(d.evidence));
        const valid = quoted.filter((d) => verifyQuote(d.evidence, item.answer)).length;
        runs.push({
          status: 'ok',
          overall: overallFromDimensions(g.dimensions),
          dims: g.dimensions.map((d) => d.score),
          evidence: { valid, total: quoted.length },
          injection: g.injectionAttempt,
          provider: out.provider,
          ms: out.latencyMs,
        });
      }
    } catch (e) {
      runs.push({ status: 'error', code: e.code });
    }
    process.stdout.write('.');
    await sleep(config.mockAi ? 0 : 4500); // stay under ~15 requests/minute on the free tier
  }
  results.push({ item, runs });
}
console.log('');

// --- score against the human grades
const within1 = (a, b) => Math.abs(a - b) <= 1;
let overallAgree = 0;
let overallCount = 0;
let dimAgree = 0;
let dimCount = 0;
let evValid = 0;
let evTotal = 0;
let spreadMax = 0;
const latencies = [];
const rows = [];
const failures = [];

for (const { item, runs } of results) {
  const ok = runs.filter((r) => r.status === 'ok');
  const first = runs[0];
  for (const r of ok) latencies.push(r.ms);
  if (item.expect === 'not_an_answer') {
    const pass = first?.status === 'not_an_answer';
    rows.push(`| ${item.id} | ${item.label} | not an answer | ${first?.status || 'error'} | ${pass ? 'pass' : '**FAIL**'} |`);
    if (!pass) failures.push(`- **${item.id}** should be rejected as "not an answer" but was graded (${first?.overall ?? first?.code}).`);
    continue;
  }
  if (!ok.length) {
    rows.push(`| ${item.id} | ${item.label} | ${item.human.overall} | error | **FAIL** |`);
    failures.push(`- **${item.id}** failed to grade (${first?.code || first?.status}).`);
    continue;
  }
  const r = ok[0];
  overallCount++;
  const agree = within1(r.overall, item.human.overall);
  if (agree) overallAgree++;
  item.human.dimensions.forEach((h, i) => {
    dimCount++;
    if (within1(r.dims[i], h)) dimAgree++;
  });
  evValid += r.evidence.valid;
  evTotal += r.evidence.total;
  if (ok.length > 1) spreadMax = Math.max(spreadMax, Math.max(...ok.map((x) => x.overall)) - Math.min(...ok.map((x) => x.overall)));
  let note = agree ? 'pass' : '**FAIL**';
  if (item.expect === 'low' && r.overall > 5) note = '**FAIL** (over-scored)';
  rows.push(`| ${item.id} | ${item.label} | ${item.human.overall} | ${r.overall}${ok.length > 1 ? ` (runs: ${ok.map((x) => x.overall).join(', ')})` : ''} | ${note} |`);
  if (!agree) failures.push(`- **${item.id}** (${item.label}): human ${item.human.overall}, AI ${r.overall}; dims human [${item.human.dimensions}] vs AI [${r.dims}].`);
}

// rank order: strong > average > weak within each scenario
let rankOk = true;
const byScenario = {};
for (const { item, runs } of results) {
  const r = runs.find((x) => x.status === 'ok');
  if (!r || !['strong', 'average', 'weak'].includes(item.label)) continue;
  (byScenario[item.scenarioId] ||= {})[item.label] = r.overall;
}
for (const [sid, s] of Object.entries(byScenario)) {
  const order = ['strong', 'average', 'weak'].filter((k) => k in s).map((k) => s[k]);
  let ok = true;
  for (let i = 1; i < order.length; i++) if (!(order[i - 1] > order[i])) ok = false;
  if (!ok) {
    rankOk = false;
    failures.push(`- Rank order broken in ${sid}: ${JSON.stringify(s)}`);
  }
}

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');
const p90 = latencies.length ? [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length * 0.9)] : null;
const date = new Date().toISOString().slice(0, 10);
const provider = results.flatMap((r) => r.runs).find((r) => r.provider)?.provider || 'n/a';

const report = `# Grader eval — ${date} — prompt ${PROMPT_VERSION}

Provider: ${provider}${only ? ` (forced: ${only})` : ''} · model: ${provider === 'groq' ? config.groqModel : provider === 'gemini' ? config.geminiModel : provider} · runs per answer: ${REPEAT} · answers: ${golden.items.length}

| Metric | Result | Launch bar |
| --- | --- | --- |
| Overall score within ±1 of human | ${pct(overallAgree, overallCount)} (${overallAgree}/${overallCount}) | ≥ 80% |
| Dimension scores within ±1 | ${pct(dimAgree, dimCount)} | ≥ 70% |
| Rank order (strong > average > weak) | ${rankOk ? 'holds' : 'BROKEN'} | 100% |
| Evidence quotes found in the answer | ${pct(evValid, evTotal)} | ≥ 95% |
| Max score spread across repeats | ${REPEAT > 1 ? spreadMax.toFixed(1) : 'run with --repeat 3'} | ≤ 1.0 |
| p90 latency | ${p90 == null ? '–' : `${(p90 / 1000).toFixed(1)}s`} | < 8s |

## Per answer

| Id | Type | Human | AI | Result |
| --- | --- | --- | --- | --- |
${rows.join('\n')}

## Failures to review

${failures.length ? failures.join('\n') : 'None.'}
`;

fs.mkdirSync('evals/reports', { recursive: true });
const file = `evals/reports/${date}-${PROMPT_VERSION}-${provider}.md`;
fs.writeFileSync(file, report);
console.log(report);
console.log(`Saved ${file}`);
