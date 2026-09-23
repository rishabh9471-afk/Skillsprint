// Shared by the browser app and the server functions.
export const LIMITS = {
  MIN_WORDS: 40, // below this, "Get feedback" stays disabled
  MAX_WORDS: 600, // typing is capped here
  GUIDE_MIN: 100, // soft guide shown to the user
  GUIDE_MAX: 300,
  MAX_REVISIONS: 2,
  FU_MIN_WORDS: 5, // follow-up answers
  FU_MAX_WORDS: 250,
  NICK_MIN: 3,
  NICK_MAX: 20,
};

export const SKILLS = {
  prioritization: { label: 'Prioritisation', color: 'orange' },
  metrics: { label: 'Metrics', color: 'blue' },
  'product-sense': { label: 'Product sense', color: 'green' },
  stakeholders: { label: 'Stakeholders', color: 'violet' },
};

export const VERDICTS = {
  strong: { label: 'Strong hire signal', tone: 'good' },
  borderline: { label: 'Borderline', tone: 'warn' },
  needs_work: { label: 'Needs work', tone: 'bad' },
};

export function countWords(text) {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Trim a text to at most n words, keeping the original spacing of the kept part. */
export function capWords(text, n) {
  const parts = (text || '').split(/(\s+)/);
  let words = 0;
  let out = '';
  for (const p of parts) {
    if (/\S/.test(p)) {
      if (words >= n) break;
      words += 1;
    }
    out += p;
  }
  return out;
}
