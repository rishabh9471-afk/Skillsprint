// POST /api/recover — restore a guest profile from a recovery code { code }
import { handler, getBody, send, fail } from '../server/http.js';
import { normaliseCode } from '../server/validate.js';
import { db, tryDb } from '../server/db.js';

export default handler(['POST'], async (req, res) => {
  const code = normaliseCode(getBody(req).code);
  if (!code) return fail(res, 400, 'bad_code', 'Codes look like SPRINT-7K2P9X. Please check and try again.');

  const found = await tryDb(() => db.findVisitorByCode(code), null);
  if (!found.ok) return fail(res, 503, 'db_unavailable', "We can't check codes right now. Please try again in a few minutes.");
  if (!found.value) return fail(res, 404, 'not_found', "We couldn't find that code. Please check it and try again.");

  const v = found.value;
  const sessions = (await tryDb(() => db.visitorSessions(v.id), [])).value;
  const completed = {};
  let totalXp = 0;
  for (const s of sessions) {
    if (s.xp > 0) {
      completed[s.scenario_id] = { xp: s.xp, verdict: s.verdict, final: Number(s.final_score) };
      totalXp += s.xp;
    }
  }
  send(res, 200, {
    visitorId: v.id,
    nickname: v.nickname,
    tag: v.tag,
    recoveryCode: v.recovery_code,
    completed,
    totalXp,
  });
});
