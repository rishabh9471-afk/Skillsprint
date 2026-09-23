/* Global daily AI cap and server-side event logging. */
import { config } from './config.js';
import { db, tryDb } from './db.js';
import { AiError } from './ai.js';
import { istDay } from './time.js';

// Fallback counter if the database is unreachable (per server instance).
const local = (globalThis.__skillsprintUsage ||= { day: '', n: 0 });

/** Requests used today, or null if unknown. */
export async function usageToday() {
  const r = await tryDb(() => db.getUsage(istDay()), null);
  return r.ok ? r.value : local.day === istDay() ? local.n : 0;
}

/** New sessions stop at the cap; sessions already in progress may use up to 10% more. */
export async function newSessionsPaused() {
  const used = await usageToday();
  return used >= config.globalDailyAiCap;
}

/** Called right before every AI request: counts it, and blocks it past the hard cap. */
export function quotaGuard() {
  return async () => {
    const day = istDay();
    const r = await tryDb(() => db.bumpUsage(day, 1), null);
    let used;
    if (r.ok) used = r.value;
    else {
      if (local.day !== day) Object.assign(local, { day, n: 0 });
      used = ++local.n;
    }
    if (used > Math.ceil(config.globalDailyAiCap * 1.1)) {
      throw new AiError('quota_guard', 'Daily AI cap reached');
    }
  };
}

/** Log server-side events without ever failing the request. */
export async function logServer(events) {
  // Every row gets the same columns (Supabase bulk inserts require matching keys).
  const ts = new Date().toISOString();
  const rows = events.map((e) => ({
    visitor_id: e.visitor_id ?? null,
    session_id: e.session_id ?? null,
    scenario_id: e.scenario_id ?? null,
    name: e.name,
    props: e.props || {},
    ts,
    source: 'server',
  }));
  await tryDb(() => db.insertEvents(rows));
}

/** One 'ai_call' event per provider request. */
export function aiCallEvents(calls, { kind, visitorId, sessionId, scenarioId }) {
  return (calls || []).map((c, i) => ({
    name: 'ai_call',
    visitor_id: visitorId,
    session_id: sessionId,
    scenario_id: scenarioId,
    props: { kind, provider: c.provider, ok: c.ok, code: c.code || null, ms: c.ms, fallback: i > 0 && c.provider !== calls[0].provider },
  }));
}
