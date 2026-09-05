/**
 * Pulls cup fixtures league-wide and rebuilds the brackets, from your machine.
 *
 * Same code path as the deployed `ingestCupData` scheduler — both call
 * ingestCompetitionFixtures() then syncBrackets() — so this is how you backfill
 * a season or check a competition without waiting for the next tick.
 *
 * Setup is the same as syncLeagues.js: FOOTBALL_API_KEY in functions/.env.local,
 * Firestore credentials from the project's .env.local.
 *
 * Usage:
 *   node functions/scripts/syncCups.js --dry-run
 *       Fetch and report, write nothing. Run this first.
 *
 *   node functions/scripts/syncCups.js --leagues=45
 *   node functions/scripts/syncCups.js --season=2025
 *
 *   node functions/scripts/syncCups.js --brackets-only
 *       Rebuild brackets from stored fixtures. Costs no API calls.
 *
 * One API call per competition.
 */
const { arg, bootstrap, intListArg, pad } = require("./_env");

const dryRun = arg("dry-run") === true;
const bracketsOnly = arg("brackets-only") === true;
const leagueIds = intListArg("leagues");

const { db, env } = bootstrap({ requireApiKey: !bracketsOnly });

const { SEASON } = require("../helperFunctions");
const { ingestCompetitionFixtures } = require("../competitionFixtures");
const { syncBrackets } = require("../bracket");

const targetSeason = arg("season") || String(SEASON);

(async () => {
  console.log("");
  console.log(`  Project : ${env.ADMIN_PROJECT_ID}`);
  console.log(`  Season  : ${targetSeason}`);
  console.log(
    `  Mode    : ${bracketsOnly ? "BRACKETS ONLY — no API calls" : dryRun ? "DRY RUN — nothing will be written" : "WRITING to Firestore"}`,
  );
  console.log("");

  if (!bracketsOnly) {
    const ingest = await ingestCompetitionFixtures({
      db,
      season: targetSeason,
      leagueIds: leagueIds || undefined,
      dryRun,
    });

    console.log(
      `  ${pad("ID", 6)}${pad("COMPETITION", 32)}${pad("RETURNED", 10)}${pad("WRITTEN", 9)}${pad("QUALIF", 8)}HOT ZONE`,
    );
    console.log(`  ${"-".repeat(80)}`);

    for (const row of ingest.results) {
      console.log(
        `  ${pad(row.leagueId, 6)}${pad(row.name, 32)}${pad(row.returned, 10)}` +
          `${pad(row.written, 9)}${pad(row.skippedQualifying, 8)}${row.skippedHotZone}`,
      );
    }

    for (const failure of ingest.failures) {
      console.error(`  FAILED  league ${failure.leagueId}: ${failure.error}`);
    }

    console.log("");
    console.log(`  ${ingest.fixturesWritten} fixtures${dryRun ? " (not written)" : " written"}.`);
    console.log("");
  }

  const brackets = await syncBrackets({
    db,
    season: targetSeason,
    leagueIds: leagueIds || undefined,
    dryRun,
  });

  console.log(
    `  ${pad("ID", 6)}${pad("COMPETITION", 32)}${pad("FIXTURES", 10)}${pad("ROUNDS", 8)}${pad("TIES", 7)}UNMATCHED`,
  );
  console.log(`  ${"-".repeat(80)}`);

  for (const row of brackets.results) {
    const flag = row.unmatched > 0 ? "  <- CHECK ROUND_LADDER" : "";
    console.log(
      `  ${pad(row.leagueId, 6)}${pad(row.name, 32)}${pad(row.fixtureCount, 10)}` +
        `${pad(row.roundCount, 8)}${pad(row.tieCount, 7)}${pad(row.unmatched, 10)}${flag}`,
    );
  }

  for (const failure of brackets.failures) {
    console.error(`  FAILED  bracket ${failure.leagueId}: ${failure.error}`);
  }

  console.log("");

  // An unclassified round is a round that silently vanishes from the bracket,
  // so it exits non-zero rather than scrolling past.
  const problems =
    brackets.failures.length +
    brackets.results.filter((r) => r.unmatched > 0).length;
  process.exit(problems > 0 ? 1 : 0);
})().catch((error) => {
  console.error("\n  Cup sync failed:", error.message, "\n");
  process.exit(1);
});
