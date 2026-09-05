/**
 * Cup bracket suite.
 *
 * Run with:  npm --prefix functions run test:bracket
 *
 * No emulator and no API — everything under test is pure derivation from
 * fixture objects. The round strings used here are real, taken from
 * `fixtures/rounds` via functions/scripts/inspectRounds.js against the 2025
 * season, because the classifier's whole job is coping with the API's actual
 * naming rather than a tidy version of it.
 */
const assert = require("node:assert/strict");

const {
  aggregateOf,
  buildBracket,
  classifyRound,
  decideTie,
} = require("../bracket");

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
 * Builds a fixture document in the shape the store holds.
 * @param {object} args - Fixture parts.
 * @return {object} Fixture document.
 */
const fx = ({
  id,
  round,
  home,
  away,
  hg = null,
  ag = null,
  status = "NS",
  ts = 0,
  winner = null,
  penalty = null,
}) => ({
  matchId: String(id),
  leagueId: 45,
  timestamp: ts,
  fixture: { id, timestamp: ts, status: { short: status } },
  league: { id: 45, name: "FA Cup", round },
  teams: {
    home: { id: home, name: `Team ${home}`, logo: "", winner: winner === home ? true : winner ? false : null },
    away: { id: away, name: `Team ${away}`, logo: "", winner: winner === away ? true : winner ? false : null },
  },
  goals: { home: hg, away: ag },
  score: { penalty: penalty || { home: null, away: null } },
});

const COMP = { id: 45, expected: "FA Cup" };

