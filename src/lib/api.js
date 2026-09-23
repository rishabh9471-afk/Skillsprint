/* Calls to our /api functions. Errors come back as ApiError with a `code`
 * the UI can act on (e.g. 'daily_limit', 'ai_busy', 'offline', 'timeout'). */

export class ApiError extends Error {
  constructor(code, message, status = 0, data = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

const MESSAGES = {
  offline: "You're offline. Your work is saved — reconnect and try again.",
  timeout: 'The coach is taking too long. Your work is saved — please try again.',
  network: "Couldn't reach SkillSprint. Check your connection and try again.",
};

async function request(path, { method = 'GET', body, timeoutMs = 20000 } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError('offline', MESSAGES.offline);
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`/api/${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw new ApiError('timeout', MESSAGES.timeout);
    throw new ApiError(navigator.onLine === false ? 'offline' : 'network', navigator.onLine === false ? MESSAGES.offline : MESSAGES.network);
  } finally {
    clearTimeout(timer);
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    throw new ApiError(data.error || `http_${res.status}`, data.message || 'Something went wrong. Please try again.', res.status, data);
  }
  return data;
}

export const api = {
  createVisitor: (nickname) => request('visitor', { method: 'POST', body: { nickname } }),
  recover: (code) => request('recover', { method: 'POST', body: { code } }),
  me: (visitorId) => request(`me?visitorId=${encodeURIComponent(visitorId)}`),
  grade: (body) => request('grade', { method: 'POST', body, timeoutMs: 75000 }),
  verdict: (body) => request('verdict', { method: 'POST', body, timeoutMs: 75000 }),
  leaderboard: (visitorId) => request(`leaderboard?visitorId=${encodeURIComponent(visitorId || '')}`),
  events: (visitorId, events) => request('events', { method: 'POST', body: { visitorId, events } }),
  dashboard: (password, days) => request('dashboard', { method: 'POST', body: { password, days } }),
};
