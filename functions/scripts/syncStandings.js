/**
 * Pulls official standings into Firestore from your machine.
 *
 * Same code path as the deployed `refreshStandings` scheduler — both call
 * syncStandings() — so this is how you backfill a season or check a league
 * without waiting for the next tick.
 *
 * Setup is the same as syncLeagues.js: FOOTBALL_API_KEY in functions/.env.local,
 * Firestore credentials from the project's .env.local.
 *
 * Usage:
 *   node functions/scripts/syncStandings.js --dry-run
 *       Fetch and print, write nothing. Run this first.
 *
 *   node functions/scripts/syncStandings.js --dry-run --raw --leagues=39
 *       Dump the API's raw response for one league. Use this before trusting
 *       a mapper against a competition you haven't seen the shape of.
 *
 *   node functions/scripts/syncStandings.js --season=2025
 *       Backfill a finished season so archived club pages have a final table.
 *
 * One API call per competition.
 */
const { arg, bootstrap, intListArg, pad } = require("./_env");

const dryRun = arg("dry-run") === true;
const raw = arg("raw") === true;
const leagueIds = intListArg("leagues");

const { db, env } = bootstrap();

const { fetchFootballApi, SEASON } = require("../helperFunctions");
const { syncStandings } = require("../standings");
const { resolveLeagueTargets } = require("../leagueCatalogue");

const targetSeason = arg("season") || String(SEASON);

(async () => {
  const targets = resolveLeagueTargets(leagueIds || undefined).filter(
    (c) => c.table,
  );

  // Escape hatch for reading the shape of a response before writing a mapper
  // against it. Deliberately prints and exits — it does not touch Firestore.
  if (raw) {
    for (const competition of targets) {
      const response = await fetchFootballApi(
        "standings",
        { league: competition.id, season: targetSeason },
        { allowEmpty: true },
      );
      console.log(`\n=== ${competition.id} ${competition.expected} ===`);
      console.log(JSON.stringify(response, null, 2).slice(0, 6000));
    }
    process.exit(0);
  }

  console.log("");
  console.log(`  Project      : ${env.ADMIN_PROJECT_ID}`);
  console.log(`  Season       : ${targetSeason}`);
  console.log(`  Competitions : ${targets.length}`);
  console.log(
    `  Mode         : ${dryRun ? "DRY RUN — nothing will be written" : "WRITING to Firestore"}`,
  );
  console.log("");

  const summary = await syncStandings({
    db,
    season: targetSeason,
    leagueIds: leagueIds || undefined,
    dryRun,
  });

  console.log(
    `  ${pad("ID", 6)}${pad("EXPECTED", 30)}${pad("API RETURNED", 30)}${pad("GRPS", 6)}${pad("TEAMS", 7)}DEDUCTIONS`,
  );
  console.log(`  ${"-".repeat(88)}`);

  for (const row of summary.results) {
    const mismatch = row.name && row.expected && row.name !== row.expected;
    const flag = row.empty ? "  <- EMPTY" : mismatch ? "  <- NAME MISMATCH" : "";

    console.log(
      `  ${pad(row.leagueId, 6)}${pad(row.expected, 30)}${pad(row.name || "-", 30)}` +
        `${pad(row.groupCount, 6)}${pad(row.teamCount, 7)}${pad(row.deductions, 11)}${flag}`,
    );
  }

  // The top of each table, as a sanity check that the mapping landed on real
  // numbers rather than a column of zeroes.
  for (const row of summary.results) {
    if (!row.table) continue;
    for (const group of row.table.groups) {
      console.log(`\n  ${row.name} — ${group.name}`);
      for (const team of group.rows.slice(0, 4)) {
        const adj =
          team.pointsAdjustment !== 0 ? `  (${team.pointsAdjustment} pts)` : "";
        console.log(
          `    ${pad(team.rank, 4)}${pad(team.teamName, 26)}` +
            `${pad(team.all.played, 4)}${pad(team.points, 5)}` +
            `${pad(team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff, 6)}` +
            `${pad(team.form || "-", 8)}${adj}`,
        );
      }
    }
  }

  console.log("");
  console.log(
    `  ${summary.leaguesWritten}/${summary.leaguesRequested} tables` +
      `${dryRun ? " (not written)" : " written"}.`,
  );

  for (const failure of summary.failures) {
    console.error(`  FAILED  league ${failure.leagueId}: ${failure.error}`);
  }

  console.log("");

  // An empty competition is usually a season that hasn't kicked off, which is
  // fine mid-summer and alarming in November — non-zero so it can't scroll by.
  const problems = summary.empty.length + summary.failures.length;
  process.exit(problems > 0 ? 1 : 0);
})().catch((error) => {
  console.error("\n  Standings sync failed:", error.message, "\n");
  process.exit(1);
});
