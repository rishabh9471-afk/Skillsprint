// POST /api/visitor — create a guest profile { nickname } → { visitorId, nickname, tag, recoveryCode, saved }
import { handler, getBody, send, fail } from '../server/http.js';
import { checkNickname, makeRecoveryCode, makeTag } from '../server/validate.js';
import { db, tryDb, dbMode } from '../server/db.js';

export default handler(['POST'], async (req, res) => {
  const { nickname } = getBody(req);
  const check = checkNickname(nickname);
  if (!check.ok) return fail(res, 400, 'bad_nickname', check.message);

  const visitor = {
    id: crypto.randomUUID(),
    nickname: check.nickname,
    tag: makeTag(),
    recovery_code: makeRecoveryCode(),
  };
  // One retry in the (very unlikely) case of a duplicate recovery code.
  let r = await tryDb(() => db.createVisitor(visitor));
  if (!r.ok) {
    visitor.recovery_code = makeRecoveryCode();
    r = await tryDb(() => db.createVisitor(visitor));
  }
  send(res, 200, {
    visitorId: visitor.id,
    nickname: visitor.nickname,
    tag: visitor.tag,
    recoveryCode: visitor.recovery_code,
    saved: r.ok, // false → database unavailable; recovery code won't work
    storage: dbMode(),
  });
});
