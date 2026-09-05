/**
 * Live league table suite.
 *
 * Run with:  npm run test:table
 *
 * The overlay is the one place in this feature where a subtle bug produces a
 * table that looks entirely plausible and is wrong, so the cases here are
 * mostly about what must NOT happen: double-counting a result the provider has
 * already absorbed, or re-ordering a table when nothing has actually moved.
 *
 * Plain node, like test/rules.test.mjs — the module is TypeScript, so it runs
 * through Node's type stripping rather than a build step.
 */
import assert from "node:assert/strict";

import {
  buildLiveTable,
  toTableFixture,
  windowAround,
} from "../src/lib/league/liveTable.ts";

let passed = 0;
let failed = 0;

/**
 * Runs one named case, reporting rather than throwing so the suite completes.
 * @param {string} name What the case protects.
 * @param {Function} fn The case body.
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

const split = (played, win, draw, lose, gf, ga) => ({
  played,
  win,
  draw,
  lose,
  goals: { for: gf, against: ga },
});

/** A row as the standings document stores it. */
const row = ({ rank, id, name, points, win, draw, lose, gf, ga, adj = 0 }) => ({
  rank,
  teamId: String(id),
  teamName: name,
  teamLogo: "",
  points,
  pointsAdjustment: adj,
  goalsDiff: gf - ga,
  form: null,
  status: null,
  description: null,
  all: split(win + draw + lose, win, draw, lose, gf, ga),
  home: split(0, 0, 0, 0, 0, 0),
  away: split(0, 0, 0, 0, 0, 0),
  update: null,
});

const table = (rows) => ({
  leagueId: "39",
  season: "2026",
  name: "Premier League",
  logo: "",
  country: "England",
  flag: null,
  groups: [{ name: "Premier League", rows }],
  teamIds: rows.map((r) => r.teamId),
  teamCount: rows.length,
  fetchedAt: null,
});

const fx = ({ id, home, away, hg = null, ag = null, status = "NS", ts = 0 }) => ({
  fixtureId: String(id),
  timestamp: ts,
  status,
  homeTeamId: String(home),
  awayTeamId: String(away),
  goals: { home: hg, away: ag },
});

/** Two clubs level on 10 points, ranked 1 and 2. */
const base = () =>
  table([
    row({ rank: 1, id: 40, name: "Liverpool", points: 10, win: 3, draw: 1, lose: 0, gf: 9, ga: 3 }),
    row({ rank: 2, id: 42, name: "Arsenal", points: 10, win: 3, draw: 1, lose: 0, gf: 8, ga: 3 }),
    row({ rank: 3, id: 50, name: "Man City", points: 4, win: 1, draw: 1, lose: 2, gf: 5, ga: 6 }),
  ]);

const find = (result, teamId) =>
  result.groups[0].rows.find((r) => r.teamId === String(teamId));

console.log("\nQuiet table");

await it("no fixtures leaves the official table untouched", async () => {
  const result = buildLiveTable(base(), []);

  assert.equal(result.isLive, false);
  assert.equal(result.appliedFixtureIds.length, 0);
  assert.deepEqual(
    result.groups[0].rows.map((r) => r.teamId),
    ["40", "42", "50"],
  );
  assert.equal(find(result, 40).points, 10);
  assert.equal(find(result, 40).rankDelta, 0);
  assert.equal(find(result, 40).provisional, false);
});

await it("a finished match the provider already counted is not applied twice", async () => {
  // Every club's `played` already covers its fixtures, so pending is zero.
  const result = buildLiveTable(
    base(),
    [
      fx({ id: 1, home: 40, away: 50, hg: 3, ag: 0, status: "FT", ts: 100 }),
      fx({ id: 2, home: 42, away: 50, hg: 2, ag: 0, status: "FT", ts: 200 }),
      fx({ id: 3, home: 40, away: 42, hg: 1, ag: 1, status: "FT", ts: 300 }),
      fx({ id: 4, home: 42, away: 40, hg: 1, ag: 1, status: "FT", ts: 400 }),
    ],
  );

  assert.equal(result.isLive, false, "nothing should have been applied");
  assert.equal(find(result, 40).points, 10);
  assert.equal(find(result, 40).all.played, 4);
});

