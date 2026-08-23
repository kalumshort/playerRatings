/**
 * Prediction Points suite.
 *
 * Run with:  npm --prefix functions run test:predictions
 *
 * No emulator: the scorer is pure so the nightly job can recompute a season
 * from source and land on identical numbers every time.
 *
 * This is the only part of the app where being right earns anything, so the
 * cases that matter are the ones that decide whether a fan is paid or not:
 * shootouts, missing team sheets, and own goals.
 */
const assert = require("node:assert/strict");

const {
  computePredictionPoints,
} = require("../gamification/predictionPoints");
const { PREDICTION } = require("../gamification/xpConfig");

const CLUB = 42; // Arsenal

let passed = 0;
let failed = 0;

/**
 * Runs one named case, reporting rather than throwing so the whole suite runs.
 * @param {string} name - What the case protects.
 * @param {Function} fn - The case body.
 * @return {void}
 */
function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}\n      ${err.message.split("\n")[0]}`);
    failed++;
  }
}

/**
 * A finished fixture, Arsenal at home.
 * @param {object} over - Fields to override.
 * @return {object} A fixture document.
 */
const fixture = (over = {}) => ({
  status: "FT",
  goals: { home: 2, away: 1 },
  teams: { home: { id: CLUB }, away: { id: 49 } },
  ...over,
});

/**
 * A lineups array naming the given player ids for the club.
 * @param {Array<number|string>} ids - Player ids in the XI.
 * @return {Array<object>} A lineups array.
 */
const lineups = (ids) => [
  {
    team: { id: CLUB },
    startXI: ids.map((id) => ({ player: { id } })),
  },
];

const ELEVEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/**
 * A chosenTeam map from player ids.
 * @param {Array<number|string>} ids - Player ids picked.
 * @return {object} slotId -> playerId.
 */
const chosen = (ids) =>
  Object.fromEntries(ids.map((id, i) => [String(i + 1), String(id)]));

console.log("\nPrediction Points\n");

it("an unfinished match scores nothing and is not resolved", () => {
  const result = computePredictionPoints(
    { result: "home" },
    fixture({ status: "1H" }),
    CLUB,
  );
  assert.equal(result.points, 0);
  assert.equal(result.resolved, false);
});

it("a missing fixture scores nothing", () => {
  assert.equal(computePredictionPoints({ result: "home" }, null, CLUB).points, 0);
});

it("pays a correct result", () => {
  const r = computePredictionPoints({ result: "home" }, fixture(), CLUB);
  assert.equal(r.points, PREDICTION.correctResult);
  assert.equal(r.resolved, true);
});

it("pays nothing for a wrong result", () => {
  assert.equal(
    computePredictionPoints({ result: "away" }, fixture(), CLUB).points,
    0,
  );
});

it("result and exact score stack", () => {
  // Calling 2-1 is also calling a home win; paying both is the convention.
  const r = computePredictionPoints(
    { result: "home", ScorePrediction: "2-1" },
    fixture(),
    CLUB,
  );
  assert.equal(r.points, PREDICTION.correctResult + PREDICTION.exactScore);
});

it("a right result with the wrong score pays only the result", () => {
  const r = computePredictionPoints(
    { result: "home", ScorePrediction: "3-0" },
    fixture(),
    CLUB,
  );
  assert.equal(r.points, PREDICTION.correctResult);
});

it("a shootout counts as the draw it was after 120 minutes", () => {
  // goals excludes penalties, so 1-1 (won 4-2 on pens) is a draw. Any other
  // reading makes "predict the score" unanswerable.
  const pens = fixture({
    status: "PEN",
    goals: { home: 1, away: 1 },
    score: { penalty: { home: 4, away: 2 } },
  });

  assert.equal(
    computePredictionPoints({ result: "draw" }, pens, CLUB).points,
    PREDICTION.correctResult,
  );
  assert.equal(computePredictionPoints({ result: "home" }, pens, CLUB).points, 0);
});

it("pays per XI hit", () => {
  const r = computePredictionPoints(
    { chosenTeam: chosen([1, 2, 3, 99, 98]) },
    fixture({ lineups: lineups(ELEVEN) }),
    CLUB,
  );
  assert.equal(r.breakdown.xiHits, 3 * PREDICTION.xiHit);
  assert.equal(r.breakdown.perfectXi, undefined);
});

it("pays the perfect XI bonus on all eleven", () => {
  const r = computePredictionPoints(
    { chosenTeam: chosen(ELEVEN) },
    fixture({ lineups: lineups(ELEVEN) }),
    CLUB,
  );
  assert.equal(r.breakdown.xiHits, 11 * PREDICTION.xiHit);
  assert.equal(r.breakdown.perfectXi, PREDICTION.perfectXi);
});

it("scores the XI of the user's own club, not the opponent", () => {
  const both = [
    { team: { id: 49 }, startXI: ELEVEN.map((id) => ({ player: { id } })) },
    { team: { id: CLUB }, startXI: [{ player: { id: 500 } }] },
  ];
  const r = computePredictionPoints(
    { chosenTeam: chosen([1, 2, 3]) },
    fixture({ lineups: both }),
    CLUB,
  );
  // Those ids are the opponent's XI, so nothing should be credited.
  assert.equal(r.breakdown.xiHits, undefined);
});

it("a missing team sheet pays nothing for the XI but never penalises", () => {
  // Only a fraction of fixtures carry lineups — they come from the live-match
  // job, not the nightly sync. The result half must still pay.
  const r = computePredictionPoints(
    { result: "home", chosenTeam: chosen(ELEVEN) },
    fixture({ lineups: [] }),
    CLUB,
  );
  assert.equal(r.points, PREDICTION.correctResult);
  assert.equal(r.resolved, true);
});

it("pays when the player to watch scores", () => {
  const r = computePredictionPoints(
    { preMatchMotm: "978" },
    fixture({
      events: [
        { type: "Goal", detail: "Normal Goal", player: { id: 978 }, assist: {} },
      ],
    }),
    CLUB,
  );
  assert.equal(r.points, PREDICTION.playerToWatchInvolved);
});

it("pays when the player to watch assists", () => {
  const r = computePredictionPoints(
    { preMatchMotm: "157052" },
    fixture({
      events: [
        {
          type: "Goal",
          detail: "Normal Goal",
          player: { id: 978 },
          assist: { id: 157052 },
        },
      ],
    }),
    CLUB,
  );
  assert.equal(r.points, PREDICTION.playerToWatchInvolved);
});

it("an own goal does not count as involvement", () => {
  const r = computePredictionPoints(
    { preMatchMotm: "978" },
    fixture({
      events: [
        { type: "Goal", detail: "Own Goal", player: { id: 978 }, assist: {} },
      ],
    }),
    CLUB,
  );
  assert.equal(r.points, 0);
});

it("a card is not a goal", () => {
  const r = computePredictionPoints(
    { preMatchMotm: "978" },
    fixture({
      events: [{ type: "Card", detail: "Yellow Card", player: { id: 978 } }],
    }),
    CLUB,
  );
  assert.equal(r.points, 0);
});

it("a perfect matchday sums every component", () => {
  const r = computePredictionPoints(
    {
      result: "home",
      ScorePrediction: "2-1",
      chosenTeam: chosen(ELEVEN),
      preMatchMotm: "978",
    },
    fixture({
      lineups: lineups(ELEVEN),
      events: [
        { type: "Goal", detail: "Normal Goal", player: { id: 978 }, assist: {} },
      ],
    }),
    CLUB,
  );

  assert.equal(
    r.points,
    PREDICTION.correctResult +
      PREDICTION.exactScore +
      11 * PREDICTION.xiHit +
      PREDICTION.perfectXi +
      PREDICTION.playerToWatchInvolved,
  );
});

it("is deterministic", () => {
  const doc = { result: "home", ScorePrediction: "2-1" };
  assert.equal(
    computePredictionPoints(doc, fixture(), CLUB).points,
    computePredictionPoints(doc, fixture(), CLUB).points,
  );
});

it("hostile input cannot produce negative or NaN points", () => {
  for (const value of [null, undefined, {}, [], "x", -1, NaN]) {
    const r = computePredictionPoints(
      { result: value, ScorePrediction: value, chosenTeam: value, preMatchMotm: value },
      fixture(),
      CLUB,
    );
    assert.ok(Number.isFinite(r.points), `not finite for ${String(value)}`);
    assert.ok(r.points >= 0, `negative for ${String(value)}`);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
