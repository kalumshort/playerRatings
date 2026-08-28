import {
  differenceInCalendarDays,
  format,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";

/**
 * Shared fixture date/time formatting.
 *
 * The format strings used to be inlined at four separate call sites
 * (ScheduleContainer, FixtureListItem, SeasonOverview), which is how the
 * schedule ended up showing "EEE d MMM" in one place and "d MMM yyyy" in
 * another for the same fixture. Keep them here.
 *
 * NOTE: date-fns formats in the runtime's timezone, so the server (UTC) and a
 * non-UTC client can legitimately disagree. Anything rendered from these
 * helpers during SSR needs `suppressHydrationWarning`, and anything derived
 * from `Date.now()` (see `relativeKickoff`) must be gated behind `useMounted`.
 */

export const FIXTURE_DAY = "EEE d MMM";
export const FIXTURE_TIME = "HH:mm";
export const MONTH_KEY = "MMMM yyyy";

/** API-Football timestamps are seconds, not milliseconds. */
export const fixtureDate = (timestamp: number) => new Date(timestamp * 1000);

export function formatKickoff(timestamp: number) {
  if (!timestamp) return { dayMonth: "", time: "" };
  const date = fixtureDate(timestamp);
  return {
    dayMonth: format(date, FIXTURE_DAY),
    time: format(date, FIXTURE_TIME),
  };
}

/** Group label, e.g. "August 2026". */
export const monthKey = (timestamp: number) =>
  format(fixtureDate(timestamp), MONTH_KEY);

/**
 * Human-friendly distance from now, or null when the fixture is far enough away
 * that the absolute date says it better. Callers render this only after mount —
 * it reads the clock, so it can't be part of the SSR output.
 */
export function relativeKickoff(
  timestamp: number,
  now: Date = new Date(),
): string | null {
  if (!timestamp) return null;
  const date = fixtureDate(timestamp);

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";

  const days = differenceInCalendarDays(date, now);
  if (days > 0 && days <= 14) return `in ${days} days`;
  if (days < 0 && days >= -14) return `${Math.abs(days)} days ago`;

  return null;
}
