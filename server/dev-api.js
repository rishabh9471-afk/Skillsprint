/* Runs the /api/*.js Vercel functions inside the Vite dev server, so
 * `npm run dev` works locally without the Vercel CLI. Not used in production. */

export async function runHandler(handler, req, res) {
  const url = new URL(req.url, 'http://localhost');
  req.query = Object.fromEntries(url.searchParams);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = raw;
    }
  }
  await handler(req, res);
}

export function apiDevServer() {
  return {
    name: 'skillsprint-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!url.pathname.startsWith('/api/')) return next();
        const name = url.pathname.slice(5).replace(/\/$/, '');
        if (!/^[a-z-]+$/.test(name)) {
          res.statusCode = 404;
          return res.end('Not found');
        }
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          await runHandler(mod.default, req, res);
        } catch (e) {
          console.error(e);
          res.statusCode = e.code === 'ERR_LOAD_URL' ? 404 : 500;
          res.end(JSON.stringify({ error: 'dev_server_error', message: e.message }));
        }
      });
    },
  };
}
