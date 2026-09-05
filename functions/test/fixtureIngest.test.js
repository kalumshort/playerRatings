/**
 * Fixture mapping and cup ingestion guards.
 *
 * Run with:  npm --prefix functions run test:ingest
 *
 * No emulator: these cover the two rules that keep league-wide cup ingestion
 * from breaking things that already work — the poll tier that stops a European
 * matchday consuming the API budget, and the hot-zone rule that stops an
 * hourly job overwriting a live score with a stale one.
 */
const assert = require("node:assert/strict");

const { livePollTierFor, toFixtureDoc } = require("../fixtureDoc");
const {
  HOT_ZONE_LOOKBACK_SECONDS,
  HOT_ZONE_LOOKAHEAD_SECONDS,
  inHotZone,
} = require("../competitionFixtures");

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
 * An API fixture in the shape the endpoints return.
 * @param {object} args - Fixture parts.
 * @return {object} API fixture.
 */
const api = ({ id, home, away, status = "NS", ts = 1000, round = "Final" }) => ({
  fixture: { id, date: "2026-09-05T14:00:00+00:00", timestamp: ts, status: { short: status } },
  league: { id: 45, name: "FA Cup", round },
  teams: { home: { id: home, name: `T${home}` }, away: { id: away, name: `T${away}` } },
  goals: { home: null, away: null },
  score: { penalty: { home: null, away: null } },
});

(async () => {
  console.log("\nFixture mapping");

  await it("the flattened fields are written alongside the raw objects", () => {
    // getFixturesByClubServer and the client thunk both query homeTeamId, and
    // the standings refresh queries timestamp — a nested-only document would
    // be invisible to all of them.
    const doc = toFixtureDoc(api({ id: 1, home: 40, away: 42, ts: 1234 }));

    assert.equal(doc.matchId, "1");
    assert.equal(doc.homeTeamId, 40);
    assert.equal(doc.awayTeamId, 42);
    assert.equal(doc.timestamp, 1234);
    assert.equal(doc.leagueId, 45);
    assert.equal(doc.status, "NS");
    // And the nested objects the live poller refreshes.
    assert.equal(doc.fixture.status.short, "NS");
    assert.ok(doc.teams.home);
  });

  await it("a fixture with no id is rejected rather than half-mapped", () => {
    assert.equal(toFixtureDoc({ teams: {}, league: {} }), null);
    assert.equal(toFixtureDoc(null), null);
  });

  console.log("\nPoll tier");

  await it("a match involving a tracked club is club tier", () => {
    const tracked = new Set([40, 42]);
    assert.equal(livePollTierFor(api({ id: 1, home: 40, away: 999 }), tracked), "club");
    assert.equal(livePollTierFor(api({ id: 2, home: 999, away: 42 }), tracked), "club");
  });

  await it("a match between two untracked clubs is wide tier", () => {
    // The Conference League tie nobody on the site is rating.
    const tracked = new Set([40, 42]);
    assert.equal(livePollTierFor(api({ id: 3, home: 998, away: 999 }), tracked), "wide");
  });

  await it("an unavailable club directory falls back to club tier", () => {
    // Being wrong towards the existing behaviour is the safe direction: it
    // costs calls, where the other way silently stops polling real matches.
    assert.equal(livePollTierFor(api({ id: 4, home: 998, away: 999 }), new Set()), "club");
    assert.equal(livePollTierFor(api({ id: 5, home: 998, away: 999 }), null), "club");
  });

  await it("the tier is carried onto the document", () => {
    const doc = toFixtureDoc(api({ id: 6, home: 998, away: 999 }), {
      trackedTeamIds: new Set([40]),
    });
    assert.equal(doc.livePollTier, "wide");
  });

  console.log("\nHot zone");

  // No numeric separator: eslint here is pinned to ecmaVersion 2020, and
  // 1_000_000 is a parse error rather than a style complaint.
  const now = 1000000;

  await it("a fixture the poller owns is left alone", () => {
    // Inside the window the poller writes every minute from a live endpoint;
    // this job's hourly snapshot would roll a 2-1 back to 1-1.
    assert.equal(inHotZone({ timestamp: now }, now), true);
    assert.equal(inHotZone({ timestamp: now - 60 }, now), true);
    assert.equal(inHotZone({ timestamp: now + 60 }, now), true);
  });

  await it("a fixture outside the window belongs to the ingest", () => {
    assert.equal(inHotZone({ timestamp: now - HOT_ZONE_LOOKBACK_SECONDS - 1 }, now), false);
    assert.equal(inHotZone({ timestamp: now + HOT_ZONE_LOOKAHEAD_SECONDS + 1 }, now), false);
  });

  await it("the window edges are inclusive, so nothing falls between the two jobs", () => {
    assert.equal(inHotZone({ timestamp: now - HOT_ZONE_LOOKBACK_SECONDS }, now), true);
    assert.equal(inHotZone({ timestamp: now + HOT_ZONE_LOOKAHEAD_SECONDS }, now), true);
  });

  await it("the window matches the live poller's own lookback and lookahead", () => {
    // If these drift apart, fixtures fall into a gap neither job writes.
    assert.equal(HOT_ZONE_LOOKBACK_SECONDS, 4 * 60 * 60);
    assert.equal(HOT_ZONE_LOOKAHEAD_SECONDS, 60 * 60);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
