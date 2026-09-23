// POST /api/verdict — grade the interview follow-ups and finish the session
// body: { visitorId, sessionId, token, answer, replies: [string|null, string|null], alreadyCompleted? }
import { handler, getBody, send, fail } from '../server/http.js';
import { isUuid, cleanText } from '../server/validate.js';
import { scenarioById } from '../src/shared/scenarios.js';
import { LIMITS, countWords } from '../src/shared/limits.js';
import { buildVerdictPrompt, checkVerdict } from '../server/prompts.js';
import { runJsonTask, mockVerdict } from '../server/ai.js';
import { verifyToken, answerHash } from '../server/token.js';
import { finalScore, verdictKey, computeXp, round1 } from '../server/scoring.js';
import { db, tryDb } from '../server/db.js';
import { istDay } from '../server/time.js';
import { quotaGuard, logServer, aiCallEvents } from '../server/usage.js';

export default handler(['POST'], async (req, res) => {
  const body = getBody(req);
  const { visitorId, sessionId } = body;
  if (!isUuid(visitorId) || !isUuid(sessionId)) return fail(res, 400, 'bad_request', 'Missing visitor or session id.');

  const t = verifyToken(body.token);
  if (!t || t.sid !== sessionId || t.vid !== visitorId) {
    return fail(res, 400, 'bad_token', 'This session has expired. Please start the scenario again.');
  }
  const scenario = scenarioById[t.scn];
  const answer = cleanText(body.answer);
  if (answerHash(answer) !== t.ah) {
    return fail(res, 400, 'answer_mismatch', 'Your answer changed after it was graded. Please get feedback on it again first.');
  }

  // Replies: null = skipped.
  const rawReplies = Array.isArray(body.replies) ? body.replies : [];
  const replies = [0, 1].map((i) => (typeof rawReplies[i] === 'string' && cleanText(rawReplies[i]) ? cleanText(rawReplies[i]) : null));
  for (let i = 0; i < 2; i++) {
    if (replies[i] == null) continue;
    const w = countWords(replies[i]);
    if (w < LIMITS.FU_MIN_WORDS) return fail(res, 400, 'reply_too_short', `Reply ${i + 1} is too short — write a little more, or skip it.`);
    if (w > LIMITS.FU_MAX_WORDS + 10) return fail(res, 400, 'reply_too_long', `Please keep reply ${i + 1} under ${LIMITS.FU_MAX_WORDS} words.`);
  }

  const ctx = { visitor_id: visitorId, session_id: sessionId, scenario_id: t.scn };

  // Idempotent: a finished session returns its stored verdict.
  const existing = await tryDb(() => db.getSession(sessionId), null);
  if (existing.ok && existing.value?.verdict_payload) {
    return send(res, 200, { ...existing.value.verdict_payload, saved: true, repeated: true });
  }

  let review;
  let calls = [];
  const answeredCount = replies.filter((r) => r != null).length;
  if (answeredCount === 0) {
    review = {
      followUps: [
        { score: null, comment: 'Skipped' },
        { score: null, comment: 'Skipped' },
      ],
      strengths: [],
      gaps: ['Practise answering follow-ups: interviewers use them to test depth, and skipping them hides your thinking.'],
      summary: 'You skipped the follow-up questions, so this verdict is based on your written answer alone.',
    };
  } else {
    try {
      const { system, user } = buildVerdictPrompt(scenario, answer, t.fu, replies);
      const r = await runJsonTask({
        system,
        user,
        check: (o) => checkVerdict(o, replies),
        mock: () => mockVerdict(replies),
        beforeCall: quotaGuard(),
      });
      review = r.value;
      calls = r.calls;
      await logServer([
        ...aiCallEvents(r.calls, { kind: 'verdict', ...camel(ctx) }),
        { name: 'ai_task', ...ctx, props: { kind: 'verdict', ok: true, provider: r.provider, fallback: r.fallback, ms: r.latencyMs } },
      ]);
    } catch (e) {
      await logServer([
        ...aiCallEvents(e.calls, { kind: 'verdict', ...camel(ctx) }),
        { name: 'ai_task', ...ctx, props: { kind: 'verdict', ok: false, code: e.code } },
      ]);
      const msg =
        e.code === 'quota_guard'
          ? "The coach has reached today's capacity. Your replies are saved — please try again tomorrow."
          : 'The interviewer is busy right now. Your replies are saved — please try again in a minute.';
      return fail(res, 503, e.code === 'quota_guard' ? 'paused' : 'ai_busy', msg);
    }
  }
  void calls;

  const answered = review.followUps.filter((f) => f.score != null);
  const followUpScore = answered.length ? round1(answered.reduce((a, f) => a + f.score, 0) / answered.length) : null;
  const final = finalScore(t.s, followUpScore);
  const verdict = verdictKey(final);

  const done = await tryDb(() => db.hasCompletedScenario(visitorId, t.scn, sessionId), null);
  const practice = done.ok ? done.value : body.alreadyCompleted === true;
  const xp = computeXp({ final, firstScore: t.fs, latestScore: t.s, answeredBoth: answeredCount === 2, practice });

  const payload = {
    final,
    answerScore: t.s,
    firstScore: t.fs,
    followUpScore,
    verdict,
    followUps: t.fu.map((q, i) => ({ question: q, reply: replies[i], ...review.followUps[i] })),
    strengths: review.strengths,
    gaps: review.gaps,
    summary: review.summary,
    xp,
    practice,
  };

  const now = new Date().toISOString();
  const patch = {
    followup_score: followUpScore,
    final_score: final,
    verdict,
    xp: xp.total,
    practice,
    completed_at: now,
    verdict_payload: payload,
  };
  const saved =
    existing.ok && existing.value
      ? await tryDb(() => db.updateSession(sessionId, patch))
      : await tryDb(() =>
          db.insertSession({
            id: sessionId,
            visitor_id: visitorId,
            scenario_id: t.scn,
            day: istDay(),
            started_at: now,
            first_score: t.fs,
            latest_score: t.s,
            answer_text: answer,
            ...patch,
          })
        );

  await logServer([{ name: 'verdict_recorded', ...ctx, props: { final, verdict, xp: xp.total, practice, answered: answeredCount } }]);
  send(res, 200, { ...payload, saved: saved.ok });
});

function camel(ctx) {
  return { visitorId: ctx.visitor_id, sessionId: ctx.session_id, scenarioId: ctx.scenario_id };
}
