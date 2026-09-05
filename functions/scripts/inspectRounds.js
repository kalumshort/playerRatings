/**
 * Prints the exact round names API-Football uses for each competition.
 *
 * Read-only: it calls `fixtures/rounds` and prints. Nothing is written, and
 * nothing in production ever calls that endpoint — the whole point is to run
 * this once, look at the real strings, and hardcode the ladder in bracket.js
 * against what the API actually says rather than what its docs imply.
 *
 * The round string is the only thing that tells us a fixture is a quarter-final,
 * so a ladder written from memory is a bracket that silently drops rounds.
 *
 * Usage:
 *   node functions/scripts/inspectRounds.js
 *   node functions/scripts/inspectRounds.js --season=2025 --leagues=45,48
 *
 * Costs one API call per competition.
 */
const { arg, bootstrap, intListArg, pad } = require("./_env");

bootstrap();

const { fetchFootballApi, SEASON } = require("../helperFunctions");
const { TRACKED_LEAGUES } = require("../leagueCatalogue");

const season = arg("season") || String(SEASON);
const leagueIds = intListArg("leagues");

// Default to the cups — they're the ones with a knockout ladder to discover.
// A league's rounds are just "Regular Season - N" and hold no surprises.
const targets = leagueIds
  ? TRACKED_LEAGUES.filter((l) => leagueIds.includes(l.id))
  : TRACKED_LEAGUES.filter((l) => l.kind === "cup");

(async () => {
  console.log("");
  console.log(`  Season      : ${season}`);
  console.log(`  Competitions: ${targets.length}`);
  console.log("");

  if (targets.length === 0) {
    console.log(
      "  Nothing to inspect. TRACKED_LEAGUES has no cup entries yet — pass\n" +
        "  --leagues=45,48 explicitly, or add the cups first.\n",
    );
    process.exit(1);
  }

  let failures = 0;

  for (const competition of targets) {
    let rounds = [];

    try {
      rounds = await fetchFootballApi(
        "fixtures/rounds",
        { league: competition.id, season },
        { allowEmpty: true },
      );
    } catch (error) {
      failures++;
      console.error(
        `  ${pad(competition.id, 6)}${competition.expected}\n` +
          `         FAILED: ${error.message}\n`,
      );
      continue;
    }

    console.log(`  ${pad(competition.id, 6)}${competition.expected}`);
    console.log(`  ${"-".repeat(66)}`);

    if (!rounds || rounds.length === 0) {
      console.log("         (no rounds — season not started, or wrong id)\n");
      continue;
    }

    for (const round of rounds) {
      console.log(`         ${round}`);
    }
    console.log("");
  }

  console.log(
    "  Copy the knockout round strings into ROUND_LADDER in functions/bracket.js.\n" +
      '  Watch for "Semi-finals" — a bare /final/ pattern matches it.\n',
  );

  process.exit(failures > 0 ? 1 : 0);
})().catch((error) => {
  console.error("\n  Inspection failed:", error.message, "\n");
  process.exit(1);
});
