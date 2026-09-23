/* localStorage that never throws. If storage is blocked (some private
 * windows), values live in memory for this visit and `storageOk` is false. */
const memory = new Map();
let ok = true;
try {
  const k = '__ss_test__';
  window.localStorage.setItem(k, '1');
  window.localStorage.removeItem(k);
} catch {
  ok = false;
}
export const storageOk = ok;

export function load(key, fallback = null) {
  try {
    const raw = ok ? window.localStorage.getItem(key) : memory.get(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  const raw = JSON.stringify(value);
  try {
    if (ok) window.localStorage.setItem(key, raw);
    else memory.set(key, raw);
  } catch {
    memory.set(key, raw);
  }
}

export function remove(key) {
  try {
    if (ok) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  memory.delete(key);
}

export const KEYS = {
  visitor: 'ss.visitor', // { id, nickname, tag, recoveryCode, codeSaved }
  progress: 'ss.progress', // { completed: { [scenarioId]: { xp, verdict, final } }, totalXp }
  active: 'ss.active', // the in-progress session (see App.jsx)
  queue: 'ss.queue', // unsent analytics events
  dash: 'ss.dash', // dashboard password for this browser session
};

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
