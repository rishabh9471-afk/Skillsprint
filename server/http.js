/* Small helpers so API handlers work the same on Vercel and in local dev. */

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export function fail(res, status, code, message, extra = {}) {
  send(res, status, { error: code, message, ...extra });
}

export function getBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return typeof b === 'object' ? b : {};
}

export function getQuery(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  try {
    return Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  } catch {
    return {};
  }
}

/** Wrap a handler: method check + uniform error handling. */
export function handler(methods, fn) {
  return async function wrapped(req, res) {
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '));
      return fail(res, 405, 'method_not_allowed', 'Method not allowed');
    }
    try {
      await fn(req, res);
    } catch (err) {
      console.error('[api error]', err);
      if (!res.headersSent) fail(res, 500, 'server_error', 'Something went wrong on our side. Please try again.');
    }
  };
}
