const { PREDICTION, PREDICTION_CAPS } = require("./xpConfig");

/** API-Football short codes that mean the result is final. */
const FINISHED = ["FT", "AET", "PEN"];

/**
 * Whether a fixture has a settled result worth scoring against.
 * @param {object|null|undefined} fixture - The fixture document.
 * @return {boolean} True when the match is over.
 */
function isResolvable(fixture) {
  return Boolean(fixture) && FINISHED.includes(fixture.status);
}

/**
 * "home" | "draw" | "away" from a final score.
 * @param {object} goals - `{ home, away }`.
 * @return {string|null} The outcome, or null if the score is unusable.
 */
function outcomeOf(goals) {
  const home = Number(goals?.home);
  const away = Number(goals?.away);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

/**
 * The official starting XI for one club, as player id strings.
 *
 * Mirrors getActualStartingXI in
 * src/components/client/Fixture/Components/Lineup/lineupUtils.ts — `src/` and
 * `functions/` are separate packages and cannot import each other.
 *
 * Reads `startXI` rather than a substitution-adjusted list on purpose: scoring
 * against the live lineup would credit an 80th-minute substitute and penalise
 * a starter who came off.
 *
 * @param {object} fixture - The fixture document.
 * @param {string|number} clubId - API team id of the club being scored.
 * @return {Array<string>} Player ids, empty when the feed has no lineup.
 */
function actualStartingXI(fixture, clubId) {
  const team = (fixture?.lineups || []).find(
    (entry) => Number(entry?.team?.id) === Number(clubId),
  );

  return (team?.startXI || [])
    .map((entry) => entry?.player?.id)
    .filter((id) => id != null)
    .map(String);
}

/**
 * Did this player score or assist?
 *
 * Own goals are excluded — putting it into your own net is not the kind of
 * involvement anyone is predicting.
 *
 * @param {object} fixture - The fixture document.
 * @param {string} playerId - The player to look for.
 * @return {boolean} True when they scored or assisted a real goal.
 */
function scoredOrAssisted(fixture, playerId) {
  const target = String(playerId);

  return (fixture?.events || []).some((event) => {
    if (event?.type !== "Goal") return false;
    if (String(event?.detail || "").toLowerCase().includes("own goal")) {
      return false;
    }
    return (
      String(event?.player?.id) === target ||
      String(event?.assist?.id) === target
    );
  });
}

/**
 * Points earned for one user's predictions on one finished match.
 *
 * Pure and deterministic, like the XP engine, so the nightly job can recompute
 * a whole season from source and land on the same numbers every time.
 *
 * Components degrade independently rather than failing as a unit. Only a
 * fraction of fixtures carry `lineups` or `events` — those are written by the
 * live-match job, not the nightly fixture sync, so a match nobody watched live
 * has a final score but no team sheet. A fan is never penalised for data we
 * never collected: the XI and player-to-watch components simply pay nothing.
 *
 * A shootout counts as the draw it was after 120 minutes. `goals` excludes
 * penalties, which is the convention every prediction game uses, and it is the
 * only reading under which "predict the score" has a sane answer.
 *
 * @param {object|null|undefined} doc - The per-user match document.
 * @param {object|null|undefined} fixture - The fixture document.
 * @param {string|number} clubId - The club whose XI the user predicted.
 * @return {object} `{ points, breakdown, resolved }`.
 */
function computePredictionPoints(doc, fixture, clubId) {
  const breakdown = {};

  if (!doc || typeof doc !== "object" || !isResolvable(fixture)) {
    return { points: 0, breakdown, resolved: false };
  }

  const actualOutcome = outcomeOf(fixture.goals);
  if (!actualOutcome) return { points: 0, breakdown, resolved: false };

  // --- Result -----------------------------------------------------------
  if (doc.result && doc.result === actualOutcome) {
    breakdown.correctResult = PREDICTION.correctResult;
  }

  // --- Exact scoreline --------------------------------------------------
  // Stored as the "2-1" string the score predictor writes.
  if (doc.ScorePrediction) {
    const actual = `${Number(fixture.goals.home)}-${Number(fixture.goals.away)}`;
    if (String(doc.ScorePrediction).trim() === actual) {
      breakdown.exactScore = PREDICTION.exactScore;
    }
  }

  // --- Starting XI ------------------------------------------------------
  const actualXI = actualStartingXI(fixture, clubId);

  if (actualXI.length > 0 && doc.chosenTeam) {
    const actualIds = new Set(actualXI);

    // By player presence, not by slot: the official feed carries no slot ids,
    // and our own slot 7 means different things in different formations.
    // "Did I pick the right eleven" is the question fans actually ask.
    const predicted = new Set(
      Object.values(doc.chosenTeam)
        .filter((id) => id != null && id !== "")
        .map(String),
    );

    let hits = 0;
    predicted.forEach((id) => {
      if (actualIds.has(id)) hits++;
    });

    hits = Math.min(hits, PREDICTION_CAPS.xiHits);

    if (hits > 0) breakdown.xiHits = hits * PREDICTION.xiHit;
    // Perfect means the whole real XI was named, not merely eleven guesses.
    if (hits === PREDICTION_CAPS.xiHits && actualIds.size === PREDICTION_CAPS.xiHits) {
      breakdown.perfectXi = PREDICTION.perfectXi;
    }
  }

  // --- Player to watch --------------------------------------------------
  // Scored against what the player actually did, deliberately NOT against the
  // Fan MOTM vote: that is a poll, and scoring a prediction against opinion
  // would smuggle "correctness" into something that has no right answer.
  if (doc.preMatchMotm && scoredOrAssisted(fixture, doc.preMatchMotm)) {
    breakdown.playerToWatchInvolved = PREDICTION.playerToWatchInvolved;
  }

  const points = Object.values(breakdown).reduce((sum, n) => sum + n, 0);

  return { points, breakdown, resolved: true };
}

module.exports = {
  computePredictionPoints,
  isResolvable,
  outcomeOf,
  actualStartingXI,
  scoredOrAssisted,
};
