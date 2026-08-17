/**
 * League team catalogue.
 *
 * Snapshots "which teams are in which league this season" into Firestore, so
 * the app has its own copy of the API's league tables instead of inferring
 * membership from whatever a single call happened to return.
 *
 * Nothing in the app reads this yet — it is reference data. Written by an
 * admin-triggered callable rather than a schedule, because league membership
 * changes once a season and a nightly run would burn calls confirming nothing.
 */
const { FieldValue } = require("firebase-admin/firestore");
const { fetchFootballApi } = require("./helperFunctions");

/**
 * The leagues the catalogue covers: the top four tiers in England, plus the
 * major leagues worldwide.
 *
 * `id` is the API-Football league id. These are recorded here by hand, so the
 * sync stores the league name and country the API reports back for each one —
 * if an id is wrong, the stored `name` will say so rather than the league
 * silently ending up empty. Check the summary after the first run.
 *
 * This is the canonical list of leagues the catalogue covers, not a queue.
 * Don't comment entries out to sync in batches — a sync with no explicit ids
 * targets everything listed here, so a commented-out league is one that quietly
 * stops being refreshed next season. Batch with the flag instead:
 *
 *   node functions/scripts/syncLeagues.js --leagues=39,40,41,42
 *   node functions/scripts/syncLeagues.js --leagues=140,135,78,61
 */
const TRACKED_LEAGUES = [
  // --- England, top four tiers ---
  { id: 39, expected: "Premier League", country: "England", group: "england" },
  { id: 40, expected: "Championship", country: "England", group: "england" },
  { id: 41, expected: "League One", country: "England", group: "england" },
  { id: 42, expected: "League Two", country: "England", group: "england" },

  // --- Major leagues worldwide (the Premier League above is one of these) ---
  { id: 140, expected: "La Liga", country: "Spain", group: "world" },
  { id: 135, expected: "Serie A", country: "Italy", group: "world" },
  { id: 78, expected: "Bundesliga", country: "Germany", group: "world" },
  { id: 61, expected: "Ligue 1", country: "France", group: "world" },
  { id: 88, expected: "Eredivisie", country: "Netherlands", group: "world" },
  { id: 94, expected: "Primeira Liga", country: "Portugal", group: "world" },
  { id: 71, expected: "Serie A", country: "Brazil", group: "world" },
  {
    id: 128,
    expected: "Liga Profesional Argentina",
    country: "Argentina",
    group: "world",
  },
  { id: 253, expected: "Major League Soccer", country: "USA", group: "world" },
  { id: 307, expected: "Pro League", country: "Saudi Arabia", group: "world" },
];

/**
 * Where one league-season lives: leagues/season/{season}/{leagueId}.
 * @param {object} db - Firestore instance.
 * @param {number|string} season - Season year.
 * @param {number|string} leagueId - API-Football league id.
 * @return {object} DocumentReference for that league-season.
 */
const leagueDocRef = (db, season, leagueId) =>
  db
    .collection("leagues")
    .doc("season")
    .collection(String(season))
    .doc(String(leagueId));

/**
 * Fetches a league's own metadata (name, country, logo) for the given season.
 * Returns null when the API has nothing — a wrong id or a season it hasn't
 * published yet — so the caller can record the miss instead of throwing.
 * @param {number} leagueId - API-Football league id.
 * @param {number|string} season - Season year.
 * @return {Promise<object|null>} League metadata, or null.
 */
const fetchLeagueMeta = async (leagueId, season) => {
  const response = await fetchFootballApi(
    "leagues",
    { id: leagueId, season },
    { allowEmpty: true },
  );

  const entry = response?.[0];
  if (!entry?.league) return null;

  return {
    leagueId: String(leagueId),
    name: entry.league.name || "",
    type: entry.league.type || "",
    logo: entry.league.logo || "",
    country: entry.country?.name || "",
    countryCode: entry.country?.code || null,
    flag: entry.country?.flag || null,
  };
};

