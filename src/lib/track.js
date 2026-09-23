/* Analytics events: queued in browser storage, sent in small batches,
 * retried later if the network or database is unavailable. */
import { api } from './api.js';
import { load, save, KEYS } from './storage.js';

let visitorId = null;
let timer = null;
let sending = false;

export function setTrackingVisitor(id) {
  visitorId = id;
  schedule(500);
}

export function track(name, { sessionId, scenarioId, ...props } = {}) {
  const queue = load(KEYS.queue, []);
  queue.push({ name, sessionId, scenarioId, props, ts: Date.now() });
  save(KEYS.queue, queue.slice(-500)); // cap if offline for a long time
  schedule(1500);
}

function schedule(ms) {
  clearTimeout(timer);
  timer = setTimeout(flush, ms);
}

export async function flush() {
  if (!visitorId || sending) return;
  const queue = load(KEYS.queue, []);
  if (!queue.length) return;
  sending = true;
  const batch = queue.slice(0, 50);
  try {
    await api.events(visitorId, batch);
    const rest = load(KEYS.queue, []).slice(batch.length);
    save(KEYS.queue, rest);
    if (rest.length) schedule(300);
  } catch {
    schedule(30000); // try again later
  } finally {
    sending = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => schedule(500));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
