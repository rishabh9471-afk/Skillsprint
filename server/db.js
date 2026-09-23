/* Data access. Uses Supabase (Postgres) through its REST API when
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set; otherwise an in-memory
 * store (fine for local testing, NOT for production — data is lost on restart).
 *
 * Every function may throw. Callers wrap them with `tryDb` so the practice
 * journey keeps working even if the database is down or paused. */
import { config } from './config.js';

export const dbMode = () => (config.useSupabase ? 'supabase' : 'memory');

export async function tryDb(fn, fallback) {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    console.error('[db]', e.message);
    return { ok: false, value: fallback };
  }
}

// ------------------------------------------------------------ Supabase REST

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const headers = { apikey: config.supabaseKey, 'Content-Type': 'application/json' };
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys must not.
  if (config.supabaseKey.startsWith('eyJ')) headers.Authorization = `Bearer ${config.supabaseKey}`;
  if (prefer) headers.Prefer = prefer;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  let res;
  try {
    res = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${method} ${path.split('?')[0]} → ${res.status} ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const enc = encodeURIComponent;

/** Page through a select (Supabase returns at most 1,000 rows per request). */
async function selectAll(pathWithQuery, max = 50000) {
  const out = [];
  for (let offset = 0; offset < max; offset += 1000) {
    const rows = await rest(`${pathWithQuery}&limit=1000&offset=${offset}`);
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

const supa = {
  async createVisitor(v) {
    await rest('visitors', { method: 'POST', body: v, prefer: 'return=minimal' });
  },
  async findVisitorByCode(code) {
    const rows = await rest(`visitors?recovery_code=eq.${enc(code)}&select=*&limit=1`);
    return rows[0] || null;
  },
  async getVisitor(id) {
    const rows = await rest(`visitors?id=eq.${id}&select=*&limit=1`);
    return rows[0] || null;
  },
  async getVisitorsByIds(ids) {
    if (!ids.length) return [];
    return rest(`visitors?id=in.(${ids.join(',')})&select=id,nickname,tag`);
  },
  async countSessionsOnDay(visitorId, day, excludeId) {
    const rows = await rest(`sessions?visitor_id=eq.${visitorId}&day=eq.${day}&select=id`);
    return rows.filter((r) => r.id !== excludeId).length;
  },
  async getSession(id) {
    const rows = await rest(`sessions?id=eq.${id}&select=*&limit=1`);
    return rows[0] || null;
  },
  async insertSession(row) {
    await rest('sessions?on_conflict=id', { method: 'POST', body: row, prefer: 'resolution=merge-duplicates,return=minimal' });
  },
  async updateSession(id, patch) {
    await rest(`sessions?id=eq.${id}`, { method: 'PATCH', body: patch, prefer: 'return=minimal' });
  },
  async hasCompletedScenario(visitorId, scenarioId, excludeId) {
    const rows = await rest(
      `sessions?visitor_id=eq.${visitorId}&scenario_id=eq.${enc(scenarioId)}&xp=gt.0&id=neq.${excludeId}&select=id&limit=1`
    );
    return rows.length > 0;
  },
  async visitorSessions(visitorId) {
    return rest(`sessions?visitor_id=eq.${visitorId}&select=id,scenario_id,day,xp,verdict,final_score,completed_at&order=started_at.asc`);
  },
  async completedSince(iso) {
    return selectAll(`sessions?completed_at=gte.${enc(iso)}&xp=gt.0&select=visitor_id,xp&order=completed_at.asc`);
  },
  async getUsage(day) {
    const rows = await rest(`usage?day=eq.${day}&select=requests`);
    return rows[0]?.requests || 0;
  },
  async bumpUsage(day, n) {
    const r = await rest('rpc/bump_usage', { method: 'POST', body: { p_day: day, p_n: n } });
    return Number(r) || 0;
  },
  async insertEvents(rows) {
    if (!rows.length) return;
    await rest('events', { method: 'POST', body: rows, prefer: 'return=minimal' });
  },
  async eventsBetween(fromIso, toIso) {
    return selectAll(
      `events?ts=gte.${enc(fromIso)}&ts=lt.${enc(toIso)}&select=visitor_id,session_id,scenario_id,name,props,ts,source&order=id.asc`
    );
  },
  async sessionsBetween(fromIso, toIso) {
    return selectAll(
      `sessions?started_at=gte.${enc(fromIso)}&started_at=lt.${enc(toIso)}&select=id,visitor_id,scenario_id,day,started_at,first_score,latest_score,revisions,final_score,verdict,xp,practice,completed_at,provider&order=started_at.asc`
    );
  },
  async usageBetween(fromDay, toDay) {
    return rest(`usage?day=gte.${fromDay}&day=lte.${toDay}&select=day,requests&order=day.asc`);
  },
  async ping() {
    await rest('usage?select=day&limit=1');
  },
};

// ------------------------------------------------------------ In-memory

const mem = (globalThis.__skillsprintMem ||= { visitors: [], sessions: [], events: [], usage: {} });

const memory = {
  async createVisitor(v) {
    mem.visitors.push({ ...v, created_at: new Date().toISOString() });
  },
  async findVisitorByCode(code) {
    return mem.visitors.find((v) => v.recovery_code === code) || null;
  },
  async getVisitor(id) {
    return mem.visitors.find((v) => v.id === id) || null;
  },
  async getVisitorsByIds(ids) {
    return mem.visitors.filter((v) => ids.includes(v.id));
  },
  async countSessionsOnDay(visitorId, day, excludeId) {
    return mem.sessions.filter((s) => s.visitor_id === visitorId && s.day === day && s.id !== excludeId).length;
  },
  async getSession(id) {
    return mem.sessions.find((s) => s.id === id) || null;
  },
  async insertSession(row) {
    const i = mem.sessions.findIndex((s) => s.id === row.id);
    const base = { xp: 0, revisions: 0, practice: false, started_at: new Date().toISOString() };
    if (i >= 0) mem.sessions[i] = { ...mem.sessions[i], ...row };
    else mem.sessions.push({ ...base, ...row });
  },
  async updateSession(id, patch) {
    const s = mem.sessions.find((x) => x.id === id);
    if (s) Object.assign(s, patch);
  },
  async hasCompletedScenario(visitorId, scenarioId, excludeId) {
    return mem.sessions.some((s) => s.visitor_id === visitorId && s.scenario_id === scenarioId && s.xp > 0 && s.id !== excludeId);
  },
  async visitorSessions(visitorId) {
    return mem.sessions.filter((s) => s.visitor_id === visitorId);
  },
  async completedSince(iso) {
    return mem.sessions.filter((s) => s.completed_at && s.completed_at >= iso && s.xp > 0);
  },
  async getUsage(day) {
    return mem.usage[day] || 0;
  },
  async bumpUsage(day, n) {
    mem.usage[day] = (mem.usage[day] || 0) + n;
    return mem.usage[day];
  },
  async insertEvents(rows) {
    mem.events.push(...rows.map((r) => ({ ts: new Date().toISOString(), source: 'client', props: {}, ...r })));
  },
  async eventsBetween(fromIso, toIso) {
    return mem.events.filter((e) => e.ts >= fromIso && e.ts < toIso);
  },
  async sessionsBetween(fromIso, toIso) {
    return mem.sessions.filter((s) => s.started_at >= fromIso && s.started_at < toIso);
  },
  async usageBetween(fromDay, toDay) {
    return Object.entries(mem.usage)
      .filter(([d]) => d >= fromDay && d <= toDay)
      .map(([day, requests]) => ({ day, requests }));
  },
  async ping() {},
};

export const db = new Proxy(
  {},
  {
    get(_, prop) {
      return (config.useSupabase ? supa : memory)[prop];
    },
  }
);