await it("a postponed or cancelled match is never applied", async () => {
  for (const status of ["PST", "CANC", "ABD", "AWD", "WO", "NS", "TBD"]) {
    const result = buildLiveTable(
      base(),
      [fx({ id: 9, home: 40, away: 42, hg: 5, ag: 0, status, ts: 999 })],
    );
    assert.equal(result.isLive, false, `${status} must not be applied`);
  }
});

console.log("\nLive matches");

await it("a live match is applied to both clubs", async () => {
  const result = buildLiveTable(
    base(),
    [fx({ id: 10, home: 50, away: 40, hg: 2, ag: 0, status: "2H", ts: 500 })],
  );

  assert.equal(result.isLive, true);
  assert.equal(result.inPlayCount, 1);

  const city = find(result, 50);
  assert.equal(city.points, 7, "4 + 3 for the win in progress");
  assert.equal(city.all.played, 5);
  assert.equal(city.all.goals.for, 7);

  const pool = find(result, 40);
  assert.equal(pool.points, 10, "no points from a loss");
  assert.equal(pool.all.goals.against, 5);
});

await it("a live match applies to the right home/away split", async () => {
  const result = buildLiveTable(
    base(),
    [fx({ id: 11, home: 50, away: 40, hg: 1, ag: 0, status: "1H", ts: 500 })],
  );

  assert.equal(find(result, 50).home.played, 1, "the home club's home split");
  assert.equal(find(result, 50).away.played, 0);
  assert.equal(find(result, 40).away.played, 1, "the away club's away split");
  assert.equal(find(result, 40).home.played, 0);
});

await it("a goalless live match still counts as played, one point each", async () => {
  const result = buildLiveTable(
    base(),
    [fx({ id: 12, home: 40, away: 42, hg: null, ag: null, status: "1H", ts: 500 })],
  );

  assert.equal(find(result, 40).points, 11);
  assert.equal(find(result, 42).points, 11);
  assert.equal(find(result, 40).all.played, 5);
});

console.log("\nRanking");

await it("a live win reorders the table and records the movement", async () => {
  // City are 3rd on 4. A 3-0 win takes them to 7 — still 3rd.
  // Arsenal beating Liverpool would take Arsenal to 13 and 1st.
  const result = buildLiveTable(
    base(),
    [fx({ id: 13, home: 42, away: 40, hg: 2, ag: 0, status: "2H", ts: 500 })],
  );

  assert.equal(find(result, 42).rank, 1);
  assert.equal(find(result, 42).baseRank, 2);
  assert.equal(find(result, 42).rankDelta, 1, "Arsenal climb one");
  assert.equal(find(result, 42).provisional, true);

  assert.equal(find(result, 40).rank, 2);
  assert.equal(find(result, 40).rankDelta, -1);
});

await it("clubs the tiebreak cannot separate keep the official order", async () => {
  // City's live win leaves the top two untouched and level on points and GD.
  const result = buildLiveTable(
    base(),
    [fx({ id: 14, home: 50, away: 40, hg: 0, ag: 0, status: "HT", ts: 500 })],
  );

  const order = result.groups[0].rows.map((r) => r.teamId);
  assert.equal(order[0], "40", "Liverpool keep first on goals scored");
  assert.equal(order[1], "42");
});

console.log("\nReconciliation");

