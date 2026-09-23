// POST /api/dashboard — metrics for the private dashboard. body: { password, days }
import { handler, getBody, send, fail } from '../server/http.js';
import { safeEqual } from '../server/token.js';
import { db, tryDb, dbMode } from '../server/db.js';
import { config } from '../server/config.js';
import { istDay, istDayStart } from '../server/time.js';
import { computeMetrics } from '../server/metrics.js';
import { scenarios } from '../src/shared/scenarios.js';

const RANGES = [1, 7, 30, 90];

export default handler(['POST'], async (req, res) => {
  const { password, days: rawDays } = getBody(req);
  if (!config.dashboardPassword) {
    return fail(res, 503, 'not_configured', 'Set DASHBOARD_PASSWORD in Vercel to enable the dashboard.');
  }
  if (typeof password !== 'string' || !safeEqual(password, config.dashboardPassword)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return fail(res, 401, 'wrong_password', 'Wrong password.');
  }
  const days = RANGES.includes(Number(rawDays)) ? Number(rawDays) : 7;

  const now = new Date();
  const toDay = istDay(now);
  const fromDay = istDay(new Date(now.getTime() - (days - 1) * 86400000));
  const fromIso = istDayStart(fromDay).toISOString();
  const toIso = new Date(istDayStart(toDay).getTime() + 86400000).toISOString();

  const [events, sessions, usage] = await Promise.all([
    tryDb(() => db.eventsBetween(fromIso, toIso), []),
    tryDb(() => db.sessionsBetween(fromIso, toIso), []),
    tryDb(() => db.usageBetween(fromDay, toDay), []),
  ]);
  if (!events.ok || !sessions.ok) {
    return fail(res, 503, 'db_unavailable', 'Could not reach the database. If your Supabase project is paused, resume it from the Supabase dashboard.');
  }

  const metrics = computeMetrics({
    events: events.value,
    sessions: sessions.value,
    usage: usage.value || [],
    fromDay,
    toDay,
    scenarios,
    cap: config.globalDailyAiCap,
  });
  send(res, 200, {
    ...metrics,
    range: { days, fromDay, toDay },
    storage: dbMode(),
    settings: { dailyScenarioLimit: config.dailyScenarioLimit, globalDailyAiCap: config.globalDailyAiCap },
    generatedAt: now.toISOString(),
  });
});
