/**
 * Fan XP engine suite.
 *
 * Run with:  npm --prefix functions run test:xp
 *
 * No emulator: computeMatchXp is deliberately pure so it can be tested as a
 * plain function. That purity is load-bearing beyond testing — the Firestore
 * trigger awards `compute(after) - compute(before)`, so any hidden state or
 * non-determinism here would corrupt every user's running total.
 *
 * The cases that matter most are the ones protecting against double-payment.
 * Most of these actions are mutable or repeatable in the client, and one of
 * them (the Fans XI) double-counts its own group aggregate on resubmit, so
 * "changing your mind pays nothing extra" is the property under test.
 */
const assert = require("node:assert/strict");

const { computeMatchXp } = require("../gamification/computeMatchXp");
const { XP, XP_CAPS, MAX_MATCH_XP } = require("../gamification/xpConfig");

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
 * A per-user match doc with every feature area touched.
 * @return {object} A maxed-out participation record.
 */
const fullDoc = () => ({
  result: "home",
  ScorePrediction: "2-1",
  preMatchMotm: "9",
  teamSubmitted: true,
  chosenTeam: { 1: "1", 2: "2" },
  players: Object.fromEntries(
    Array.from({ length: XP_CAPS.ratedPlayers }, (_, i) => [String(i), 7]),
  ),
  ratingsSubmitted: true,
  motmVote: "9",
  moodTaps: XP_CAPS.moodTaps,
  liveVotes: XP_CAPS.liveVotes,
  reactions: XP_CAPS.eventReactions,
});

console.log("\nFan XP engine\n");

it("an absent doc earns nothing", () => {
  assert.equal(computeMatchXp(null).xp, 0);
  assert.equal(computeMatchXp(undefined).xp, 0);
  assert.equal(computeMatchXp({}).xp, 0);
});

it("a garbage doc earns nothing rather than throwing", () => {
  assert.equal(computeMatchXp("nonsense").xp, 0);
  assert.equal(computeMatchXp(42).xp, 0);
});

it("each prediction pays once", () => {
  assert.equal(computeMatchXp({ result: "home" }).xp, XP.predictWinner);
  assert.equal(computeMatchXp({ ScorePrediction: "2-1" }).xp, XP.predictScore);
  assert.equal(
    computeMatchXp({ preMatchMotm: "9" }).xp,
    XP.predictPlayerToWatch,
  );
});

it("changing a prediction pays nothing extra", () => {
  // Predictions are mutable before kickoff; handlePredictWinningTeam moves the
  // vote rather than adding one, and XP must behave the same way.
  const before = computeMatchXp({ result: "home" }).xp;
  const after = computeMatchXp({ result: "away" }).xp;
  assert.equal(after - before, 0);
});

it("resubmitting the Fans XI pays nothing extra", () => {
  // handlePredictTeamSubmit is NOT deduped and double-counts totalTeamSubmits
  // on the group aggregate. Keying off the boolean is what stops XP inheriting
  // that bug.
  const first = computeMatchXp({ teamSubmitted: true, chosenTeam: { 1: "1" } });
  const second = computeMatchXp({
    teamSubmitted: true,
    chosenTeam: { 1: "99", 2: "2" },
  });
  assert.equal(first.xp, XP.submitLineup);
  assert.equal(second.xp - first.xp, 0);
});

it("ratings pay per player and cap", () => {
  const two = computeMatchXp({ players: { 1: 7, 2: 8 } });
  assert.equal(two.xp, 2 * XP.ratePlayer);

  const overCap = computeMatchXp({
    players: Object.fromEntries(
      Array.from({ length: XP_CAPS.ratedPlayers + 40 }, (_, i) => [i, 7]),
    ),
  });
  assert.equal(overCap.breakdown.ratePlayer, XP_CAPS.ratedPlayers * XP.ratePlayer);
});

it("live counters cap", () => {
  const doc = {
    moodTaps: 9999,
    liveVotes: 9999,
    reactions: 9999,
  };
  const { breakdown } = computeMatchXp(doc);
  assert.equal(breakdown.moodTap, XP_CAPS.moodTaps * XP.moodTap);
  assert.equal(breakdown.liveVote, XP_CAPS.liveVotes * XP.liveVote);
  assert.equal(
    breakdown.eventReaction,
    XP_CAPS.eventReactions * XP.eventReaction,
  );
});

it("hostile counter values cannot produce negative or NaN XP", () => {
  // users/** is fully self-writable, so these are reachable from a console.
  for (const value of [-50, "lots", NaN, Infinity, null, {}, []]) {
    const { xp } = computeMatchXp({ moodTaps: value, liveVotes: value });
    assert.ok(Number.isFinite(xp), `xp not finite for ${String(value)}`);
    assert.ok(xp >= 0, `xp negative for ${String(value)}`);
  }

  // Infinity is rejected outright rather than clamped to the cap. Firestore
  // cannot store it anyway, so treating it as garbage is safer than treating
  // it as "the maximum".
  assert.equal(computeMatchXp({ moodTaps: Infinity }).xp, 0);
});

it("pendingMotm does not pay — only the promoted vote does", () => {
  assert.equal(computeMatchXp({ pendingMotm: "9" }).xp, 0);
  assert.equal(computeMatchXp({ motmVote: "9" }).xp, XP.motmVote);
});

it("the Full 90 bonus needs all five areas", () => {
  const four = fullDoc();
  delete four.reactions;
  assert.equal(computeMatchXp(four).breakdown.fullNinety, undefined);

  assert.equal(computeMatchXp(fullDoc()).breakdown.fullNinety, XP.fullNinety);
});

it("a maxed-out match equals MAX_MATCH_XP", () => {
  assert.equal(computeMatchXp(fullDoc()).xp, MAX_MATCH_XP);
});

it("XP never exceeds MAX_MATCH_XP even when every field is inflated", () => {
  const inflated = {
    ...fullDoc(),
    players: Object.fromEntries(Array.from({ length: 500 }, (_, i) => [i, 10])),
    moodTaps: 1e6,
    liveVotes: 1e6,
    reactions: 1e6,
  };
  assert.equal(computeMatchXp(inflated).xp, MAX_MATCH_XP);
});

it("is deterministic — the trigger's delta depends on it", () => {
  const doc = fullDoc();
  assert.equal(computeMatchXp(doc).xp, computeMatchXp(doc).xp);
});

it("progressive participation only ever adds XP", () => {
  // Walks the real order a matchday happens in; each step must be >= the last,
  // because the trigger applies (after - before) and a dip would subtract XP
  // the user legitimately earned.
  const steps = [
    { result: "home" },
    { result: "home", ScorePrediction: "2-1" },
    { result: "home", ScorePrediction: "2-1", preMatchMotm: "9" },
    { result: "home", ScorePrediction: "2-1", preMatchMotm: "9", teamSubmitted: true },
    { result: "home", ScorePrediction: "2-1", preMatchMotm: "9", teamSubmitted: true, moodTaps: 3 },
    { result: "home", ScorePrediction: "2-1", preMatchMotm: "9", teamSubmitted: true, moodTaps: 3, players: { 1: 7 } },
    { result: "home", ScorePrediction: "2-1", preMatchMotm: "9", teamSubmitted: true, moodTaps: 3, players: { 1: 7 }, ratingsSubmitted: true, motmVote: "9" },
  ];

  let previous = 0;
  for (const step of steps) {
    const { xp } = computeMatchXp(step);
    assert.ok(xp >= previous, `XP went backwards: ${previous} -> ${xp}`);
    previous = xp;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
