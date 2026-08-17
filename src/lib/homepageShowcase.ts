// Real entities used to populate the marketing homepage demos.
//
// The demos on `/` used to run on invented players and vote counts. They now
// render real crests, real squad names and real match events pulled from the
// same collections the app itself reads, so the homepage shows the actual
// product rather than a mock-up of it.
//
// The interaction numbers in those panels (vote percentages) are still
// illustrative — there isn't enough real voting data to show honestly yet — so
// every panel carries an EXAMPLE label. See DemoFrame.

export interface ShowcaseFixture {
  matchId: string;
  homeName: string;
  homeLogo: string;
  awayName: string;
  awayLogo: string;
}

export interface ShowcasePlayer {
  id: string;
  name: string;
  photo: string;
}

/** Shape MoodAreaChart expects — a subset of the API-Football event object. */
export interface ShowcaseEvent {
  time: { elapsed: number; extra?: number | null };
  type: string;
  detail?: string;
  player?: { name?: string };
  assist?: { name?: string };
}

export interface HomepageShowcase {
  fixture: ShowcaseFixture | null;
  players: ShowcasePlayer[];
  /** Real goals/cards/subs from `fixture`, drawn on the pulse chart. */
  events: ShowcaseEvent[];
}

/**
 * Every demo panel must render from this. A cold season, a failed read or a
 * fresh project all land here, and the homepage still has to work.
 */
export const EMPTY_SHOWCASE: HomepageShowcase = {
  fixture: null,
  players: [],
  events: [],
};
