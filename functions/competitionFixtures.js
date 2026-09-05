/**
 * League-wide fixture ingestion, for the cups.
 *
 * The nightly job fetches fixtures per club, which covers every match a club
 * with a hub plays. That is enough for a league table — both sides of a
 * Premier League match are tracked clubs — but not for a cup bracket, where a
 * tie between two clubs the app has never heard of is simply absent, and the
 * round it belongs to looks half-drawn.
 *
 * So cups are fetched by competition instead: one call each, everything in it.
 */
const { fetchFootballApi } = require("./helperFunctions");
const { readTrackedTeamIds, toFixtureDoc } = require("./fixtureDoc");
const { resolveLeagueTargets } = require("./leagueCatalogue");

/**
 * The window scheduledLiveMatchUpdate owns.
 *
 * Matched to the poller's own lookback and lookahead. Inside it, the poller is
 * writing every minute from a live endpoint; this job runs hourly off a
 * league-wide snapshot that can be an hour stale. Writing into the window
 * would roll a 2-1 back to 1-1 until the next poll corrected it, so the rule
 * is simply: the poller owns the hot zone, this job owns everything outside.
 */
const HOT_ZONE_LOOKBACK_SECONDS = 4 * 60 * 60;
const HOT_ZONE_LOOKAHEAD_SECONDS = 60 * 60;

/**
 * Rounds that exist only to whittle down hundreds of clubs nobody is watching.
 *
 * `fixtures?league=45` returns the entire FA Cup including extra preliminary
 * qualifying, which is several hundred non-league fixtures. Storing them would
 * balloon the collection that both sitemap generators full-scan, for rounds no
 * tracked club has ever played in.
 *
 * Matched against the classified round key, so it does not care which of the
 * API's several spellings of "qualifying" a competition happens to use.
 */
const SKIPPED_ROUND_PREFIXES = ["extra-preliminary", "preliminary", "qualifying"];

/**
 * Whether a fixture falls inside the live poller's window.
 * @param {object} doc - A mapped fixture document.
 * @param {number} now - Unix seconds.
 * @return {boolean} True when the poller owns it.
 */
const inHotZone = (doc, now) =>
  doc.timestamp >= now - HOT_ZONE_LOOKBACK_SECONDS &&
  doc.timestamp <= now + HOT_ZONE_LOOKAHEAD_SECONDS;

/**
 * Pulls one competition's fixtures and stores the ones worth storing.
 *
 * @param {object} args - { db, writer, competition, season, trackedTeamIds,
 *   classifyRound, now }.
 * @return {Promise<object>} Per-competition result for the summary.
 */
const ingestOneCompetition = async ({
  db,
  writer,
  competition,
  season,
  trackedTeamIds,
  classifyRound,
  now,
}) => {
  const fixtures =
    (await fetchFootballApi(
      "fixtures",
      { league: competition.id, season },
      { allowEmpty: true },
    )) || [];

  let written = 0;
  let skippedQualifying = 0;
  let skippedHotZone = 0;

  for (const apiFixture of fixtures) {
    const doc = toFixtureDoc(apiFixture, { trackedTeamIds });
    if (!doc) continue;

    const round = classifyRound(apiFixture?.league?.round);
    if (round && SKIPPED_ROUND_PREFIXES.some((p) => round.key.startsWith(p))) {
      skippedQualifying++;
      continue;
    }

    if (inHotZone(doc, now)) {
      skippedHotZone++;
      continue;
    }

    writer.set(
      db.collection(`fixtures/${season}/fixtures`).doc(doc.matchId),
      doc,
      { merge: true },
    );
    written++;
  }

  return {
    leagueId: String(competition.id),
    name: competition.expected,
    returned: fixtures.length,
    written,
    skippedQualifying,
    skippedHotZone,
  };
};

/**
 * Ingests fixtures for every competition that needs a bracket.
 *
 * @param {object} args - { db, season, leagueIds, dryRun }.
 * @return {Promise<object>} Summary with per-competition results and failures.
 */
const ingestCompetitionFixtures = async ({
  db,
  season,
  leagueIds,
  dryRun = false,
}) => {
  // Bracket-bearing competitions only. A league's fixtures already arrive via
  // the per-club job, and re-fetching them league-wide would be a second call
  // for data we hold.
  const targets = resolveLeagueTargets(leagueIds).filter((c) => c.bracket);

  const writer = dryRun ?
    { set: () => {}, close: async () => {} } :
    db.bulkWriter();
  const results = [];
  const failures = [];

  const trackedTeamIds = await readTrackedTeamIds(db);
  const now = Math.floor(Date.now() / 1000);

  // Required lazily: bracket.js requires leagueCatalogue, and requiring it at
  // module scope here would close a cycle through this file.
  const { classifyRound } = require("./bracket");

  for (const competition of targets) {
    try {
      results.push(
        await ingestOneCompetition({
          db,
          writer,
          competition,
          season,
          trackedTeamIds,
          classifyRound,
          now,
        }),
      );
    } catch (error) {
      failures.push({
        leagueId: String(competition.id),
        error: error.message,
      });
    }
  }

  await writer.close();

  return {
    season: String(season),
    dryRun,
    competitionsRequested: targets.length,
    fixturesWritten: results.reduce((sum, r) => sum + r.written, 0),
    results,
    failures,
  };
};

module.exports = {
  HOT_ZONE_LOOKAHEAD_SECONDS,
  HOT_ZONE_LOOKBACK_SECONDS,
  SKIPPED_ROUND_PREFIXES,
  inHotZone,
  ingestCompetitionFixtures,
};