await it("a result the provider has not absorbed yet is applied once", async () => {
  // Liverpool's row says 4 played; we can see 5 finished fixtures for them.
  const standings = table([
    row({ rank: 1, id: 40, name: "Liverpool", points: 10, win: 3, draw: 1, lose: 0, gf: 9, ga: 3 }),
    row({ rank: 2, id: 42, name: "Arsenal", points: 10, win: 3, draw: 1, lose: 0, gf: 8, ga: 3 }),
  ]);

  const fixtures = [
    fx({ id: 1, home: 40, away: 42, hg: 1, ag: 1, status: "FT", ts: 100 }),
    fx({ id: 2, home: 42, away: 40, hg: 1, ag: 1, status: "FT", ts: 200 }),
    fx({ id: 3, home: 40, away: 42, hg: 1, ag: 1, status: "FT", ts: 300 }),
    fx({ id: 4, home: 42, away: 40, hg: 1, ag: 1, status: "FT", ts: 400 }),
    // The fifth: finished for both, counted for neither.
    fx({ id: 5, home: 40, away: 42, hg: 3, ag: 0, status: "FT", ts: 500 }),
  ];

  const result = buildLiveTable(standings, fixtures);

  assert.deepEqual(result.appliedFixtureIds, ["5"]);
  assert.equal(find(result, 40).points, 13);
  assert.equal(find(result, 40).all.played, 5);
  assert.equal(result.reconciliation, "clean");
});

await it("pending clamps to zero when our own fixtures lag the provider", async () => {
  // The table says 10 played; we hold two fixtures. A negative pending must
  // not turn into "apply everything".
  const standings = table([
    row({ rank: 1, id: 40, name: "Liverpool", points: 30, win: 10, draw: 0, lose: 0, gf: 30, ga: 5 }),
    row({ rank: 2, id: 42, name: "Arsenal", points: 20, win: 6, draw: 2, lose: 2, gf: 20, ga: 12 }),
  ]);

  const result = buildLiveTable(standings, [
    fx({ id: 1, home: 40, away: 42, hg: 3, ag: 0, status: "FT", ts: 100 }),
    fx({ id: 2, home: 42, away: 40, hg: 1, ag: 1, status: "FT", ts: 200 }),
  ]);

  assert.equal(result.isLive, false, "nothing applied when the base is ahead");
  assert.equal(find(result, 40).points, 30);
});

await it("a result counted for one club but not the other is left out", async () => {
  // Liverpool's row is behind by one; Arsenal's is up to date. Applying the
  // shared fixture would break Arsenal, so it is skipped and flagged.
  const standings = table([
    row({ rank: 1, id: 40, name: "Liverpool", points: 3, win: 1, draw: 0, lose: 0, gf: 3, ga: 0 }),
    row({ rank: 2, id: 42, name: "Arsenal", points: 3, win: 1, draw: 0, lose: 1, gf: 3, ga: 3 }),
  ]);

  const result = buildLiveTable(standings, [
    fx({ id: 1, home: 40, away: 42, hg: 3, ag: 0, status: "FT", ts: 100 }),
    fx({ id: 2, home: 42, away: 40, hg: 3, ag: 0, status: "FT", ts: 200 }),
  ]);

  assert.equal(result.reconciliation, "partial");
  assert.equal(result.isLive, false);
});

console.log("\nQualification zones");

await it("a zone belongs to the position, not to the club that held it", async () => {
  // Arsenal are officially 2nd with a Champions League description and
  // Man City 3rd with none. A live Arsenal defeat drops them to 3rd — the
  // Champions League stripe has to stay on 2nd, which is now City.
  const standings = table([
    row({ rank: 1, id: 40, name: "Liverpool", points: 10, win: 3, draw: 1, lose: 0, gf: 9, ga: 3 }),
    row({ rank: 2, id: 42, name: "Arsenal", points: 7, win: 2, draw: 1, lose: 1, gf: 8, ga: 5 }),
    row({ rank: 3, id: 50, name: "Man City", points: 6, win: 2, draw: 0, lose: 2, gf: 7, ga: 6 }),
  ]);
  standings.groups[0].rows[0].description = "Promotion - Champions League";
  standings.groups[0].rows[1].description = "Promotion - Champions League";
  standings.groups[0].rows[2].description = null;

  const result = buildLiveTable(standings, [
    // Arsenal losing 0-3 to a club outside the top three would need a fourth
    // row, so instead City beat Arsenal and swap with them.
    fx({ id: 30, home: 50, away: 42, hg: 3, ag: 0, status: "2H", ts: 500 }),
  ]);

  const rows = result.groups[0].rows;
  assert.equal(rows[1].teamId, "50", "City should now be 2nd");
  assert.equal(rows[2].teamId, "42", "Arsenal should now be 3rd");

  assert.equal(rows[1].zone, "champions-league", "2nd keeps the CL place");
  assert.equal(rows[2].zone, null, "3rd has no place, whoever is standing there");
});

