// ─── Team Members (rotation order) ────────────────────────────────────────────
export const MEMBERS = import.meta.env.APP_TEAM_MEMBERS.split(',').map(s => s.trim());

// ─── Anchor Dates ──────────────────────────────────────────────────────────────
// Member[0] (Alex) is the first host on these dates.
// Weekly  : weekdays starting Monday, Jan 6 2025
// Biweekly: every other Tuesday, starting Jan 7 2025
const WEEKLY_ANCHOR   = new Date(2024, 11, 30); // Mon Dec 30 2024
const BIWEEKLY_ANCHOR = new Date(2026,  3,  7); // Tue Apr 7 2026

const MS_PER_DAY = 86_400_000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Count weekdays (Mon–Fri) inclusive from startDate to endDate.
 * Uses the "full-weeks + remainder" approach to avoid slow day-by-day iteration.
 */
function countWeekdaysInclusive(startDate, endDate) {
  const start = startOfDay(startDate);
  const end   = startOfDay(endDate);
  const totalDays = Math.round((end - start) / MS_PER_DAY) + 1;
  const fullWeeks = Math.floor(totalDays / 7);
  let count = fullWeeks * 5;
  const remainder = totalDays % 7;
  const startDow = start.getDay(); // 0 = Sun, 6 = Sat
  for (let i = 0; i < remainder; i++) {
    const dow = (startDow + i) % 7;
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function nextWeekdayOnOrAfter(date) {
  const d = startOfDay(date);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

function nextWeekdayAfter(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return nextWeekdayOnOrAfter(d);
}

// ─── Weekly Meeting ────────────────────────────────────────────────────────────

/**
 * Return the weekly-meeting host for a given date, or null if weekend / pre-anchor.
 * @returns {{ host: string, memberIndex: number, date: Date } | null}
 */
export function getWeeklyHost(date = new Date(), members = MEMBERS) {
  const d   = startOfDay(date);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return null;

  const anchor = startOfDay(WEEKLY_ANCHOR);
  if (d < anchor) return null;

  // Rotate one host per week — find Monday of current week
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow - 1));

  const daysDiff    = Math.round((monday - anchor) / MS_PER_DAY);
  const weekCount   = Math.round(daysDiff / 7);
  const memberIndex = weekCount % members.length;
  return { host: members[memberIndex], memberIndex, date: d };
}

/**
 * Return the next `count` weekday entries starting on or after `fromDate`.
 */
export function getUpcomingWeekly(fromDate = new Date(), count = 5, members = MEMBERS) {
  const results = [];
  let cursor = nextWeekdayOnOrAfter(fromDate);
  for (let i = 0; i < count; i++) {
    const entry = getWeeklyHost(cursor, members);
    if (entry) results.push(entry);
    cursor = nextWeekdayAfter(cursor);
  }
  return results;
}

// ─── Biweekly Meeting ──────────────────────────────────────────────────────────

/**
 * Return true if `date` falls on a biweekly Tuesday (anchor + N×14 days).
 */
export function isBiweeklyTuesday(date = new Date()) {
  const d      = startOfDay(date);
  const anchor = startOfDay(BIWEEKLY_ANCHOR);
  if (d.getDay() !== 2 || d < anchor) return false;
  const daysDiff = Math.round((d - anchor) / MS_PER_DAY);
  return daysDiff % 14 === 0;
}

/**
 * Return the biweekly-meeting host for a given date, or null if not a biweekly Tuesday.
 * @returns {{ host: string, memberIndex: number, date: Date } | null}
 */
export function getBiweeklyHost(date = new Date(), members = MEMBERS) {
  const d = startOfDay(date);
  if (!isBiweeklyTuesday(d)) return null;
  const anchor   = startOfDay(BIWEEKLY_ANCHOR);
  const daysDiff = Math.round((d - anchor) / MS_PER_DAY);
  const memberIndex = (daysDiff / 14) % members.length;
  return { host: members[memberIndex], memberIndex, date: d };
}

/**
 * Return the next `count` biweekly Tuesdays starting on or after `fromDate`.
 * If `fromDate` is itself a biweekly Tuesday it is included as the first entry.
 */
export function getUpcomingBiweekly(fromDate = new Date(), count = 3, members = MEMBERS) {
  const d        = startOfDay(fromDate);
  const anchor   = startOfDay(BIWEEKLY_ANCHOR);
  const daysDiff = Math.max(0, Math.round((d - anchor) / MS_PER_DAY));
  // Math.ceil handles: exact match → same index; non-exact → next index
  const startBiweek = Math.ceil(daysDiff / 14);

  return Array.from({ length: count }, (_, i) => {
    const offset      = (startBiweek + i) * 14;
    const nextDate    = startOfDay(BIWEEKLY_ANCHOR);
    nextDate.setDate(nextDate.getDate() + offset);
    const memberIndex = (startBiweek + i) % members.length;
    return { date: nextDate, host: members[memberIndex], memberIndex };
  });
}
