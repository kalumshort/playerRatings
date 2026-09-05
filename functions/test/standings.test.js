/**
 * Standings suite.
 *
 * Run with:  npm --prefix functions run test:standings
 *
 * The API is stubbed, so this covers the parts that are ours: the Firestore
 * layout, the derived points adjustment, and the group handling that keeps a
 * group stage from collapsing into one table of joint-first teams.
 *
 * The canned responses mirror real ones — the 2023/24 Premier League really did
 * carry an Everton deduction, and the Champions League really did return eight
 * groups before the league phase replaced them.
 */
const assert = require("node:assert/strict");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

initializeApp({ projectId: "standings-test" });
const db = getFirestore();

// Swap the API client before standings.js destructures it at require time.
const helpers = require("../helperFunctions");
const calls = [];
let apiResponses = {};

helpers.fetchFootballApi = async (endpoint, params) => {
  calls.push({ endpoint, params });
  const canned = apiResponses[`${endpoint}:${params.league}`];
  if (canned instanceof Error) throw canned;
  return canned || [];
};

const { mapStandingRow, syncStandings } = require("../standings");

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

/**
 * Clears the catalogue between cases.
 *
 * recursiveDelete, not a query-and-delete: a table written before its league
 * doc exists leaves the league as a missing ancestor, and `.get()` on the
 * collection does not return those — so a hand-rolled cleanup silently leaves
 * `39/table/current` behind and the next case sees a stale document.
 */
async function resetDb() {
  calls.length = 0;
  apiResponses = {};
  await db.recursiveDelete(db.collection("leagues"));
}

/**
 * Builds a standings row in the API's own shape.
 * @param {object} args - Row parts.
 * @return {object} API row.
 */
const row = ({ rank, id, name, points, win, draw, lose, gf, ga, group }) => ({
  rank,
  team: { id, name, logo: "" },
  points,
  goalsDiff: gf - ga,
  group,
  form: "WWDLW",
  status: "same",
  description: rank <= 4 ? "Promotion - Champions League (Group Stage)" : null,
  all: { played: win + draw + lose, win, draw, lose, goals: { for: gf, against: ga } },
  home: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } },
  away: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } },
  update: "2026-09-05T00:00:00+00:00",
});

/**
 * Wraps groups in the API's standings envelope.
 * @param {number} id - League id.
 * @param {string} name - League name.
 * @param {Array<Array<object>>} groups - Rows, grouped.
 * @return {Array<object>} API response.
 */
const standingsResponse = (id, name, groups) => [
  { league: { id, name, country: "England", logo: "", flag: null, standings: groups } },
];

