/* Signed session tokens.
 * After each grading the server returns a token that records the facts it
 * trusts (scores, follow-up questions, answer fingerprint, revision number).
 * The next step must present that token, so scores, XP and revision limits
 * cannot be faked from the browser — and no database read is needed. */
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { normForMatch } from './validate.js';

const b64 = (buf) => Buffer.from(buf).toString('base64url');

export function signToken(payload) {
  const body = b64(JSON.stringify({ ...payload, iat: Date.now() }));
  const sig = createHmac('sha256', config.sessionSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = createHmac('sha256', config.sessionSecret).update(body).digest('base64url');
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data.iat || Date.now() - data.iat > MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

/** Fingerprint of an answer, insensitive to spacing and punctuation. */
export function answerHash(text) {
  return createHash('sha256').update(normForMatch(text)).digest('base64url').slice(0, 22);
}

export function safeEqual(a, b) {
  const x = createHash('sha256').update(String(a)).digest();
  const y = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(x, y);
}
