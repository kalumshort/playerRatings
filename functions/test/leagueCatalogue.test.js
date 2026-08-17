/**
 * League catalogue suite.
 *
 * Run with:  npm --prefix functions run test:catalogue
 *
 * The API is stubbed, so this covers the parts that are ours: the Firestore
 * layout, and the failure handling that decides whether a mistyped league id
 * shows up as a loud empty result or a silently successful run.
 */
const assert = require("node:assert/strict");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

initializeApp({ projectId: "catalogue-test" });
const db = getFirestore();

// Swap the API client before leagueCatalogue destructures it at require time.
const helpers = require("../helperFunctions");
const calls = [];
let apiResponses = {};

helpers.fetchFootballApi = async (endpoint, params) => {
  calls.push({ endpoint, params });

  const key = `${endpoint}:${params.id ?? params.league}`;
  const canned = apiResponses[key];

  if (canned instanceof Error) throw canned;

  return canned || [];
};

const { syncLeagueTeams, TRACKED_LEAGUES } = require("../leagueCatalogue");

const SEASON = "2026";

let passed = 0;
let failed = 0;

/**
 * Runs one named case, reporting rather than throwing so the suite completes.
 * @param {string} name - What the case protects.
 * @param {Function} fn - The case body.
 */
async function it(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}\n      ${err.message.split("\n")[0]}`);
    failed++;
  }
}

/** Clears the catalogue between cases. */
async function resetDb() {
  const seasons = await db.collection("leagues").doc("season").listCollections();

  for (const seasonCol of seasons) {
    const leagues = await seasonCol.get();

    for (const league of leagues.docs) {
      const teams = await league.ref.collection("teams").get();
      await Promise.all(teams.docs.map((d) => d.ref.delete()));
      await league.ref.delete();
    }
  }
  calls.length = 0;
  apiResponses = {};
}

const leagueMeta = (id, name, country) => [
  {
    league: { id, name, type: "League", logo: `https://x.test/l${id}.png` },
    country: { name: country, code: "GB", flag: "https://x.test/f.svg" },
  },
];

const teamEntry = (id, name) => ({
  team: { id, name, code: null, country: "England", founded: 1900, logo: "" },
  venue: { id: id * 10, name: `${name} Park`, city: "Town", capacity: 30000 },
});