/**
 * Pulls every team in a league for a season and writes them under the league.
 *
 * @param {object} args - { db, writer, leagueId, season }.
 * @return {Promise<object>} Per-league result for the run summary.
 */
const syncOneLeague = async ({ db, writer, leagueId, season }) => {
  const meta = await fetchLeagueMeta(leagueId, season);

  const teams = await fetchFootballApi(
    "teams",
    { league: leagueId, season },
    { allowEmpty: true },
  );

  const teamDocs = (teams || [])
    .filter((entry) => entry?.team?.id)
    .map((entry) => ({
      teamId: String(entry.team.id),
      name: entry.team.name || "",
      code: entry.team.code || null,
      country: entry.team.country || null,
      founded: entry.team.founded || null,
      national: entry.team.national === true,
      logo:
        entry.team.logo ||
        `https://media.api-sports.io/football/teams/${entry.team.id}.png`,
      venue: entry.venue
        ? {
            id: entry.venue.id || null,
            name: entry.venue.name || null,
            city: entry.venue.city || null,
            capacity: entry.venue.capacity || null,
            surface: entry.venue.surface || null,
          }
        : null,
    }));

  const docRef = leagueDocRef(db, season, leagueId);

  // The league doc carries the membership list, so "who was in this league
  // that season" is one read. Team docs below hold the detail.
  writer.set(
    docRef,
    {
      leagueId: String(leagueId),
      season: String(season),
      name: meta?.name || "",
      type: meta?.type || "",
      logo: meta?.logo || "",
      country: meta?.country || "",
      countryCode: meta?.countryCode || null,
      flag: meta?.flag || null,
      teamIds: teamDocs.map((team) => team.teamId),
      teamCount: teamDocs.length,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  for (const team of teamDocs) {
    writer.set(
      docRef.collection("teams").doc(team.teamId),
      { ...team, leagueId: String(leagueId), season: String(season) },
      { merge: true },
    );
  }

  return {
    leagueId: String(leagueId),
    name: meta?.name || null,
    country: meta?.country || null,
    teamCount: teamDocs.length,
    // Set when the API returned no league metadata or no teams — almost always
    // a wrong league id, or a season that hasn't started yet.
    empty: !meta || teamDocs.length === 0,
  };
};

/**
 * Syncs every tracked league for a season.
 *
 * Each league is isolated: one failure is recorded and the rest still run, so a
 * single bad id can't cost the whole catalogue.
 *
 * @param {object} args - { db, season, leagueIds, dryRun } — leagueIds defaults
 *   to all tracked leagues. `dryRun` still fetches, so league names can be
 *   checked, but writes nothing.
 * @return {Promise<object>} Summary with per-league results and failures.
 */
const syncLeagueTeams = async ({ db, season, leagueIds, dryRun = false }) => {
  const targets =
    leagueIds && leagueIds.length
      ? TRACKED_LEAGUES.filter((league) => leagueIds.includes(league.id))
      : TRACKED_LEAGUES;

  // On a dry run the writer is swallowed, so the API still gets called (which
  // is the point — it's how league names get verified) but nothing lands.
  const writer = dryRun
    ? { set: () => {}, close: async () => {} }
    : db.bulkWriter();
  const results = [];
  const failures = [];

  for (const league of targets) {
    try {
      const result = await syncOneLeague({
        db,
        writer,
        leagueId: league.id,
        season,
      });

      // Surfaces a mistyped id: the API's own name won't match what we expected.
      results.push({ ...result, expected: league.expected });
    } catch (error) {
      failures.push({ leagueId: String(league.id), error: error.message });
    }
  }

  await writer.close();

  return {
    season: String(season),
    dryRun,
    leaguesRequested: targets.length,
    leaguesWritten: results.filter((r) => !r.empty).length,
    teamsWritten: results.reduce((sum, r) => sum + r.teamCount, 0),
    empty: results.filter((r) => r.empty),
    results,
    failures,
  };
};

module.exports = {
  TRACKED_LEAGUES,
  leagueDocRef,
  syncLeagueTeams,
};
