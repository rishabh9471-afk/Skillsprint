// POST /api/events — batched usage events from the browser
// body: { visitorId, events: [{ name, sessionId?, scenarioId?, props?, ts? }] }
import { handler, getBody, send, fail } from '../server/http.js';
import { isUuid } from '../server/validate.js';
import { scenarioById } from '../src/shared/scenarios.js';
import { db, tryDb } from '../server/db.js';

export const CLIENT_EVENTS = new Set([
  'app_open',
  'onboarded',
  'recovered',
  'scenario_opened',
  'answer_submitted',
  'feedback_shown',
  'feedback_rated',
  'chose_revise',
  'chose_interview',
  'followup_answered',
  'followup_skipped',
  'verdict_shown',
  'limit_seen',
  'leaderboard_viewed',
  'error_shown',
  'code_copied',
  'session_abandoned',
]);

const THREE_DAYS = 3 * 24 * 3600 * 1000;

export default handler(['POST'], async (req, res) => {
  const { visitorId, events } = getBody(req);
  if (!isUuid(visitorId)) return fail(res, 400, 'bad_visitor', 'Missing visitor id');
  if (!Array.isArray(events)) return fail(res, 400, 'bad_events', 'events must be an array');

  const now = Date.now();
  const rows = [];
  for (const e of events.slice(0, 50)) {
    if (!e || !CLIENT_EVENTS.has(e.name)) continue;
    let props = e.props && typeof e.props === 'object' ? e.props : {};
    if (JSON.stringify(props).length > 1000) props = {};
    // Keep the browser's timestamp (events can be queued offline) if it is plausible.
    const ts = Number(e.ts);
    const when = Number.isFinite(ts) && ts <= now + 5 * 60000 && now - ts <= THREE_DAYS ? ts : now;
    rows.push({
      visitor_id: visitorId,
      session_id: isUuid(e.sessionId) ? e.sessionId : null,
      scenario_id: scenarioById[e.scenarioId] ? e.scenarioId : null,
      name: e.name,
      props,
      ts: new Date(when).toISOString(),
      source: 'client',
    });
  }
  const r = await tryDb(() => db.insertEvents(rows));
  if (!r.ok) return fail(res, 503, 'db_unavailable', 'Could not store events');
  send(res, 200, { stored: rows.length });
});
