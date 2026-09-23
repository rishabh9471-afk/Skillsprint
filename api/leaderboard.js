// GET /api/leaderboard?visitorId= — this week's top 10 by XP (Mon–Sun, IST) + your rank
import { handler, getQuery, send, fail } from '../server/http.js';
import { isUuid } from '../server/validate.js';
import { db, tryDb } from '../server/db.js';
import { istWeekStart } from '../server/time.js';

export default handler(['GET'], async (req, res) => {
  const { visitorId } = getQuery(req);
  const me = isUuid(visitorId) ? visitorId : null;
  const weekStart = istWeekStart();

  const rows = await tryDb(() => db.completedSince(weekStart.toISOString()), null);
  if (!rows.ok) return fail(res, 503, 'unavailable', 'The leaderboard is temporarily unavailable.');

  const totals = new Map();
  for (const r of rows.value) totals.set(r.visitor_id, (totals.get(r.visitor_id) || 0) + r.xp);
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);

  const top = ranked.slice(0, 10);
  const myIndex = me ? ranked.findIndex(([id]) => id === me) : -1;
  const ids = top.map(([id]) => id);
  if (myIndex >= 10) ids.push(me);

  const people = await tryDb(() => db.getVisitorsByIds(ids), []);
  const byId = Object.fromEntries((people.value || []).map((p) => [p.id, p]));
  const entry = ([id, xp], i) => ({
    rank: i + 1,
    nickname: byId[id]?.nickname || 'Guest',
    tag: byId[id]?.tag || '0000',
    xp,
    isMe: id === me,
  });

  send(res, 200, {
    weekStart: weekStart.toISOString(),
    players: ranked.length,
    entries: top.map(entry),
    me: myIndex >= 0 ? entry(ranked[myIndex], myIndex) : null,
  });
});