await it("the relegation zone stays on the bottom positions", async () => {
  const standings = table([
    row({ rank: 1, id: 40, name: "Liverpool", points: 9, win: 3, draw: 0, lose: 0, gf: 9, ga: 3 }),
    row({ rank: 2, id: 42, name: "Arsenal", points: 3, win: 1, draw: 0, lose: 2, gf: 4, ga: 6 }),
    row({ rank: 3, id: 50, name: "Man City", points: 1, win: 0, draw: 1, lose: 2, gf: 3, ga: 7 }),
  ]);
  standings.groups[0].rows[2].description = "Relegation";

  // City win and climb above Arsenal; the drop is now Arsenal's problem.
  const result = buildLiveTable(standings, [
    fx({ id: 31, home: 50, away: 42, hg: 4, ag: 0, status: "2H", ts: 500 }),
  ]);

  const rows = result.groups[0].rows;
  assert.equal(rows[1].teamId, "50");
  assert.equal(rows[2].teamId, "42");
  assert.equal(rows[1].zone, null);
  assert.equal(rows[2].zone, "relegation", "the drop belongs to last place");
});

await it("an untouched table keeps the official zones", async () => {
  const standings = base();
  standings.groups[0].rows[0].description = "Promotion - Champions League";

  const result = buildLiveTable(standings, []);
  assert.equal(find(result, 40).zone, "champions-league");
  assert.equal(find(result, 42).zone, null);
});

console.log("\nLive match on the row");

await it("the score is from each club's own point of view", async () => {
  // The table reads down a column of clubs, so "2-0" beside a name has to
  // mean that club is two up, whichever end of the fixture they are.
  const result = buildLiveTable(
    base(),
    [fx({ id: 40, home: 50, away: 40, hg: 2, ag: 0, status: "2H", ts: 500 })],
  );

  const city = find(result, 50).liveMatch;
  assert.equal(city.scored, 2);
  assert.equal(city.conceded, 0);
  assert.equal(city.isHome, true);

  const pool = find(result, 40).liveMatch;
  assert.equal(pool.scored, 0);
  assert.equal(pool.conceded, 2);
  assert.equal(pool.isHome, false);
  assert.equal(pool.opponentId, "50");
});

await it("a club not playing has no live match", async () => {
  const result = buildLiveTable(
    base(),
    [fx({ id: 41, home: 50, away: 40, hg: 1, ag: 0, status: "1H", ts: 500 })],
  );
  assert.equal(find(result, 42).liveMatch, null);
});

await it("a finished result does not masquerade as a live match", async () => {
  // It is already in the numbers; showing it would read as still in progress.
  const standings = table([
    row({ rank: 1, id: 40, name: "Liverpool", points: 3, win: 1, draw: 0, lose: 0, gf: 3, ga: 0 }),
    row({ rank: 2, id: 42, name: "Arsenal", points: 0, win: 0, draw: 0, lose: 1, gf: 0, ga: 3 }),
  ]);

  const result = buildLiveTable(standings, [
    fx({ id: 1, home: 40, away: 42, hg: 3, ag: 0, status: "FT", ts: 100 }),
    fx({ id: 2, home: 42, away: 40, hg: 1, ag: 0, status: "FT", ts: 200 }),
  ]);

  assert.equal(find(result, 40).liveMatch, null);
  assert.equal(find(result, 42).liveMatch, null);
});

await it("the elapsed minute comes off the nested status", async () => {
  const parsed = toTableFixture({
    matchId: "9",
    fixture: { id: 9, timestamp: 1, status: { short: "2H", elapsed: 67 } },
    teams: { home: { id: 40, name: "Liverpool" }, away: { id: 42, name: "Arsenal" } },
    goals: { home: 1, away: 0 },
  });

  assert.equal(parsed.elapsed, 67);
  assert.equal(parsed.homeName, "Liverpool");
  assert.equal(parsed.awayName, "Arsenal");
});

