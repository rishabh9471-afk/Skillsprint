// POST /api/grade — grade an answer (first attempt or a revision)
// body: { visitorId, sessionId, scenarioId, answer, token? }  (token = from the previous grading, for revisions)
import { handler, getBody, send, fail } from '../server/http.js';
import { isUuid, cleanText, verifyQuote } from '../server/validate.js';
import { scenarioById } from '../src/shared/scenarios.js';
import { LIMITS, countWords } from '../src/shared/limits.js';
import { rubrics } from '../server/rubrics.js';
import { buildGradePrompt, checkGrade } from '../server/prompts.js';
import { runJsonTask, mockGrade, aiConfigured } from '../server/ai.js';
import { signToken, verifyToken, answerHash } from '../server/token.js';
import { overallFromDimensions } from '../server/scoring.js';
import { db, tryDb } from '../server/db.js';
import { config, PROMPT_VERSION } from '../server/config.js';
import { istDay } from '../server/time.js';
import { quotaGuard, newSessionsPaused, logServer, aiCallEvents } from '../server/usage.js';

export default handler(['POST'], async (req, res) => {
  const body = getBody(req);
  const { visitorId, sessionId, scenarioId } = body;
  if (!isUuid(visitorId) || !isUuid(sessionId)) return fail(res, 400, 'bad_request', 'Missing visitor or session id.');
  const scenario = scenarioById[scenarioId];
  if (!scenario) return fail(res, 400, 'bad_scenario', 'Unknown scenario.');

  const answer = cleanText(body.answer);
  const words = countWords(answer);
  if (words < LIMITS.MIN_WORDS) {
    return fail(res, 400, 'too_short', `Write at least ${LIMITS.MIN_WORDS} words so the coach has something to work with.`);
  }
  if (words > LIMITS.MAX_WORDS + 10) return fail(res, 400, 'too_long', `Please keep your answer under ${LIMITS.MAX_WORDS} words.`);
  if (!aiConfigured()) return fail(res, 503, 'ai_not_configured', 'The AI coach is not set up yet. (Add GEMINI_API_KEY in Vercel.)');

  // Revision? The previous grading's token proves the session, version and scores.
  let prev = null;
  let version = 1;
  if (body.token) {
    prev = verifyToken(body.token);
    if (!prev || prev.sid !== sessionId || prev.vid !== visitorId || prev.scn !== scenarioId) {
      return fail(res, 400, 'bad_token', 'This session has expired. Please start the scenario again.');
    }
    version = prev.v + 1;
    if (version > 1 + LIMITS.MAX_REVISIONS) {
      return fail(res, 409, 'revision_limit', 'You have used both revisions. Face the interviewer to finish this scenario.');
    }
    if (answerHash(answer) === prev.ah) {
      return fail(res, 409, 'unchanged', 'Change something in your answer before resubmitting.');
    }
  }

  const ctx = { visitorId, sessionId, scenarioId };
  const day = istDay();

  // First attempt of a new session: daily limit per visitor + global pause.
  let sessionExists = false;
  if (version === 1) {
    const existing = await tryDb(() => db.getSession(sessionId), null);
    sessionExists = Boolean(existing.ok && existing.value);
    if (!sessionExists) {
      const count = await tryDb(() => db.countSessionsOnDay(visitorId, day, sessionId), 0);
      if (count.value >= config.dailyScenarioLimit) {
        await logServer([{ name: 'limit_hit', visitor_id: visitorId, scenario_id: scenarioId, props: { kind: 'daily' } }]);
        return fail(res, 429, 'daily_limit', `You've used today's ${config.dailyScenarioLimit} scenarios. Come back tomorrow for more.`, {
          limit: config.dailyScenarioLimit,
        });
      }
      if (await newSessionsPaused()) {
        await logServer([{ name: 'limit_hit', visitor_id: visitorId, scenario_id: scenarioId, props: { kind: 'global' } }]);
        return fail(res, 503, 'paused', "The coach has reached today's capacity. New scenarios open again tomorrow.");
      }
    }
  }

  const dimNames = rubrics[scenario.skill].map((d) => d.name);
  const revision = prev ? { number: version - 1, previousScore: prev.s, previousFix: prev.fx } : null;
  const { system, user } = buildGradePrompt(scenario, answer, revision);

  let result;
  try {
    result = await runJsonTask({
      system,
      user,
      check: (o) => checkGrade(o, scenario.skill),
      mock: () => mockGrade(answer, dimNames, version - 1),
      beforeCall: quotaGuard(),
    });
  } catch (e) {
    await logServer([
      ...aiCallEvents(e.calls, { kind: 'grade', ...ctx }),
      { name: 'ai_task', ...ctxRow(ctx), props: { kind: 'grade', ok: false, code: e.code } },
    ]);
    if (e.code === 'quota_guard') {
      return fail(res, 503, 'paused', "The coach has reached today's capacity. Your answer is saved — please try again tomorrow.");
    }
    return fail(res, 503, 'ai_busy', 'The coach is busy right now. Your answer is saved — please try again in a minute.');
  }

  const g = result.value;
  const taskEvent = {
    name: 'ai_task',
    ...ctxRow(ctx),
    props: { kind: 'grade', ok: true, provider: result.provider, fallback: result.fallback, ms: result.latencyMs },
  };

  if (g.status === 'not_an_answer') {
    await logServer([...aiCallEvents(result.calls, { kind: 'grade', ...ctx }), taskEvent, { name: 'not_an_answer', ...ctxRow(ctx), props: { version } }]);
    return send(res, 200, { status: 'not_an_answer', reason: g.reason, version: prev ? prev.v : 0 });
  }

  // Keep only quotes that really appear in the answer.
  let verified = 0;
  let quoted = 0;
  const dimensions = g.dimensions.map((d) => {
    if (/^not addressed\.?$/i.test(d.evidence)) return { ...d, evidence: null };
    quoted += 1;
    const q = verifyQuote(d.evidence, answer);
    if (q) verified += 1;
    return { ...d, evidence: q };
  });
  const weakest = verifyQuote(g.weakestParagraph, answer) || g.weakestParagraph;
  const score = overallFromDimensions(dimensions);
  const firstScore = prev ? prev.fs : score;

  const token = signToken({
    sid: sessionId,
    vid: visitorId,
    scn: scenarioId,
    v: version,
    s: score,
    fs: firstScore,
    fu: g.followUps,
    ah: answerHash(answer),
    fx: g.topFix.slice(0, 300),
  });

  // Save the session (never blocks the user if the database is down).
  const saved =
    version === 1 && !sessionExists
      ? await tryDb(() =>
          db.insertSession({
            id: sessionId,
            visitor_id: visitorId,
            scenario_id: scenarioId,
            day,
            started_at: new Date().toISOString(),
            first_score: score,
            latest_score: score,
            revisions: 0,
            answer_text: answer,
            provider: result.provider,
            prompt_version: PROMPT_VERSION,
          })
        )
      : await tryDb(() =>
          db.updateSession(sessionId, { latest_score: score, revisions: version - 1, answer_text: answer, provider: result.provider })
        );

  await logServer([
    ...aiCallEvents(result.calls, { kind: 'grade', ...ctx }),
    taskEvent,
    {
      name: 'graded',
      ...ctxRow(ctx),
      props: {
        version,
        score,
        confidence: g.confidence,
        injection: g.injectionAttempt,
        evidence_verified: verified,
        evidence_total: quoted,
      },
    },
  ]);

  send(res, 200, {
    status: 'ok',
    version,
    revisionsLeft: LIMITS.MAX_REVISIONS - (version - 1),
    score,
    previousScore: prev ? prev.s : null,
    firstScore,
    dimensions,
    summary: g.summary,
    topFix: g.topFix,
    weakestParagraph: weakest,
    rewrite: g.rewrite,
    followUps: g.followUps,
    confidence: g.confidence,
    injectionAttempt: g.injectionAttempt,
    provider: result.provider,
    token,
    saved: saved.ok,
  });
});

function ctxRow({ visitorId, sessionId, scenarioId }) {
  return { visitor_id: visitorId, session_id: sessionId, scenario_id: scenarioId };
}
