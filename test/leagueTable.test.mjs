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

import { buildLiveTable, toTableFixture } from "../src/lib/league/liveTable.ts";

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
