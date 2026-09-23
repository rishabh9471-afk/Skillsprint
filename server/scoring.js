/* Scoring and XP rules (see the PRD, "Scoring and XP"). */

export const round1 = (n) => Math.round(n * 10) / 10;
export const clampScore = (n) => Math.min(10, Math.max(1, Number(n)));

/** Overall answer score = mean of the 4 rubric dimensions. */
export function overallFromDimensions(dims) {
  const scores = dims.map((d) => d.score);
  return round1(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Final = 70% answer + 30% follow-ups. If no follow-up was answered, the answer alone. */
export function finalScore(answerScore, followUpScore) {
  if (followUpScore == null) return round1(answerScore);
  return round1(0.7 * answerScore + 0.3 * followUpScore);
}

export function verdictKey(final) {
  if (final >= 8) return 'strong';
  if (final >= 6) return 'borderline';
  return 'needs_work';
}

/**
 * XP = final × 10, +15 if a revision raised the score by ≥ 1 point,
 * +10 if both follow-ups were answered. Practice replays earn 0.
 */
export function computeXp({ final, firstScore, latestScore, answeredBoth, practice }) {
  const base = Math.round(final * 10);
  const revisionBonus = latestScore - firstScore >= 1 ? 15 : 0;
  const followBonus = answeredBoth ? 10 : 0;
  const total = practice ? 0 : base + revisionBonus + followBonus;
  return { base, revisionBonus, followBonus, total, practice: Boolean(practice) };
}
