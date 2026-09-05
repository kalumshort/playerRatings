/**
 * Runs the league catalogue sync from your machine, straight into Firestore.
 *
 * Deliberately a local script rather than something you have to deploy and then
 * find a way to invoke: this is a once-a-season admin job, and getting an auth
 * token to a callable by hand is more ceremony than the task deserves. The
 * deployed `syncLeagueCatalogue` callable exists for when there's an admin UI.
 *
 * Setup (once):
 *   1. Put your API-Football key in functions/.env.local:
 *        FOOTBALL_API_KEY=your_key_here
 *      (functions/.gitignore ignores *.local, so it stays out of git.)
 *   2. Firestore credentials are read from the project's .env.local, which
 *      already has ADMIN_PROJECT_ID / ADMIN_CLIENT_EMAIL / ADMIN_PRIVATE_KEY.
 *
 * Usage:
 *   node functions/scripts/syncLeagues.js --dry-run
 *   node functions/scripts/syncLeagues.js
 *   node functions/scripts/syncLeagues.js --season=2025 --leagues=39,40
 *
 * --dry-run still calls the API, so it confirms every league id resolves to the
 * league you expect, and writes nothing. Run it first.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

/**
 * Minimal .env reader — avoids adding a dependency for two files. Handles
 * bare, single-quoted and double-quoted values, including the escaped newlines
 * a service-account private key is usually stored with.
 * @param {string} file - Absolute path to the env file.
 * @return {object} Parsed key/value pairs, empty if the file is absent.
 */
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};

  const parsed = {};
  const pattern =
    /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'|[^\n#]*)/gm;
  const contents = fs.readFileSync(file, "utf8");

  let match;
  while ((match = pattern.exec(contents)) !== null) {
    const key = match[1];
    let value = match[2].trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\n/g, "\n");
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

const env = {
  ...readEnvFile(path.join(ROOT, ".env.local")),
  ...readEnvFile(path.join(ROOT, "functions", ".env")),
  ...readEnvFile(path.join(ROOT, "functions", ".env.local")),
  ...process.env,
};

/**
 * Reads a `--name=value` or boolean `--name` argument.
 * @param {string} name - Flag name without dashes.
 * @return {string|boolean|null} Value, true when present without one, else null.
 */
function arg(name) {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return null;
  return hit.includes("=") ? hit.split("=").slice(1).join("=") : true;
}

const dryRun = arg("dry-run") === true;
const season = arg("season") || null;
const leagueIds = arg("leagues")
  ? String(arg("leagues")).split(",").map(Number).filter(Number.isInteger)
  : null;

if (!env.FOOTBALL_API_KEY) {
  console.error(
    "\n  FOOTBALL_API_KEY is not set.\n" +
      "  Add it to functions/.env.local:  FOOTBALL_API_KEY=your_key_here\n",
  );
  process.exit(1);
}

for (const key of ["ADMIN_PROJECT_ID", "ADMIN_CLIENT_EMAIL", "ADMIN_PRIVATE_KEY"]) {
  if (!env[key]) {
    console.error(`\n  ${key} is not set — expected it in .env.local\n`);
    process.exit(1);
  }
}

// helperFunctions reads the key off process.env at call time.
process.env.FOOTBALL_API_KEY = env.FOOTBALL_API_KEY;

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: cert({
    projectId: env.ADMIN_PROJECT_ID,
    clientEmail: env.ADMIN_CLIENT_EMAIL,
    privateKey: env.ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();
const { syncLeagueTeams, resolveLeagueTargets, SEASON } = (() => {
  const catalogue = require("../leagueCatalogue");
  const helpers = require("../helperFunctions");
  return { ...catalogue, SEASON: helpers.SEASON };
})();

const targetSeason = season || String(SEASON);

(async () => {
  // The same resolver the sync uses, so this header can't claim a different
  // number from the one that actually runs — cups are filtered out of both.
  const targets = resolveLeagueTargets(leagueIds || undefined, {
    kind: "league",
  });

  console.log("");
  console.log(`  Project : ${env.ADMIN_PROJECT_ID}`);
  console.log(`  Season  : ${targetSeason}`);
  console.log(`  Leagues : ${targets.length}`);
  console.log(`  Mode    : ${dryRun ? "DRY RUN — nothing will be written" : "WRITING to Firestore"}`);
  console.log("");

  const summary = await syncLeagueTeams({
    db,
    season: targetSeason,
    leagueIds: leagueIds || undefined,
    dryRun,
  });

  const pad = (value, width) => String(value ?? "").padEnd(width).slice(0, width);

  console.log(
    `  ${pad("ID", 6)}${pad("EXPECTED", 26)}${pad("API RETURNED", 26)}${pad("COUNTRY", 14)}TEAMS`,
  );
  console.log(`  ${"-".repeat(77)}`);

  for (const row of summary.results) {
    const mismatch = row.name && row.expected && row.name !== row.expected;
    const flag = row.empty ? "  <- EMPTY" : mismatch ? "  <- NAME MISMATCH" : "";

    console.log(
      `  ${pad(row.leagueId, 6)}${pad(row.expected, 26)}${pad(row.name || "-", 26)}` +
        `${pad(row.country || "-", 14)}${pad(row.teamCount, 6)}${flag}`,
    );
  }

  console.log("");
  console.log(
    `  ${summary.leaguesWritten}/${summary.leaguesRequested} leagues, ` +
      `${summary.teamsWritten} teams${dryRun ? " (not written)" : " written"}.`,
  );

  for (const failure of summary.failures) {
    console.error(`  FAILED  league ${failure.leagueId}: ${failure.error}`);
  }

  console.log("");

  // A league that came back empty is a wrong id in TRACKED_LEAGUES, and a
  // non-zero exit is the only thing that will not scroll past unnoticed.
  const problems = summary.empty.length + summary.failures.length;
  process.exit(problems > 0 ? 1 : 0);
})().catch((error) => {
  console.error("\n  Sync failed:", error.message, "\n");
  process.exit(1);
});
