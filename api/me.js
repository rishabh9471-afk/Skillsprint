// GET /api/me?visitorId= — today's limit, pause state and progress for the home screen
import { handler, getQuery, send, fail } from '../server/http.js';
import { isUuid } from '../server/validate.js';
import { db, tryDb, dbMode } from '../server/db.js';
import { config } from '../server/config.js';
import { istDay } from '../server/time.js';
import { newSessionsPaused } from '../server/usage.js';
import { aiConfigured } from '../server/ai.js';

export default handler(['GET'], async (req, res) => {
  const { visitorId } = getQuery(req);
  if (!isUuid(visitorId)) return fail(res, 400, 'bad_visitor', 'Missing visitor id');

  const today = istDay();
  const sessions = await tryDb(() => db.visitorSessions(visitorId), []);
  const rows = sessions.value || [];
  const startedToday = rows.filter((s) => s.day === today).length;
  const completed = {};
  let totalXp = 0;
  for (const s of rows) {
    if (s.xp > 0) {
      completed[s.scenario_id] = { xp: s.xp, verdict: s.verdict, final: Number(s.final_score) };
      totalXp += s.xp;
    }
  }
  const limit = config.dailyScenarioLimit;
  send(res, 200, {
    dailyLimit: limit,
    startedToday,
    remaining: Math.max(0, limit - startedToday),
    paused: await newSessionsPaused(),
    aiReady: aiConfigured(),
    completed,
    totalXp,
    dbConnected: sessions.ok,
    storage: dbMode(),
  });
});
