// Titles and descriptions for a fixture page.
//
// THE PROBLEM THIS SOLVES. Every fixture is reachable at two URLs — one per
// club hub — and both used to carry the identical title and description
// ("Arsenal vs Chelsea - Player Ratings"). The pages are not actually
// duplicates: ratings and predictions are fetched per group, so each hub shows
// its own fans' consensus. But identical titles and descriptions are the
// strongest duplicate signal there is, and Google resolves that by picking one
// URL and dropping the other with "Duplicate, Google chose a different
// canonical" — which is how half the fixture pages on the site quietly stop
// ranking.
//
// The fix is not a canonical pointing one hub at the other. That would be
// giving up: the Chelsea page is the only page on the internet carrying
// Chelsea fans' verdict on that match, and it should rank for
// "chelsea fan ratings" in its own right. The fix is to make the two pages
// look as different to a crawler as they genuinely are, by naming whose
// verdict each one is.
//
// The date solves a second and unrelated collision. Arsenal vs Chelsea happens
// twice a season and every season, so without a date every one of those pages
// competes with the others under one title.
//
// TITLE ORDER is deliberate: club first, matchup second, date last. Titles are
// truncated around 60 characters and some Premier League pairings blow through
// that on their own ("Nottingham Forest vs Manchester United" is 38 before
// anything else is added). Leading with the club means the part that
// distinguishes the two URLs survives the truncation, and the date — the least
// load-bearing token — is the first thing lost.

import { getFixtureState } from "@/lib/utils/football-logic";

/**
 * Kickoff dates are rendered in UK time regardless of where the server sits.
 *
 * Cloud Run runs UTC, so a 20:00 BST kickoff formats as 19:00 the same day and
 * is harmless — but an evening kickoff either side of midnight UTC would print
 * the wrong date, and a title that disagrees with the page body about which day
 * the match was is exactly the sort of thing that gets a page distrusted.
 */
const KICKOFF_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London",
});

/** "12 Jan 2026", or null when the fixture doc predates the timestamp field. */
export function kickoffLabel(fixture: any): string | null {
  const seconds = fixture?.fixture?.timestamp;
  const iso = fixture?.fixture?.date;

  const date =
    typeof seconds === "number"
      ? new Date(seconds * 1000)
      : iso
        ? new Date(iso)
        : null;

  if (!date || Number.isNaN(date.getTime())) return null;
  return KICKOFF_DATE.format(date);
}

/**
 * What the page is offering, which changes as the match does. Calling an
 * unplayed fixture's page "Player Ratings" is not just weak SEO — there are no
 * ratings on it yet, and a title that promises them is the kind of mismatch
 * that produces a bounce straight back to the results page.
 */
function offering(fixture: any): "ratings" | "predictions" {
  const state = getFixtureState(fixture);
  // Ratings open at 80', so an in-play match is already a ratings page.
  return state === "postmatch" || state === "inplay" ? "ratings" : "predictions";
}

interface FixtureMetaArgs {
  fixture: any;
  /** The hub this URL belongs to — the whole point of the differentiation. */
  clubName: string;
}

/**
 * e.g. "Arsenal Fan Ratings: Arsenal vs Chelsea, 12 Jan 2026"
 *
 * The club name repeating is intentional, not an oversight. It reads
 * naturally, it is the differentiator between the two URLs, and it matches the
 * query people actually type ("arsenal player ratings"). For a community group
 * that is not one of the two teams it reads just as well — "The United Stand
 * Fan Ratings: Arsenal vs Chelsea".
 */
export function fixtureTitle({ fixture, clubName }: FixtureMetaArgs): string {
  const home = fixture?.teams?.home?.name ?? "";
  const away = fixture?.teams?.away?.name ?? "";
  const date = kickoffLabel(fixture);

  const label =
    offering(fixture) === "ratings" ? "Fan Ratings" : "Fan Predictions";

  const matchup = `${home} vs ${away}`;

  return [`${clubName} ${label}: ${matchup}`, date]
    .filter(Boolean)
    .join(", ");
}

/**
 * Descriptions are differentiated on the same axis as titles, and for the same
 * reason — two identical meta descriptions across two URLs is the second
 * duplicate signal after the title.
 */
export function fixtureDescription({
  fixture,
  clubName,
}: FixtureMetaArgs): string {
  const home = fixture?.teams?.home?.name ?? "";
  const away = fixture?.teams?.away?.name ?? "";
  const date = kickoffLabel(fixture);
  const matchup = `${home} vs ${away}`;
  const when = date ? ` on ${date}` : "";

  if (offering(fixture) === "ratings") {
    return `How ${clubName} fans rated every player in ${matchup}${when}, plus the Man of the Match vote and the fan consensus.`;
  }

  return `${clubName} fans' predictions for ${matchup}${when} — the score prediction, the fan XI and the pre-match Man of the Match vote.`;
}