(async () => {
  console.log("\nConfig");
  await it("tracked leagues are unique and cover the English top four", () => {
    const ids = TRACKED_LEAGUES.map((l) => l.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate league id");

    for (const id of [39, 40, 41, 42]) {
      assert.ok(ids.includes(id), `missing English tier ${id}`);
    }
    assert.ok(
      TRACKED_LEAGUES.filter((l) => l.group === "world").length >= 10,
      "expected at least 10 world leagues",
    );
  });

  console.log("\nWrites");
  await it("a league lands at leagues/season/{season}/{leagueId}", async () => {
    await resetDb();
    apiResponses["leagues:39"] = leagueMeta(39, "Premier League", "England");
    apiResponses["teams:39"] = [teamEntry(42, "Arsenal"), teamEntry(40, "Liverpool")];

    await syncLeagueTeams({ db, season: SEASON, leagueIds: [39] });

    const doc = await db
      .collection("leagues")
      .doc("season")
      .collection(SEASON)
      .doc("39")
      .get();

    assert.ok(doc.exists);
    const data = doc.data();
    assert.equal(data.name, "Premier League");
    assert.equal(data.country, "England");
    assert.equal(data.season, SEASON);
    assert.equal(data.teamCount, 2);
    assert.deepEqual(data.teamIds.sort(), ["40", "42"]);
  });

  await it("each team is a doc under the league, with its venue", async () => {
    await resetDb();
    apiResponses["leagues:39"] = leagueMeta(39, "Premier League", "England");
    apiResponses["teams:39"] = [teamEntry(42, "Arsenal")];

    await syncLeagueTeams({ db, season: SEASON, leagueIds: [39] });

    const team = await db
      .collection("leagues")
      .doc("season")
      .collection(SEASON)
      .doc("39")
      .collection("teams")
      .doc("42")
      .get();

    assert.ok(team.exists);
    assert.equal(team.data().name, "Arsenal");
    assert.equal(team.data().leagueId, "39");
    assert.equal(team.data().venue.capacity, 30000);
    // Derived when the API omits it, so the UI never renders a broken crest.
    assert.equal(
      team.data().logo,
      "https://media.api-sports.io/football/teams/42.png",
    );
  });

  await it("seasons are separate documents", async () => {
    await resetDb();
    apiResponses["leagues:39"] = leagueMeta(39, "Premier League", "England");
    apiResponses["teams:39"] = [teamEntry(42, "Arsenal")];

    await syncLeagueTeams({ db, season: "2025", leagueIds: [39] });
    await syncLeagueTeams({ db, season: "2026", leagueIds: [39] });

    for (const season of ["2025", "2026"]) {
      const doc = await db
        .collection("leagues")
        .doc("season")
        .collection(season)
        .doc("39")
        .get();
      assert.ok(doc.exists, `season ${season} missing`);
      assert.equal(doc.data().season, season);
    }
  });

  console.log("\nBad league ids");
  await it("a league returning nothing is reported, not silently skipped", async () => {
    await resetDb();
    // Nothing canned for 999 — the stub returns [], as the API does for a
    // league id that doesn't exist.
    const summary = await syncLeagueTeams({ db, season: SEASON, leagueIds: [39] });

    assert.equal(summary.empty.length, 1);
    assert.equal(summary.empty[0].leagueId, "39");
    assert.equal(summary.leaguesWritten, 0);
  });

  await it("the summary pairs the API's name against the expected one", async () => {
    await resetDb();
    // A mistyped id resolves to a real league — just the wrong one. The
    // mismatch between `name` and `expected` is the only way to notice.
    apiResponses["leagues:39"] = leagueMeta(39, "Serie A", "Italy");
    apiResponses["teams:39"] = [teamEntry(1, "Inter")];

    const summary = await syncLeagueTeams({ db, season: SEASON, leagueIds: [39] });

    assert.equal(summary.results[0].expected, "Premier League");
    assert.equal(summary.results[0].name, "Serie A");
    assert.notEqual(summary.results[0].name, summary.results[0].expected);
  });

  console.log("\nIsolation");
  await it("one failing league does not stop the others", async () => {
    await resetDb();
    apiResponses["leagues:39"] = new Error("rate limited");
    apiResponses["leagues:40"] = leagueMeta(40, "Championship", "England");
    apiResponses["teams:40"] = [teamEntry(63, "Leeds")];

    const summary = await syncLeagueTeams({
      db,
      season: SEASON,
      leagueIds: [39, 40],
    });

    assert.equal(summary.failures.length, 1);
    assert.equal(summary.failures[0].leagueId, "39");
    assert.equal(summary.teamsWritten, 1);

    const written = await db
      .collection("leagues")
      .doc("season")
      .collection(SEASON)
      .doc("40")
      .get();
    assert.ok(written.exists);
  });

  await it("an unknown league id is never fetched", async () => {
    await resetDb();
    // 99999 isn't in TRACKED_LEAGUES, so it must not reach the API.
    await syncLeagueTeams({ db, season: SEASON, leagueIds: [99999] });

    assert.equal(calls.length, 0);
  });

  await it("no leagueIds means every tracked league", async () => {
    await resetDb();
    const summary = await syncLeagueTeams({ db, season: SEASON });

    assert.equal(summary.leaguesRequested, TRACKED_LEAGUES.length);
  });

  await it("re-running merges rather than duplicating", async () => {
    await resetDb();
    apiResponses["leagues:39"] = leagueMeta(39, "Premier League", "England");
    apiResponses["teams:39"] = [teamEntry(42, "Arsenal")];

    await syncLeagueTeams({ db, season: SEASON, leagueIds: [39] });
    await syncLeagueTeams({ db, season: SEASON, leagueIds: [39] });

    const teams = await db
      .collection("leagues")
      .doc("season")
      .collection(SEASON)
      .doc("39")
      .collection("teams")
      .get();

    assert.equal(teams.size, 1);
  });

  await resetDb();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
