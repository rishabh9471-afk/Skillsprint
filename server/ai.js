/* AI providers: Gemini (primary) → Groq (fallback), both on free tiers.
 * Calls go straight to each provider's HTTP API, so no SDK is needed.
 * MOCK_AI=true returns realistic fake results, for local testing without keys. */
import { config } from './config.js';

export class AiError extends Error {
  constructor(code, message, calls = []) {
    super(message || code);
    this.code = code;
    this.calls = calls;
  }
}

const GEMINI_TIMEOUT_MS = 20000;
const GROQ_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, opts, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctl.signal });
  } catch (e) {
    throw new AiError(e.name === 'AbortError' ? 'timeout' : 'network', e.message);
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(system, user) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.geminiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json', maxOutputTokens: 4096 },
      }),
    },
    GEMINI_TIMEOUT_MS
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AiError(res.status === 429 ? 'rate_limited' : `http_${res.status}`, body.slice(0, 300));
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
  if (!text) throw new AiError('empty', `finishReason=${data?.candidates?.[0]?.finishReason || 'none'}`);
  return text;
}

async function callGroq(system, user) {
  const body = {
    model: config.groqModel,
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_completion_tokens: 3000,
  };
  if (config.groqModel.includes('gpt-oss')) body.reasoning_effort = 'low';
  const res = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.groqKey}` },
      body: JSON.stringify(body),
    },
    GROQ_TIMEOUT_MS
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AiError(res.status === 429 ? 'rate_limited' : `http_${res.status}`, text.slice(0, 300));
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new AiError('empty', 'no content');
  return text;
}

export function parseJson(text) {
  let t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a === -1 || b <= a) throw new AiError('invalid_json', 'no JSON object found');
  t = t.slice(a, b + 1);
  try {
    return JSON.parse(t);
  } catch (e) {
    throw new AiError('invalid_json', e.message);
  }
}

export function aiConfigured() {
  return config.mockAi || Boolean(config.geminiKey || config.groqKey);
}

/**
 * Run one JSON task. Tries Gemini, retries once if the output is invalid,
 * then falls back to Groq (same retry rule). Returns the validated value plus
 * a log of every call made (for quota counting and the dashboard).
 */
export async function runJsonTask({ system, user, check, mock, beforeCall }) {
  const started = Date.now();
  const calls = [];
  if (config.mockAi) {
    await beforeCall?.();
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
    const value = check(mock()).value;
    calls.push({ provider: 'mock', ok: true, ms: Date.now() - started });
    return { value, provider: 'mock', fallback: false, latencyMs: Date.now() - started, calls };
  }
  const providers = [];
  if (config.geminiKey) providers.push(['gemini', callGemini]);
  if (config.groqKey) providers.push(['groq', callGroq]);
  if (!providers.length) throw new AiError('not_configured', 'No AI provider key is set');

  let lastErr = null;
  for (let i = 0; i < providers.length; i++) {
    const [name, call] = providers[i];
    let extra = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      await beforeCall?.();
      const t0 = Date.now();
      try {
        const text = await call(system, user + extra);
        const check1 = check(parseJson(text));
        if (check1.ok) {
          calls.push({ provider: name, ok: true, ms: Date.now() - t0 });
          return { value: check1.value, provider: name, fallback: i > 0, latencyMs: Date.now() - started, calls };
        }
        throw new AiError('invalid_output', check1.error);
      } catch (e) {
        const err = e instanceof AiError ? e : new AiError('unknown', e.message);
        calls.push({ provider: name, ok: false, code: err.code, ms: Date.now() - t0 });
        lastErr = err;
        if (err.code === 'invalid_json' || err.code === 'invalid_output') {
          extra = `\n\nIMPORTANT: your previous reply was rejected (${err.message}). Reply again with only a valid JSON object in the exact shape required.`;
          continue; // one retry on the same provider
        }
        if (err.code === 'quota_guard') throw err;
        break; // HTTP error, timeout, rate limit → next provider
      }
    }
  }
  throw new AiError(lastErr?.code || 'failed', lastErr?.message, calls);
}

// ---------------------------------------------------------------- mock mode

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function mockGrade(answer, dimNames, revisionNumber = 0) {
  const words = answer.trim().split(/\s+/).length;
  if (/lorem ipsum|asdf|qwerty/i.test(answer) || new Set(answer.toLowerCase().split(/\s+/)).size < 12) {
    return { status: 'not_an_answer', reason: 'This reads like placeholder text. Explain what you would do in the scenario and why.' };
  }
  const sentences = answer.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim().length > 20);
  const base = Math.min(8, 4 + Math.floor(words / 50)) + revisionNumber;
  const h = hashStr(answer);
  return {
    status: 'ok',
    dimensions: dimNames.map((name, i) => ({
      name,
      score: Math.max(1, Math.min(10, base + (Math.abs(h >> (i * 3)) % 3) - 1)),
      evidence: sentences.length ? sentences[i % sentences.length] : 'not addressed',
      comment: pick(
        [
          'You state a direction, but the reasoning behind it stays implicit — spell out the criteria.',
          'Good instinct; make it concrete with a number, a target or a timeframe.',
          'This is the weakest part: you name the issue but not who is affected or how you would handle them.',
          'Solid. To push higher, compare against the alternative you rejected.',
        ],
        h + i
      ),
    })),
    summary: 'A reasonable structure with a clear pick, but the decision logic and measurement need to be more explicit.',
    top_fix: 'Make your decision criteria explicit and show how each option scores against them, then say how you will know you were right within a set timeframe.',
    weakest_paragraph: sentences.length ? sentences[sentences.length - 1] : answer.slice(0, 200),
    rewrite:
      'I would measure success by the target metric over the next four weeks against a clear baseline, and I would revisit the decision if we miss the target by more than a quarter, informing Sales and Support of the date for that review.',
    follow_ups: [
      'You picked one option — what exactly would you tell the team whose request you delayed, and when?',
      'Which single number would tell you in two weeks that your decision was wrong?',
    ],
    confidence: words < 80 ? 'low' : 'high',
    injection_attempt: /give me 10|ignore (all|previous)/i.test(answer),
  };
}

export function mockVerdict(replies) {
  return {
    follow_ups: replies.map((r) =>
      r == null
        ? { score: null, comment: 'Skipped' }
        : {
            score: Math.min(9, 4 + Math.floor(r.trim().split(/\s+/).length / 15)),
            comment: 'You answered the probe directly; add one concrete number or date to make it convincing.',
          }
    ),
    strengths: ['Clear decision and ownership of the call.', 'Stayed consistent between the answer and the follow-ups.'],
    gaps: ['Quantify impact before comparing options.', 'Name the metric and timeframe that would prove you right.'],
    summary: 'You make decisions with conviction and handle pushback calmly. To reach a strong signal, back each claim with a number and a way to measure it.',
  };
}
