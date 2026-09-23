// Days and weeks are counted in India Standard Time (UTC+5:30).
const IST_OFFSET_MS = 330 * 60 * 1000;

/** 'YYYY-MM-DD' for the IST calendar day of `d`. */
export function istDay(d = new Date()) {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The UTC instant of Monday 00:00 IST for the week containing `d`. */
export function istWeekStart(d = new Date()) {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const dow = (ist.getUTCDay() + 6) % 7; // Monday = 0
  ist.setUTCDate(ist.getUTCDate() - dow);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

/** The UTC instant of 00:00 IST on day 'YYYY-MM-DD'. */
export function istDayStart(day) {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() - IST_OFFSET_MS);
}