(async () => {
  console.log("\nRound classification");

  await it("'Semi-finals' is the semi-final, not the final", () => {
    assert.equal(classifyRound("Semi-finals").key, "semi-finals");
  });

  await it("'Quarter-finals' is the quarter-final, not the final", () => {
    assert.equal(classifyRound("Quarter-finals").key, "quarter-finals");
  });

  await it("'Final' is the final", () => {
    assert.equal(classifyRound("Final").key, "final");
  });

  await it("the FA Cup's '1/128-finals' is not the final", () => {
    // A real string, and it contains "finals".
    assert.equal(classifyRound("1/128-finals").key, "round-of-128");
  });

  await it("the League Cup's ordinal rounds are numbered rounds", () => {
    // "1st Round", not "Round 1" — the format guessing gets wrong.
    assert.equal(classifyRound("3rd Round").key, "round-3");
    assert.equal(classifyRound("4th Round").key, "round-4");
    assert.ok(
      classifyRound("4th Round").order > classifyRound("3rd Round").order,
      "later rounds must sort later",
    );
  });

  await it("both qualifying word orders classify the same", () => {
    // "1st Round Qualifying" (FA Cup) vs "1st Qualifying Round" (UEFA).
    assert.equal(classifyRound("1st Round Qualifying").key, "qualifying-1");
    assert.equal(classifyRound("1st Qualifying Round").key, "qualifying-1");
  });

  await it("a numbered round does not shadow a qualifying round", () => {
    assert.equal(classifyRound("3rd Round Qualifying").key, "qualifying-3");
    assert.equal(classifyRound("3rd Round").key, "round-3");
  });

  await it("both play-off spellings classify the same", () => {
    // "Play-offs" (UCL) vs "Playoff round" (Conference).
    assert.equal(classifyRound("Play-offs").key, "play-off");
    assert.equal(classifyRound("Playoff round").key, "play-off");
  });

  await it("the league phase is marked as owned by the table", () => {
    const round = classifyRound("League Stage - 4");
    assert.equal(round.key, "league-stage");
    assert.equal(round.tableOwned, true);
  });

  await it("a replay classifies into its parent round", () => {
    const round = classifyRound("1st Round Qualifying Replays");
    assert.equal(round.key, "qualifying-1");
    assert.equal(round.replay, true);
  });

  await it("an unrecognised round returns null rather than guessing", () => {
    assert.equal(classifyRound("Group Wildcard Shootout"), null);
    assert.equal(classifyRound(""), null);
  });

  console.log("\nAggregate");

  await it("a reversed second leg is credited to the right side", () => {
    // The trap: summing goals.home across legs adds leg two to the wrong team.
    // Leg 1  home 33 beats away 40, 2-1.
    // Leg 2  home 40 beats away 33, 3-0.  Aggregate: 33 has 2, 40 has 4.
    const legs = [
      { status: "FT", homeTeamId: "33", awayTeamId: "40", goals: { home: 2, away: 1 } },
      { status: "FT", homeTeamId: "40", awayTeamId: "33", goals: { home: 3, away: 0 } },
    ];
    const agg = aggregateOf(legs, "33", "40");
    assert.deepEqual(agg, { home: 2, away: 4 });
  });

  await it("an undecided leg is left out of the aggregate", () => {
    const legs = [
      { status: "FT", homeTeamId: "33", awayTeamId: "40", goals: { home: 2, away: 1 } },
      { status: "NS", homeTeamId: "40", awayTeamId: "33", goals: { home: null, away: null } },
    ];
    assert.deepEqual(aggregateOf(legs, "33", "40"), { home: 2, away: 1 });
  });

  console.log("\nTie resolution");

  await it("a single leg takes the API's own winner", () => {
    const legs = [
      { status: "FT", homeTeamId: "33", awayTeamId: "40", goals: { home: 1, away: 0 }, winnerTeamId: "33", penalty: null },
    ];
    const verdict = decideTie(legs, { homeId: "33", awayId: "40" }, false);
    assert.equal(verdict.winnerTeamId, "33");
    assert.equal(verdict.state, "complete");
  });

  await it("penalties are named as the decider", () => {
    const legs = [
      {
        status: "PEN", homeTeamId: "33", awayTeamId: "40",
        goals: { home: 1, away: 1 }, winnerTeamId: "40",
        penalty: { home: 2, away: 4 },
      },
    ];
    const verdict = decideTie(legs, { homeId: "33", awayId: "40" }, false);
    assert.equal(verdict.decidedBy, "penalties");
    assert.equal(verdict.winnerTeamId, "40");
  });

  await it("a level aggregate falls through to the second leg's winner", () => {
    const legs = [
      { status: "FT", homeTeamId: "33", awayTeamId: "40", goals: { home: 1, away: 0 }, winnerTeamId: "33", penalty: null },
      { status: "PEN", homeTeamId: "40", awayTeamId: "33", goals: { home: 1, away: 0 }, winnerTeamId: "40", penalty: { home: 5, away: 3 } },
    ];
    const verdict = decideTie(legs, { homeId: "33", awayId: "40" }, false);
    assert.deepEqual(verdict.aggregate, { home: 1, away: 1 });
    assert.equal(verdict.winnerTeamId, "40");
    assert.equal(verdict.decidedBy, "penalties");
  });

  await it("a replay is decided by the replay, not by an aggregate", () => {
    const legs = [
      { status: "FT", homeTeamId: "33", awayTeamId: "40", goals: { home: 1, away: 1 }, winnerTeamId: null, penalty: null },
      { status: "FT", homeTeamId: "40", awayTeamId: "33", goals: { home: 0, away: 2 }, winnerTeamId: "33", penalty: null },
    ];
    const verdict = decideTie(legs, { homeId: "33", awayId: "40" }, true);
    assert.equal(verdict.decidedBy, "replay");
    assert.equal(verdict.aggregate, null);
    assert.equal(verdict.winnerTeamId, "33");
  });

  await it("an unplayed tie has no winner and is not complete", () => {
    const legs = [
      { status: "NS", homeTeamId: "33", awayTeamId: "40", goals: { home: null, away: null }, winnerTeamId: null, penalty: null },
    ];
    const verdict = decideTie(legs, { homeId: "33", awayId: "40" }, false);
    assert.equal(verdict.winnerTeamId, null);
    assert.equal(verdict.state, "scheduled");
  });

  console.log("\nBracket assembly");

  await it("two legs of one tie become a single tie", () => {
    const bracket = buildBracket({
      competition: COMP,
      fixtures: [
        fx({ id: 1, round: "Semi-finals", home: 33, away: 40, hg: 2, ag: 1, status: "FT", ts: 100, winner: 33 }),
        fx({ id: 2, round: "Semi-finals", home: 40, away: 33, hg: 3, ag: 0, status: "FT", ts: 200, winner: 40 }),
      ],
    });

    const semi = bracket.rounds.find((r) => r.key === "semi-finals");
    assert.equal(semi.ties.length, 1);
    assert.equal(semi.ties[0].legs.length, 2);
    assert.deepEqual(semi.ties[0].aggregate, { home: 2, away: 4 });
    assert.equal(semi.ties[0].winnerTeamId, "40");
  });

  await it("legs are ordered by time regardless of input order", () => {
    const bracket = buildBracket({
      competition: COMP,
      fixtures: [
        fx({ id: 2, round: "Semi-finals", home: 40, away: 33, ts: 200 }),
        fx({ id: 1, round: "Semi-finals", home: 33, away: 40, ts: 100 }),
      ],
    });

    const tie = bracket.rounds.find((r) => r.key === "semi-finals").ties[0];
    assert.deepEqual(tie.legs.map((l) => l.fixtureId), ["1", "2"]);
    // The first leg sets the display frame.
    assert.equal(tie.home.teamId, "33");
  });

  await it("rounds come back in ladder order", () => {
    const bracket = buildBracket({
      competition: COMP,
      fixtures: [
        fx({ id: 3, round: "Final", home: 33, away: 50, ts: 300 }),
        fx({ id: 1, round: "Round of 16", home: 33, away: 40, ts: 100 }),
        fx({ id: 2, round: "Quarter-finals", home: 33, away: 45, ts: 200 }),
      ],
    });

    assert.deepEqual(
      bracket.rounds.map((r) => r.key),
      ["round-of-16", "quarter-finals", "final"],
    );
  });

  await it("the league phase is left to the standings document", () => {
    const bracket = buildBracket({
      competition: COMP,
      fixtures: [
        fx({ id: 1, round: "League Stage - 3", home: 33, away: 40, ts: 100 }),
        fx({ id: 2, round: "Round of 16", home: 33, away: 45, ts: 200 }),
      ],
    });

    assert.equal(bracket.rounds.length, 1);
    assert.equal(bracket.rounds[0].key, "round-of-16");
    assert.equal(bracket.unmatched.length, 0);
  });

  await it("an unclassifiable round is reported, not dropped", () => {
    const bracket = buildBracket({
      competition: COMP,
      fixtures: [fx({ id: 9, round: "Mystery Cup Shootout", home: 33, away: 40 })],
    });

    assert.equal(bracket.unmatched.length, 1);
    assert.equal(bracket.unmatched[0].fixtureId, "9");
    assert.equal(bracket.rounds.length, 0);
  });

  await it("three fixtures for one pair are kept and flagged", () => {
    const bracket = buildBracket({
      competition: COMP,
      fixtures: [
        fx({ id: 1, round: "Round of 16", home: 33, away: 40, ts: 100 }),
        fx({ id: 2, round: "Round of 16", home: 40, away: 33, ts: 200 }),
        fx({ id: 3, round: "Round of 16", home: 33, away: 40, ts: 300 }),
      ],
    });

    const tie = bracket.rounds[0].ties[0];
    assert.equal(tie.legs.length, 3);
    assert.equal(tie.anomaly, "extra-legs");
  });

  await it("an undrawn round is scaffolded rather than missing", () => {
    const bracket = buildBracket({
      competition: COMP,
      expectedRounds: ["quarter-finals", "semi-finals", "final"],
      fixtures: [fx({ id: 1, round: "Quarter-finals", home: 33, away: 40, ts: 100 })],
    });

    const semi = bracket.rounds.find((r) => r.key === "semi-finals");
    assert.ok(semi, "the semi-final should be scaffolded");
    assert.equal(semi.drawn, false);
    assert.equal(semi.ties.length, 0);
    assert.equal(bracket.rounds.find((r) => r.key === "quarter-finals").drawn, true);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
