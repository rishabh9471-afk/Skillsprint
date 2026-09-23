// GET /api/ping — keeps the free Supabase project from pausing (called daily by Vercel Cron)
import { handler, send } from '../server/http.js';
import { db, tryDb, dbMode } from '../server/db.js';

export default handler(['GET'], async (req, res) => {
  const r = await tryDb(() => db.ping());
  send(res, r.ok ? 200 : 503, { ok: r.ok, storage: dbMode(), at: new Date().toISOString() });
});