(async () => {
  console.log("\nRow mapping");

  await it("a points deduction is derived from the gap to earned points", () => {
    // Everton 2023/24: 13W 9D is 48 earned, and the table said 40.
    const mapped = mapStandingRow(
      row({ rank: 15, id: 45, name: "Everton", points: 40, win: 13, draw: 9, lose: 16, gf: 40, ga: 51 }),
    );
    assert.equal(mapped.pointsAdjustment, -8);
    assert.equal(mapped.points, 40);
  });

  await it("an ordinary row has no adjustment", () => {
    const mapped = mapStandingRow(
      row({ rank: 1, id: 42, name: "Arsenal", points: 85, win: 26, draw: 7, lose: 5, gf: 90, ga: 46 }),
    );
    assert.equal(mapped.pointsAdjustment, 0);
  });

  await it("a row with no team is dropped rather than mapped to junk", () => {
    assert.equal(mapStandingRow({ rank: 1, points: 10 }), null);
    assert.equal(mapStandingRow(null), null);
  });

  await it("a missing logo falls back to the CDN path", () => {
    const mapped = mapStandingRow(
      row({ rank: 1, id: 40, name: "Liverpool", points: 3, win: 1, draw: 0, lose: 0, gf: 2, ga: 0 }),
    );
    assert.ok(mapped.teamLogo.includes("/teams/40.png"));
  });

  console.log("\nWrites");

  await it("a table lands at leagues/season/{season}/{leagueId}/table/current", async () => {
    await resetDb();
    apiResponses["standings:39"] = standingsResponse(39, "Premier League", [
      [
        row({ rank: 1, id: 42, name: "Arsenal", points: 85, win: 26, draw: 7, lose: 5, gf: 90, ga: 46, group: "Premier League" }),
        row({ rank: 2, id: 40, name: "Liverpool", points: 82, win: 25, draw: 7, lose: 6, gf: 86, ga: 41, group: "Premier League" }),
      ],
    ]);

    await syncStandings({ db, season: SEASON, leagueIds: [39] });

    const doc = await db
      .collection("leagues").doc("season").collection(SEASON)
      .doc("39").collection("table").doc("current")
      .get();

    assert.ok(doc.exists);
    const data = doc.data();
    assert.equal(data.name, "Premier League");
    assert.equal(data.season, SEASON);
    assert.equal(data.groups.length, 1);
    assert.equal(data.groups[0].rows.length, 2);
    assert.equal(data.groups[0].rows[0].teamName, "Arsenal");
    assert.deepEqual(data.teamIds, ["42", "40"]);
  });

  await it("a group stage keeps its groups instead of flattening", async () => {
    await resetDb();
    // Flattened, these eight teams would all read as joint first.
    apiResponses["standings:2"] = standingsResponse(2, "UEFA Champions League", [
      [row({ rank: 1, id: 157, name: "Bayern", points: 16, win: 5, draw: 1, lose: 0, gf: 15, ga: 4, group: "Group A" })],
      [row({ rank: 1, id: 42, name: "Arsenal", points: 13, win: 4, draw: 1, lose: 1, gf: 16, ga: 4, group: "Group B" })],
    ]);

    await syncStandings({ db, season: SEASON, leagueIds: [2] });

    const doc = await db
      .collection("leagues").doc("season").collection(SEASON)
      .doc("2").collection("table").doc("current")
      .get();

    const data = doc.data();
    assert.equal(data.groups.length, 2);
    assert.equal(data.groups[0].name, "Group A");
    assert.equal(data.groups[1].name, "Group B");
    assert.equal(data.teamCount, 2);
  });

  await it("re-running merges rather than duplicating", async () => {
    await resetDb();
    apiResponses["standings:39"] = standingsResponse(39, "Premier League", [
      [row({ rank: 1, id: 42, name: "Arsenal", points: 3, win: 1, draw: 0, lose: 0, gf: 2, ga: 0, group: "Premier League" })],
    ]);

    await syncStandings({ db, season: SEASON, leagueIds: [39] });
    await syncStandings({ db, season: SEASON, leagueIds: [39] });

    const table = await db
      .collection("leagues").doc("season").collection(SEASON)
      .doc("39").collection("table").get();

    assert.equal(table.size, 1, "one table document, not two");
  });

  console.log("\nTargeting");

  await it("only table-bearing competitions are fetched", async () => {
    await resetDb();
    // 45 is the FA Cup: bracket: true, table: false.
    await syncStandings({ db, season: SEASON, leagueIds: [45] });
    assert.equal(calls.length, 0, "a bracket-only cup has no table to fetch");
  });

  await it("the European league phase does get a table", async () => {
    await resetDb();
    await syncStandings({ db, season: SEASON, leagueIds: [2] });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].endpoint, "standings");
  });

  await it("an untracked league id is never fetched", async () => {
    await resetDb();
    await syncStandings({ db, season: SEASON, leagueIds: [99999] });
    assert.equal(calls.length, 0);
  });

  console.log("\nFailure handling");

  await it("a competition with no table is reported, not silently skipped", async () => {
    await resetDb();
    // Nothing canned: the API returns [] for a season that hasn't started.
    const summary = await syncStandings({ db, season: SEASON, leagueIds: [39] });

    assert.equal(summary.empty.length, 1);
    assert.equal(summary.empty[0].leagueId, "39");
    assert.equal(summary.leaguesWritten, 0);
  });

  await it("one failing competition does not stop the others", async () => {
    await resetDb();
    apiResponses["standings:39"] = new Error("rate limited");
    apiResponses["standings:40"] = standingsResponse(40, "Championship", [
      [row({ rank: 1, id: 63, name: "Leeds", points: 90, win: 28, draw: 6, lose: 12, gf: 80, ga: 40, group: "Championship" })],
    ]);

    const summary = await syncStandings({ db, season: SEASON, leagueIds: [39, 40] });

    assert.equal(summary.failures.length, 1);
    assert.equal(summary.failures[0].leagueId, "39");
    assert.equal(summary.leaguesWritten, 1);

    const written = await db
      .collection("leagues").doc("season").collection(SEASON)
      .doc("40").collection("table").doc("current").get();
    assert.ok(written.exists);
  });

  await it("a dry run fetches but writes nothing", async () => {
    await resetDb();
    apiResponses["standings:39"] = standingsResponse(39, "Premier League", [
      [row({ rank: 1, id: 42, name: "Arsenal", points: 3, win: 1, draw: 0, lose: 0, gf: 2, ga: 0, group: "Premier League" })],
    ]);

    const summary = await syncStandings({ db, season: SEASON, leagueIds: [39], dryRun: true });

    assert.equal(calls.length, 1, "the API is still called — that is the point");
    assert.equal(summary.leaguesWritten, 1);

    const doc = await db
      .collection("leagues").doc("season").collection(SEASON)
      .doc("39").collection("table").doc("current").get();
    assert.equal(doc.exists, false);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