console.log("\nDeductions and scope");

await it("a points deduction survives the overlay", async () => {
  const standings = table([
    row({ rank: 1, id: 40, name: "Liverpool", points: 10, win: 3, draw: 1, lose: 0, gf: 9, ga: 3 }),
    // 3W 1D earns 10; the row says 2, so an 8-point deduction.
    row({ rank: 2, id: 45, name: "Everton", points: 2, win: 3, draw: 1, lose: 0, gf: 8, ga: 3, adj: -8 }),
  ]);

  const result = buildLiveTable(standings, [
    fx({ id: 1, home: 45, away: 40, hg: 2, ag: 0, status: "2H", ts: 500 }),
  ]);

  const everton = find(result, 45);
  assert.equal(everton.points, 5, "2 + 3, the deduction intact");
  assert.equal(everton.pointsAdjustment, -8, "the adjustment is not recomputed");
});

await it("a fixture against a club outside the table is ignored", async () => {
  // A cup tie against lower-league opposition must not touch a league record.
  const result = buildLiveTable(
    base(),
    [fx({ id: 20, home: 40, away: 9999, hg: 4, ag: 0, status: "2H", ts: 500 })],
  );

  assert.equal(result.isLive, false);
  assert.equal(find(result, 40).points, 10);
});

console.log("\nWindow around a club");

// A twenty-club table, teamId "1".."20", in position order.
const twenty = Array.from({ length: 20 }, (_, i) => ({ teamId: String(i + 1) }));
const ids = (rows) => rows.map((r) => r.teamId);

await it("a club at the top gets the top three", () => {
  assert.deepEqual(ids(windowAround(twenty, "1")), ["1", "2", "3"]);
});

await it("a club in mid-table sits in the middle", () => {
  // 7th gives 6-7-8.
  assert.deepEqual(ids(windowAround(twenty, "7")), ["6", "7", "8"]);
});

await it("a club at the bottom gets the bottom three", () => {
  assert.deepEqual(ids(windowAround(twenty, "20")), ["18", "19", "20"]);
});

await it("second place still gets a full window", () => {
  // The window pulls back inside the table rather than running off the top.
  assert.deepEqual(ids(windowAround(twenty, "2")), ["1", "2", "3"]);
});

await it("second from bottom still gets a full window", () => {
  assert.deepEqual(ids(windowAround(twenty, "19")), ["18", "19", "20"]);
});

await it("a table shorter than the window is returned whole", () => {
  const two = [{ teamId: "1" }, { teamId: "2" }];
  assert.deepEqual(ids(windowAround(two, "2")), ["1", "2"]);
});

await it("a club outside this table falls back to the top", () => {
  // What a group stage does for every group the club is not in.
  assert.deepEqual(ids(windowAround(twenty, "999")), ["1", "2", "3"]);
  assert.deepEqual(ids(windowAround(twenty, null)), ["1", "2", "3"]);
});

await it("the window size is adjustable and stays centred", () => {
  assert.deepEqual(ids(windowAround(twenty, "10", 5)), ["8", "9", "10", "11", "12"]);
  assert.deepEqual(ids(windowAround(twenty, "1", 5)), ["1", "2", "3", "4", "5"]);
});

console.log("\nDocument reading");

await it("the nested status wins over the flat one", async () => {
  // The flat copy is only refreshed nightly, so mid-match it still says NS.
  const parsed = toTableFixture({
    matchId: "7",
    status: "NS",
    timestamp: 100,
    fixture: { id: 7, timestamp: 100, status: { short: "2H" } },
    teams: { home: { id: 40 }, away: { id: 42 } },
    goals: { home: 1, away: 0 },
  });

  assert.equal(parsed.status, "2H");
  assert.equal(parsed.fixtureId, "7");
  assert.equal(parsed.homeTeamId, "40");
});

await it("a document with no teams is rejected rather than half-read", async () => {
  assert.equal(toTableFixture({ matchId: "8" }), null);
  assert.equal(toTableFixture(null), null);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
