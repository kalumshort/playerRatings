/**
 * Official league standings.
 *
 * Snapshots the API's own table into Firestore, per league-season. This is the
 * *official* table, not a live one: the endpoint only reflects finished
 * matches, and lags them by an unbounded amount. Turning it into a live table
 * is the app's job, and it happens at read time — see src/lib/utils/leagueTable.ts.
 *
 * Storing the official table rather than computing one from results is not
 * laziness. A points deduction (Everton, Nottingham Forest) cannot be derived
 * from match results at all, so a table built from scratch is simply wrong for
 * those seasons. The API knows; we record what it says and only ever add to it.
 */
const { FieldValue } = require("firebase-admin/firestore");
const { fetchFootballApi } = require("./helperFunctions");
const { leagueDocRef, resolveLeagueTargets } = require("./leagueCatalogue");

/**
 * Where one league-season's table lives.
 * @param {object} db - Firestore instance.
 * @param {number|string} season - Season year.
 * @param {number|string} leagueId - API-Football league id.
 * @return {object} DocumentReference.
 */
const standingsDocRef = (db, season, leagueId) =>
  leagueDocRef(db, season, leagueId).collection("table").doc("current");

/**
 * Normalises one side of a row's played/won/drawn/lost record.
 * @param {object} block - The API's `all`, `home` or `away` block.
 * @return {object} Record with goals flattened to for/against.
 */
const mapRecord = (block) => ({
  played: block?.played ?? 0,
  win: block?.win ?? 0,
  draw: block?.draw ?? 0,
  lose: block?.lose ?? 0,
  goals: {
    for: block?.goals?.for ?? 0,
    against: block?.goals?.against ?? 0,
  },
});

/**
 * Maps one API standings row into the shape the app reads.
 *
 * Pure, so the interesting part — the points adjustment — is testable without
 * an emulator or a network.
 *
 * @param {object} row - One entry from `league.standings[n]`.
 * @return {object|null} Mapped row, or null when the row has no team.
 */
const mapStandingRow = (row) => {
  if (!row?.team?.id) return null;

  const all = mapRecord(row.all);

  // What the results alone would have earned. Anything left over is a
  // deduction (or, rarely, an award) that no amount of arithmetic over
  // fixtures could reproduce — which is the whole reason this document exists.
  const earned = all.win * 3 + all.draw;
  const points = row.points ?? earned;

  return {
    rank: row.rank ?? null,
    teamId: String(row.team.id),
    teamName: row.team.name ?? "",
    teamLogo:
      row.team.logo ||
      `https://media.api-sports.io/football/teams/${row.team.id}.png`,
    points,
    pointsAdjustment: points - earned,
    goalsDiff: row.goalsDiff ?? all.goals.for - all.goals.against,
    // "WWDLW", most recent last. Absent early in a season.
    form: row.form ?? null,
    // "up" | "down" | "same" — movement since the API's previous table.
    status: row.status ?? null,
    // "Promotion - Champions League (Group Stage)", "Relegation", … Free text
    // that changes per season and per competition, so it is matched loosely at
    // render time and never parsed for a position.
    description: row.description ?? null,
    all,
    home: mapRecord(row.home),
    away: mapRecord(row.away),
    update: row.update ?? null,
  };
};

/**
 * Fetches and maps one competition's table.
 *
 * `league.standings` comes back as an array of groups: one for a domestic
 * league, one for a UEFA league phase, several for an old-style group stage.
 * The grouping is preserved rather than flattened, because a flattened group
 * stage is eight teams all ranked 1st.
 *
 * @param {number} leagueId - API-Football league id.
 * @param {number|string} season - Season year.
 * @return {Promise<object|null>} Table body, or null when the API has nothing.
 */
const fetchStandings = async (leagueId, season) => {
  const response = await fetchFootballApi(
    "standings",
    { league: leagueId, season },
    { allowEmpty: true },
  );

  const league = response?.[0]?.league;
  if (!league) return null;

  const rawGroups = Array.isArray(league.standings) ? league.standings : [];

  const groups = rawGroups
    .map((rows) => {
      const mapped = (rows || []).map(mapStandingRow).filter(Boolean);
      return {
        // Every row in a group carries the same `group` label; the league's
        // own name is the sensible fallback for a single-table competition.
        name: rows?.[0]?.group || league.name || "",
        rows: mapped,
      };
    })
    .filter((group) => group.rows.length > 0);

  if (groups.length === 0) return null;

  const teamIds = groups.flatMap((group) =>
    group.rows.map((row) => row.teamId),
  );

  return {
    leagueId: String(leagueId),
    season: String(season),
    name: league.name || "",
    logo: league.logo || "",
    country: league.country || "",
    flag: league.flag || null,
    groups,
    teamIds,
    teamCount: teamIds.length,
    fetchedAt: FieldValue.serverTimestamp(),
  };
};

/**
 * Syncs standings for every table-bearing competition.
 *
 * Each competition is isolated: one failure is recorded and the rest still
 * run, so a single bad id can't cost the whole sync.
 *
 * @param {object} args - { db, season, leagueIds, dryRun } — leagueIds defaults
 *   to every tracked competition with `table: true`. `dryRun` still fetches, so
 *   the response shape can be checked, but writes nothing.
 * @return {Promise<object>} Summary with per-competition results and failures.
 */
const syncStandings = async ({ db, season, leagueIds, dryRun = false }) => {
  const targets = resolveLeagueTargets(leagueIds).filter((c) => c.table);

  const writer = dryRun ?
    { set: () => {}, close: async () => {} } :
    db.bulkWriter();
  const results = [];
  const failures = [];

  for (const competition of targets) {
    try {
      const table = await fetchStandings(competition.id, season);

      if (table) {
        // The parent league doc, so the tree stays navigable. Writing only the
        // subcollection would leave the league as a missing ancestor — invisible
        // to a query over leagues/season/{season} — and the catalogue sync,
        // which normally creates it, deliberately skips cups.
        writer.set(
          leagueDocRef(db, season, competition.id),
          {
            leagueId: String(competition.id),
            season: String(season),
            name: table.name,
            logo: table.logo,
            country: table.country,
            flag: table.flag,
            kind: competition.kind,
            hasTable: true,
            hasBracket: competition.bracket === true,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        writer.set(
          standingsDocRef(db, season, competition.id),
          { ...table, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }

      results.push({
        leagueId: String(competition.id),
        expected: competition.expected,
        name: table?.name || null,
        groupCount: table?.groups.length ?? 0,
        teamCount: table?.teamCount ?? 0,
        deductions:
          table?.groups
            .flatMap((g) => g.rows)
            .filter((r) => r.pointsAdjustment !== 0).length ?? 0,
        // A competition whose season hasn't started has no table yet. Recorded
        // as empty rather than thrown, but surfaced so a wrong id can't hide.
        empty: !table,
        table,
      });
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
    leaguesRequested: targets.length,
    leaguesWritten: results.filter((r) => !r.empty).length,
    empty: results.filter((r) => r.empty),
    results,
    failures,
  };
};

module.exports = {
  fetchStandings,
  mapRecord,
  mapStandingRow,
  standingsDocRef,
  syncStandings,
};
