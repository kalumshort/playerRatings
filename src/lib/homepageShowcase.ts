// Real entities used to populate the marketing homepage demos.
//
// The demos on `/` used to run on invented players and vote counts. They now
// render real crests, real squad names and real match events pulled from the
// same collections the app itself reads, so the homepage shows the actual
// product rather than a mock-up of it.
//
// Each feature row is anchored to one of the five biggest clubs, so a visitor
// scrolling the page sees five recognisable squads rather than the same one
// repeated. Every row is self-contained: its own crest, its own squad, its own
// real match.
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
  /** API-Football squad position: Goalkeeper | Defender | Midfielder | Attacker. */
  position?: string;
  /**
   * False when `photo` resolves to API-Football's grey silhouette rather than
   * a real headshot. The CDN serves that placeholder with a 200, so this can
   * only be known by checking — see verifyPhotos in firebase-admin-queries.
   *
   * Undefined means "not checked"; treat it as usable.
   */
  hasPhoto?: boolean;
}

/** Shape MoodAreaChart expects — a subset of the API-Football event object. */
export interface ShowcaseEvent {
  time: { elapsed: number; extra?: number | null };
  type: string;
  detail?: string;
  player?: { name?: string };
  assist?: { name?: string };
}

/** Everything one feature row needs, all from the same club. */
export interface ShowcaseClub {
  teamId: string;
  name: string;
  logo: string;
  /** Squad with positions kept, so a demo can assemble a plausible XI. */
  squad: ShowcasePlayer[];
  /** A real recent match for this club — supplies the crests. */
  fixture: ShowcaseFixture | null;
  /** That match's real goals, cards and subs. */
  events: ShowcaseEvent[];
}

export interface HomepageShowcase {
  /**
   * One club per feature row, in FEATURE_CLUBS order. Short or empty when the
   * reads fail or a club has no squad yet — never assume five.
   */
  clubs: ShowcaseClub[];
}

/**
 * The clubs the feature rows are built from, in page order.
 *
 * Keyed by API-Football team id, which is also the `groups/{id}` doc id and is
 * stable across seasons — unlike the slug, which is regenerated from the club
 * name by the nightly reconcile. Verified against the live club directory.
 *
 * `name` is only a fallback for when the squad read succeeds but the directory
 * lookup doesn't; the real name is preferred.
 */
export const FEATURE_CLUBS = [
  { teamId: "33", name: "Manchester United" },
  { teamId: "42", name: "Arsenal" },
  { teamId: "40", name: "Liverpool" },
  { teamId: "49", name: "Chelsea" },
  { teamId: "50", name: "Manchester City" },
] as const;

/** "Player to watch" should look like a matchwinner, not a centre-back. */
const POSITION_RANK: Record<string, number> = {
  Attacker: 0,
  Midfielder: 1,
  Defender: 2,
};

/**
 * The faces a demo panel should lead with: outfield players, attackers first,
 * and among equals the ones who actually have a headshot.
 *
 * The photo tiebreak matters because these panels are mostly face — the "on
 * fire" tile is a 42px avatar and nothing else, so leading with a player whose
 * photo is the CDN's grey silhouette makes the panel look broken. A missing
 * photo only ever demotes a player, never drops him: if nobody in the squad
 * has one, the panel still renders real names.
 *
 * Shared so the predictions, pulse and ratings panels rank players the same
 * way instead of each slicing the squad differently.
 */
export const outfieldHighlights = (
  squad: ShowcasePlayer[],
  count: number,
): ShowcasePlayer[] =>
  squad
    .filter((player) => player.position !== "Goalkeeper")
    .slice()
    .sort((a, b) => {
      const byPosition =
        (POSITION_RANK[a.position ?? ""] ?? 3) -
        (POSITION_RANK[b.position ?? ""] ?? 3);
      if (byPosition !== 0) return byPosition;

      // `undefined` means unchecked, which counts as usable.
      const aPhoto = a.hasPhoto === false ? 1 : 0;
      const bPhoto = b.hasPhoto === false ? 1 : 0;
      return aPhoto - bPhoto;
    })
    .slice(0, count);

/**
 * Every demo panel must render from this. A cold season, a failed read or a
 * fresh project all land here, and the homepage still has to work.
 */
export const EMPTY_SHOWCASE: HomepageShowcase = { clubs: [] };

/** The club for feature row `index`, or null so the panel can fall back. */
export const clubForRow = (
  showcase: HomepageShowcase,
  index: number,
): ShowcaseClub | null => showcase.clubs[index] ?? null;
