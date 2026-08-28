/**
 * Runs the daily update from your machine, against production Firestore.
 *
 * Same code path as the deployed `updateFixtures` scheduler — both call
 * runUpdateJob() — so this is a way to bring things up to date immediately
 * rather than waiting for 00:00 or pushing a deploy.
 *
 * Setup is the same as syncLeagues.js: FOOTBALL_API_KEY in functions/.env.local,
 * Firestore credentials from the project's .env.local.
 *
 * Usage:
 *   node functions/scripts/updateNow.js --registry-only --dry-run
 *       Show which clubs would be created/archived. Writes nothing.
 *
 *   node functions/scripts/updateNow.js --registry-only
 *       Reconcile the club registry and rebuild config/clubDirectory.
 *       Uses the stored league catalogue, so it costs no API calls.
 *
 *   node functions/scripts/updateNow.js
 *       The full job: registry, then fixtures and squads for every club.
 *       Roughly 2 API calls per club.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

/**
 * Minimal .env reader — see syncLeagues.js for the same helper.
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

const registryOnly = process.argv.includes("--registry-only");
const dryRun = process.argv.includes("--dry-run");

for (const key of ["ADMIN_PROJECT_ID", "ADMIN_CLIENT_EMAIL", "ADMIN_PRIVATE_KEY"]) {
  if (!env[key]) {
    console.error(`\n  ${key} is not set — expected it in .env.local\n`);
    process.exit(1);
  }
}

// Fixtures and squads need the API. The registry can run off the stored
// catalogue alone, so only demand a key when we'll actually call out.
if (!registryOnly && !env.FOOTBALL_API_KEY) {
  console.error(
    "\n  FOOTBALL_API_KEY is not set.\n" +
      "  Add it to functions/.env.local, or pass --registry-only.\n",
  );
  process.exit(1);
}

if (env.FOOTBALL_API_KEY) process.env.FOOTBALL_API_KEY = env.FOOTBALL_API_KEY;

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
const { SEASON, LEAGUE_ID, isClubGroup } = require("../helperFunctions");
const { runUpdateJob, readTeamsFromCatalogue } = require("../updateJob");

/**
 * Reports what the reconcile would change, without writing. Mirrors the
 * reconcile's own matching rules so the preview can't disagree with the run.
 * @return {Promise<void>}
 */
async function preview() {
  const teams = await readTeamsFromCatalogue({
    db,
    season: SEASON,
    leagueId: LEAGUE_ID,
  });

  if (!teams.length) {
    console.error(
      `\n  No league catalogue for season ${SEASON}, league ${LEAGUE_ID}.\n` +
        `  Run: node functions/scripts/syncLeagues.js --leagues=${LEAGUE_ID}\n`,
    );
    process.exit(1);
  }

  const ids = new Set(teams.map((t) => String(t.team.id)));
  const groups = await db.collection("groups").get();
  const clubs = new Map();

  groups.forEach((doc) => {
    if (isClubGroup(doc.id, doc.data())) clubs.set(doc.id, doc.data());
  });

  const created = teams.filter((t) => !clubs.has(String(t.team.id)));
  const archived = [...clubs].filter(
    ([id, d]) => !ids.has(id) && d.status !== "archived",
  );
  const renamed = teams.filter((t) => {
    const doc = clubs.get(String(t.team.id));
    return doc && doc.name !== t.team.name;
  });

  console.log(`  Catalogue : ${teams.length} clubs in league ${LEAGUE_ID} ${SEASON}`);
  console.log(`  Registry  : ${clubs.size} club group docs\n`);

  console.log(`  CREATE  (${created.length})`);
  created.forEach((t) => console.log(`    + ${t.team.id}  ${t.team.name}`));

  console.log(`  ARCHIVE (${archived.length})`);
  archived.forEach(([id, d]) => console.log(`    - ${id}  ${d.name}`));

  console.log(`  RENAME  (${renamed.length})`);
  renamed.forEach((t) =>
    console.log(
      `    ~ ${t.team.id}  "${clubs.get(String(t.team.id)).name}" -> "${t.team.name}"`,
    ),
  );
}

(async () => {
  console.log("");
  console.log(`  Project : ${env.ADMIN_PROJECT_ID}`);
  console.log(`  Season  : ${SEASON}   League: ${LEAGUE_ID}`);
  console.log(
    `  Mode    : ${
      dryRun
        ? "DRY RUN — nothing will be written"
        : registryOnly
          ? "registry + directory"
          : "FULL — registry, fixtures and squads"
    }`,
  );
  console.log("");

  if (dryRun) {
    await preview();
    console.log("\n  (dry run — nothing written)\n");
    process.exit(0);
  }

  const result = await runUpdateJob({
    db,
    season: SEASON,
    leagueId: LEAGUE_ID,
    // The catalogue is already verified and costs nothing; the API is the
    // fallback inside runUpdateJob if it hasn't been synced.
    teamSource: "catalogue",
    skipFixtures: registryOnly,
    logger: {
      info: (...a) => console.log("  " + a[0]),
      error: (...a) => console.error("  ERROR " + a.join(" ")),
    },
  });

  const r = result.reconcile;
  console.log("");
  if (r && !r.skipped) {
    console.log(`  created     ${r.created.length}`);
    r.created.forEach((c) => console.log(`    + ${c.teamId}  ${c.name}  /${c.slug}`));
    console.log(`  archived    ${r.archived.length}`);
    r.archived.forEach((c) => console.log(`    - ${c.teamId}  ${c.name}`));
    console.log(`  reactivated ${r.reactivated.length}`);
  }
  if (!registryOnly) {
    console.log(`  fixtures    ${result.fixtures}`);
    console.log(`  squads      ${result.squads}`);
  }
  console.log("");
  process.exit(0);
})().catch((error) => {
  console.error("\n  Update failed:", error.message, "\n");
  process.exit(1);
});
