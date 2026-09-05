/**
 * The daily update: reconcile the club registry, then pull fixtures and squads
 * for every club in this season's league.
 *
 * Extracted from the scheduled function so the same code can be run on demand
 * from scripts/updateNow.js. Two copies of this loop would drift, and the one
 * that drifts is always the one that isn't running nightly.
 */
const { FieldValue } = require("firebase-admin/firestore");
const {
  SEASON,
  LEAGUE_ID,
  fetchFootballApi,
  reconcileClubGroups,
  writeClubDirectory,
} = require("./helperFunctions");
const { readTrackedTeamIds, toFixtureDoc } = require("./fixtureDoc");

/**
 * Reads this season's league members from the catalogue that
 * scripts/syncLeagues.js writes, shaped like the API's `teams` response.
 *
 * Lets the registry be reconciled without spending an API call, and against a
 * team list that has already been eyeballed. Returns [] when the catalogue
 * hasn't been synced for this season, so callers can fall back to the API.
 *
 * @param {object} args - { db, season, leagueId }.
 * @return {Promise<Array<object>>} API-shaped team entries.
 */
const readTeamsFromCatalogue = async ({ db, season, leagueId }) => {
  const snapshot = await db
    .collection("leagues")
    .doc("season")
    .collection(String(season))
    .doc(String(leagueId))
    .collection("teams")
    .get();

  return snapshot.docs.map((doc) => ({
    team: {
      id: Number(doc.id),
      name: doc.data().name,
      logo: doc.data().logo,
    },
  }));
};

/**
 * Runs the full update.
 *
 * @param {object} args - { db, season, leagueId, logger, teamSource,
 *   skipFixtures }. `teamSource` is "api" (default) or "catalogue".
 *   `skipFixtures` reconciles the registry without touching fixtures/squads.
 * @return {Promise<object>} Summary of what changed.
 */
const runUpdateJob = async ({
  db,
  season = SEASON,
  leagueId = LEAGUE_ID,
  logger = console,
  teamSource = "api",
  skipFixtures = false,
}) => {
  // ======================================================
  // PART 1: GET THE LIST OF TEAMS
  // ======================================================
  let teams = [];

  if (teamSource === "catalogue") {
    teams = await readTeamsFromCatalogue({ db, season, leagueId });
    logger.info(`Read ${teams.length} teams from the league catalogue.`);
  }

  if (!teams.length) {
    logger.info(`Fetching team list for League ${leagueId}...`);
    teams = await fetchFootballApi("teams", { league: leagueId, season });
  }

  // ======================================================
  // PART 1.5: RECONCILE THE CLUB REGISTRY
  // ======================================================
  // `teams` is whatever the league table says today, so this is where promotion
  // and relegation land: newly promoted clubs get a groups/ doc created, and
  // clubs that have dropped out are frozen as a read-only archive. Wrapped
  // separately so a reconcile failure never costs us the fixture run below.
  let reconcile = null;

  try {
    reconcile = await reconcileClubGroups({ db, apiTeams: teams, season });

    if (reconcile.skipped) {
      logger.error(
        `Club reconcile SKIPPED: only ${teams.length} teams returned, ` +
          `below the minimum expected for a full league. Nothing archived.`,
      );
    } else {
      logger.info(
        `Club reconcile: ${reconcile.created.length} created, ` +
          `${reconcile.reactivated.length} reactivated, ` +
          `${reconcile.archived.length} archived, ` +
          `${reconcile.backfilled.length} slugs backfilled.`,
        reconcile,
      );
    }

    const directory = await writeClubDirectory({ db, season });
    logger.info(`Club directory written with ${directory.length} clubs.`);
  } catch (reconcileError) {
    logger.error("Club reconcile failed:", reconcileError.message);
  }

  if (skipFixtures) {
    return { teams: teams.length, reconcile, fixtures: 0, squads: 0 };
  }

  // ======================================================
  // PART 2: LOOP TEAMS (Fixtures + Squads)
  // ======================================================
  // Only this season's clubs. Archived clubs are deliberately absent: their
  // last active season stays on disk exactly as it was, which is what makes
  // the frozen club pages work.
  const uniqueMatchesMap = {};
  let squadsWritten = 0;

  // Read once, before the loop: the directory has just been rebuilt above, so
  // this is the current set of clubs the app has hubs for.
  const trackedTeamIds = await readTrackedTeamIds(db);

  logger.info(`Processing ${teams.length} teams...`);

  for (const teamObj of teams) {
    const teamId = teamObj.team.id;
    const teamName = teamObj.team.name;

    // One bad team must not crash the whole run.
    try {
      // --- A. FETCH FIXTURES ---
      const teamFixtures =
        (await fetchFootballApi("fixtures", { team: teamId, season })) || [];

      teamFixtures.forEach((fixtureObj) => {
        // The shared mapper, so this job and the league-wide cup ingest write
        // the same shape — including the poll tier, which flaps if the two
        // writers disagree about it.
        const doc = toFixtureDoc(fixtureObj, { trackedTeamIds });
        if (doc) uniqueMatchesMap[doc.matchId] = doc;
      });

      // --- B. FETCH SQUADS ---
      const squadData = await fetchFootballApi("players/squads", {
        team: teamId,
      });

      const squadPlayers = squadData[0]?.players || [];
      const playerIds = squadPlayers.map((player) => player.id);

      const teamSquadsRef = db
        .collection(`teamSquads/${teamId}/season`)
        .doc(String(season));

      const teamSquadsDoc = await teamSquadsRef.get();

      const existingSeasonSquad = teamSquadsDoc.exists
        ? teamSquadsDoc.data().seasonSquad || []
        : [];

      // seasonSquad accumulates: a player who left mid-season still has ratings
      // attached to him, so he must stay resolvable.
      const updatedSeasonSquad = [
        ...existingSeasonSquad,
        ...squadPlayers.filter(
          (newPlayer) => !existingSeasonSquad.some((p) => p.id === newPlayer.id),
        ),
      ];

      await teamSquadsRef.set(
        {
          activeSquad: squadPlayers,
          playerIds: playerIds,
          seasonSquad: updatedSeasonSquad,
          lastUpdated: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      squadsWritten++;
      logger.info(`Processed ${teamName} (Fixtures & Squad)`);
    } catch (teamError) {
      logger.error(`Error processing team ${teamName}:`, teamError.message);
    }
  }

  // ======================================================
  // PART 3: BATCH WRITE MATCHES
  // ======================================================
  const uniqueMatchesArray = Object.values(uniqueMatchesMap);
  logger.info(
    `Writing ${uniqueMatchesArray.length} unique matches to Firestore...`,
  );

  // BulkWriter throttles and retries for us — a bare Promise.all here fires
  // several hundred concurrent writes.
  const writer = db.bulkWriter();

  uniqueMatchesArray.forEach((matchData) => {
    writer.set(
      db.collection(`fixtures/${season}/fixtures`).doc(matchData.matchId),
      matchData,
      { merge: true },
    );
  });

  await writer.close();
  logger.info(`Done. Matches and Squads updated.`);

  return {
    teams: teams.length,
    reconcile,
    fixtures: uniqueMatchesArray.length,
    squads: squadsWritten,
  };
};

module.exports = { runUpdateJob, readTeamsFromCatalogue };
