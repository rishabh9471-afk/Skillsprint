import { LIMITS } from '../src/shared/limits.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

/** Normalise user text: strip control characters, trim, limit blank lines. */
export function cleanText(v) {
  if (typeof v !== 'string') return '';
  return v
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// A short, deliberately conservative list; extend as needed.
const BLOCKED = [
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'bastard', 'slut', 'whore', 'nigg', 'fag', 'rape',
  'chutiya', 'madarchod', 'behenchod', 'bhenchod', 'bhosdi', 'gandu', 'randi', 'lund', 'chod', 'harami', 'kutta', 'kamina',
  'admin', 'moderator', 'skillsprint',
];

export function checkNickname(raw) {
  const nick = cleanText(raw).replace(/\s+/g, ' ');
  if (nick.length < LIMITS.NICK_MIN || nick.length > LIMITS.NICK_MAX) {
    return { ok: false, message: `Nickname must be ${LIMITS.NICK_MIN}–${LIMITS.NICK_MAX} characters.` };
  }
  if (!/^[\p{L}\p{N} _.-]+$/u.test(nick)) {
    return { ok: false, message: 'Use letters, numbers, spaces, dots, dashes or underscores only.' };
  }
  const squashed = nick.toLowerCase().replace(/[^a-z]/g, '').replace(/0/g, 'o').replace(/1/g, 'i');
  if (BLOCKED.some((w) => squashed.includes(w))) {
    return { ok: false, message: "That nickname isn't allowed. Please choose another." };
  }
  return { ok: true, nickname: nick };
}

// Recovery codes avoid look-alike characters (0/O, 1/I/L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function makeRecoveryCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'SPRINT-' + Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}
export function normaliseCode(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = s.startsWith('SPRINT') ? s.slice(6) : s;
  return body.length === 6 ? `SPRINT-${body}` : null;
}
export function makeTag() {
  return String(1000 + (crypto.getRandomValues(new Uint16Array(1))[0] % 9000));
}

/** Lower-case, strip punctuation and collapse whitespace — for fuzzy text matching. */
export function normForMatch(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[“”"'‘’`]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitSentences(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Make sure a quote really comes from the answer. Returns the verified quote,
 * the closest real sentence, or null if nothing matches well enough.
 */
export function verifyQuote(quote, answer) {
  const q = normForMatch(quote);
  if (!q) return null;
  const a = normForMatch(answer);
  if (a.includes(q)) return quote.trim().replace(/^["“]|["”]$/g, '');
  const qWords = new Set(q.split(' '));
  let best = null;
  let bestScore = 0;
  for (const s of splitSentences(answer)) {
    const sw = normForMatch(s).split(' ');
    if (!sw.length) continue;
    const overlap = sw.filter((w) => qWords.has(w)).length / Math.max(qWords.size, sw.length);
    if (overlap > bestScore) {
      bestScore = overlap;
      best = s;
    }
  }
  return bestScore >= 0.5 ? best : null;
}
