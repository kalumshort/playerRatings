/**
 * Turns a flat list of cup fixtures into a knockout bracket.
 *
 * Pure derivation — no API calls. Everything here is computed from fixtures
 * that competitionFixtures.js has already stored, so rebuilding a bracket
 * costs nothing but Firestore writes.
 *
 * The round name is the only thing in a fixture that says which stage it
 * belongs to, and API-Football's round names are not consistent between
 * competitions. Every pattern below was taken from a real
 * `fixtures/rounds` response via functions/scripts/inspectRounds.js — run it
 * again before changing them, rather than reasoning from the docs.
 */
const { FieldValue } = require("firebase-admin/firestore");
const { leagueDocRef, resolveLeagueTargets } = require("./leagueCatalogue");

/** Statuses where a result is final. */
const DECIDED = ["FT", "AET", "PEN"];

/** Statuses where the match is under way. */
const IN_PLAY = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "SUSP", "INT"];

/**
 * The knockout ladder, most specific pattern first.
 *
 * `order` positions a round in the bracket; classification walks this array in
 * order and takes the first pattern that matches, so entries are arranged by
 * specificity, not by `order`.
 *
 * Real strings this was built from (2025, the last complete season):
 *
 *   FA Cup      Extra Preliminary Round · Preliminary Round ·
 *               1st Round Qualifying · 1st Round Qualifying Replays ·
 *               1/128-finals · Round of 128 · Round of 64 · Round of 32 ·
 *               Round of 16 · Quarter-finals · Semi-finals · Final
 *   League Cup  Preliminary Round · 1st Round · 2nd Round · 3rd Round ·
 *               4th Round · Quarter-finals · Semi-finals · Final
 *   UCL/UEL     1st Qualifying Round · Play-offs · League Stage - 1..8 ·
 *               Round of 32 · Round of 16 · Quarter-finals · Semi-finals · Final
 *   Conference  … · Playoff round · League Stage - 1..6 · …
 *
 * Three traps live in that list:
 *
 *   1. "Quarter-finals" and "Semi-finals" both contain "final", so the final's
 *      pattern is anchored and sits last.
 *   2. The FA Cup emits a literal "1/128-finals", which also contains "finals".
 *   3. The word order of a qualifying round differs by competition:
 *      "1st Round Qualifying" (FA) against "1st Qualifying Round" (UEFA).
 */
const ROUND_LADDER = [
  {
    key: "extra-preliminary",
    label: "Extra Preliminary Round",
    order: 5,
    patterns: [/^extra[\s-]preliminary/],
  },
  {
    key: "preliminary",
    label: "Preliminary Round",
    order: 8,
    patterns: [/^preliminary/],
  },
  // Both word orders, ordinal captured so the rounds sort among themselves.
  {
    key: "qualifying",
    label: "Qualifying",
    order: 10,
    ordinal: true,
    patterns: [
      /^(\d+)(?:st|nd|rd|th)\s+round\s+qualifying/,
      /^(\d+)(?:st|nd|rd|th)\s+qualifying\s+round/,
    ],
    fallback: /qualifying/,
  },
  {
    key: "league-stage",
    label: "League Stage",
    order: 40,
    // Owned by the standings doc, not the bracket — a fixture's round never
    // says WHICH group, but the standings endpoint returns them grouped.
    tableOwned: true,
    patterns: [/^league\s+(stage|phase)/, /^group\s+stage/, /^group\s+[a-l]$/],
  },
  {
    key: "play-off",
    label: "Play-offs",
    order: 50,
    // "Play-offs" (UCL, Europa) and "Playoff round" (Conference).
    patterns: [/^play-?off/],
  },
  {
    key: "round-of-128",
    label: "Round of 128",
    order: 54,
    patterns: [/round of 128/, /^1\/128-finals?$/],
  },
  {
    key: "round-of-64",
    label: "Round of 64",
    order: 56,
    patterns: [/round of 64/, /^1\/64-finals?$/],
  },
  {
    key: "round-of-32",
    label: "Round of 32",
    order: 58,
    patterns: [/round of 32/, /^1\/32-finals?$/],
  },
  {
    key: "round-of-16",
    label: "Round of 16",
    order: 60,
    patterns: [/round of 16/, /^1\/16-finals?$/, /^last 16$/],
  },
  {
    key: "quarter-finals",
    label: "Quarter-finals",
    order: 70,
    patterns: [/quarter/, /^1\/8-finals?$/],
  },
  {
    key: "semi-finals",
    label: "Semi-finals",
    order: 80,
    patterns: [/semi/, /^1\/4-finals?$/],
  },
  {
    key: "third-place",
    label: "Third-place Play-off",
    order: 85,
    patterns: [/(3rd|third)[\s-]place/],
  },
  // Last, and anchored. A bare /final/ swallows every round above it.
  {
    key: "final",
    label: "Final",
    order: 90,
    patterns: [/^final$/, /^finals$/],
  },
  // Numbered rounds sit below the named ones so "3rd Round" can't shadow
  // "3rd Round Qualifying", which is a different and earlier stage.
  {
    key: "round",
    label: "Round",
    order: 30,
    ordinal: true,
    patterns: [/^(\d+)(?:st|nd|rd|th)\s+round$/, /^round\s+(\d+)$/],
  },
];

/**
 * Normalises a raw round string for matching: trimmed, collapsed whitespace,
 * lower-cased.
 * @param {string} raw - The API's `league.round`.
 * @return {string} Normalised form.
 */
const normaliseRound = (raw) =>
  String(raw || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/**
 * Classifies a raw round string into a ladder entry.
 *
 * A replay carries the same round as its original tie with a "Replays" suffix
 * ("1st Round Qualifying Replays"), so the suffix is stripped before matching
 * and reported separately — a replay belongs in its parent round, not a round
 * of its own.
 *
 * @param {string} raw - The API's `league.round`.
 * @return {object|null} { key, label, order, replay } or null when unmatched.
 */
const classifyRound = (raw) => {
  const cleaned = normaliseRound(raw);
  if (!cleaned) return null;

  const replay = /\breplays?$/.test(cleaned);
  const text = replay ? cleaned.replace(/\s*\breplays?$/, "").trim() : cleaned;

  for (const entry of ROUND_LADDER) {
    for (const pattern of entry.patterns) {
      const match = text.match(pattern);
      if (!match) continue;

      // An ordinal round is really N rounds; spread them from the base order
      // so "2nd Round" sorts after "1st Round".
      const nth = entry.ordinal && match[1] ? Number(match[1]) : null;

      return {
        key: nth ? `${entry.key}-${nth}` : entry.key,
        label: nth ? `${ordinalLabel(nth)} ${entry.label}`.trim() : entry.label,
        order: nth ? entry.order + nth : entry.order,
        tableOwned: entry.tableOwned === true,
        replay,
      };
    }

    if (entry.fallback && entry.fallback.test(text)) {
      return {
        key: entry.key,
        label: entry.label,
        order: entry.order,
        tableOwned: entry.tableOwned === true,
        replay,
      };
    }
  }

  return null;
};

/**
 * "1st", "2nd", "3rd", "4th" … for a round label.
 * @param {number} n - The round number.
 * @return {string} Ordinal form.
 */
const ordinalLabel = (n) => {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
  return `${n}${suffix}`;
};

/**
 * Reduces a fixture document to the leg shape the bracket stores.
 * @param {object} fixture - A stored fixture document.
 * @return {object} Leg.
 */
const toLeg = (fixture) => ({
  fixtureId: String(fixture.fixture?.id ?? fixture.matchId ?? ""),
  timestamp: fixture.fixture?.timestamp ?? fixture.timestamp ?? 0,
  status: fixture.fixture?.status?.short ?? fixture.status ?? "NS",
  homeTeamId: String(fixture.teams?.home?.id ?? ""),
  awayTeamId: String(fixture.teams?.away?.id ?? ""),
  goals: {
    home: fixture.goals?.home ?? null,
    away: fixture.goals?.away ?? null,
  },
  penalty: fixture.score?.penalty?.home != null ? fixture.score.penalty : null,
  // The API already accounts for extra time and penalties here, so the winner
  // is read rather than recomputed from goals.
  winnerTeamId:
    fixture.teams?.home?.winner === true ?
      String(fixture.teams.home.id) :
      fixture.teams?.away?.winner === true ?
        String(fixture.teams.away.id) :
        null,
});

/**
 * Sums a tie's legs into the display frame.
 *
 * Projected by team id, never by home/away slot: the second leg reverses the
 * slots, so adding `goals.home` across legs credits leg two to the wrong side.
 *
 * @param {Array<object>} legs - Legs, in order.
 * @param {string} homeId - Team id holding the display frame's home slot.
 * @param {string} awayId - Team id holding the display frame's away slot.
 * @return {object|null} { home, away }, or null when nothing is decided.
 */
const aggregateOf = (legs, homeId, awayId) => {
  const counted = legs.filter(
    (leg) =>
      DECIDED.includes(leg.status) &&
      leg.goals.home != null &&
      leg.goals.away != null,
  );
  if (counted.length === 0) return null;

  return counted.reduce(
    (total, leg) => ({
      home: total.home + (leg.homeTeamId === homeId ? leg.goals.home : leg.goals.away),
      away: total.away + (leg.awayTeamId === awayId ? leg.goals.away : leg.goals.home),
    }),
    { home: 0, away: 0 },
  );
};

/**
 * Decides a tie from its legs.
 * @param {Array<object>} legs - Legs, in timestamp order.
 * @param {object} frame - { homeId, awayId } display frame.
 * @param {boolean} isReplay - Whether any leg is a replay.
 * @return {object} { winnerTeamId, decidedBy, aggregate, state }.
 */
const decideTie = (legs, frame, isReplay) => {
  const decided = legs.filter((leg) => DECIDED.includes(leg.status));
  const live = legs.some((leg) => IN_PLAY.includes(leg.status));

  if (decided.length === 0) {
    return {
      winnerTeamId: null,
      decidedBy: null,
      aggregate: null,
      state: live ? "live" : "scheduled",
    };
  }

  const last = decided[decided.length - 1];
  const aggregate = aggregateOf(legs, frame.homeId, frame.awayId);

  // A replay replaces the original rather than adding to it, so an aggregate
  // would be meaningless — the last match played is the whole answer.
  if (isReplay) {
    return {
      winnerTeamId: last.winnerTeamId,
      decidedBy: "replay",
      aggregate: null,
      state: decided.length === legs.length ? "complete" : "live",
    };
  }

  if (legs.length === 1) {
    return {
      winnerTeamId: last.winnerTeamId,
      decidedBy: last.penalty ?
        "penalties" :
        last.status === "AET" ?
          "extra-time" :
          "normal",
      aggregate,
      state: decided.length === legs.length ? "complete" : "live",
    };
  }

  // Two legs: the aggregate decides, and a level aggregate falls through to
  // the second leg's own winner, which the API sets from the ET/pens result.
  if (decided.length < legs.length) {
    return { winnerTeamId: null, decidedBy: null, aggregate, state: live ? "live" : "scheduled" };
  }

  if (aggregate && aggregate.home !== aggregate.away) {
    return {
      winnerTeamId: aggregate.home > aggregate.away ? frame.homeId : frame.awayId,
      decidedBy: "aggregate",
      aggregate,
      state: "complete",
    };
  }

  return {
    winnerTeamId: last.winnerTeamId,
    decidedBy: last.penalty ? "penalties" : "extra-time",
    aggregate,
    state: "complete",
  };
};

/**
 * Builds the bracket for one competition from its fixtures.
 *
 * Rounds the competition is expected to reach but has not yet drawn are still
 * emitted, with `drawn: false`. The API publishes no fixtures for an undrawn
 * round, so a bracket built only from data grows through the season and reads
 * as broken in January rather than as "not yet drawn".
 *
 * @param {object} args - { fixtures, competition, expectedRounds }.
 * @return {object} The bracket document body.
 */
const buildBracket = ({ fixtures, competition, expectedRounds }) => {
  const byRound = new Map();
  const unmatched = [];

  for (const fixture of fixtures || []) {
    const raw = fixture.league?.round;
    const round = classifyRound(raw);

    if (!round) {
      unmatched.push({
        fixtureId: String(fixture.fixture?.id ?? fixture.matchId ?? ""),
        round: raw ?? null,
      });
      continue;
    }

    // The league/group phase is a table, not a bracket. Skipped here and
    // rendered from the standings document instead.
    if (round.tableOwned) continue;

    if (!byRound.has(round.key)) {
      byRound.set(round.key, { ...round, fixtures: [] });
    }
    byRound.get(round.key).fixtures.push({ fixture, replay: round.replay });
  }

  const rounds = [...byRound.values()].map((round) => {
    const pairs = new Map();

    for (const { fixture, replay } of round.fixtures) {
      const leg = toLeg(fixture);
      if (!leg.homeTeamId || !leg.awayTeamId) continue;

      const pairKey = [leg.homeTeamId, leg.awayTeamId]
        .map(Number)
        .sort((a, b) => a - b)
        .join("-");

      if (!pairs.has(pairKey)) {
        pairs.set(pairKey, { legs: [], replay: false, teams: fixture.teams });
      }
      const bucket = pairs.get(pairKey);
      bucket.legs.push(leg);
      if (replay) bucket.replay = true;
    }

    const ties = [...pairs.entries()].map(([pairKey, bucket]) => {
      bucket.legs.sort((a, b) => a.timestamp - b.timestamp);

      // The first leg's slots become the display frame for the whole tie.
      const first = bucket.legs[0];
      const frame = { homeId: first.homeTeamId, awayId: first.awayTeamId };
      const verdict = decideTie(bucket.legs, frame, bucket.replay);

      const sideOf = (teamId) => {
        const t = bucket.teams;
        const side = String(t?.home?.id) === teamId ? t.home : t.away;
        return {
          teamId,
          name: side?.name ?? null,
          logo:
            side?.logo ??
            `https://media.api-sports.io/football/teams/${teamId}.png`,
        };
      };

      return {
        tieId: `${competition.id}-${round.key}-${pairKey}`,
        home: sideOf(frame.homeId),
        away: sideOf(frame.awayId),
        legs: bucket.legs,
        ...verdict,
        // More fixtures than a two-legged tie can hold, and not flagged as a
        // replay by its round name — kept whole and flagged rather than
        // dropped or thrown on.
        anomaly:
          bucket.replay ? "replay" : bucket.legs.length > 2 ? "extra-legs" : null,
      };
    });

    return {
      key: round.key,
      label: round.label,
      order: round.order,
      legs: Math.max(1, ...ties.map((tie) => tie.legs.length), 1),
      drawn: ties.length > 0,
      ties: ties.sort((a, b) => (a.legs[0]?.timestamp ?? 0) - (b.legs[0]?.timestamp ?? 0)),
    };
  });

  // Scaffold any expected round the draw has not reached yet.
  for (const key of expectedRounds || []) {
    if (rounds.some((round) => round.key === key)) continue;
    const entry = ROUND_LADDER.find((e) => e.key === key);
    if (!entry) continue;
    rounds.push({
      key: entry.key,
      label: entry.label,
      order: entry.order,
      legs: 1,
      drawn: false,
      ties: [],
    });
  }

  rounds.sort((a, b) => a.order - b.order);

  return {
    leagueId: String(competition.id),
    name: competition.expected,
    rounds,
    unmatched,
    fixtureCount: (fixtures || []).length,
    builtAt: FieldValue.serverTimestamp(),
  };
};

/**
 * Where a competition's bracket lives.
 * @param {object} db - Firestore instance.
 * @param {number|string} season - Season year.
 * @param {number|string} leagueId - API-Football league id.
 * @return {object} DocumentReference.
 */
const bracketDocRef = (db, season, leagueId) =>
  leagueDocRef(db, season, leagueId).collection("bracket").doc("current");

/**
 * Rebuilds and stores brackets for every bracket-bearing competition.
 *
 * Reads fixtures out of Firestore rather than the API, so this is free to run
 * as often as it likes.
 *
 * @param {object} args - { db, season, leagueIds, dryRun }.
 * @return {Promise<object>} Summary with per-competition results.
 */
const syncBrackets = async ({ db, season, leagueIds, dryRun = false }) => {
  const targets = resolveLeagueTargets(leagueIds).filter((c) => c.bracket);

  const writer = dryRun ?
    { set: () => {}, close: async () => {} } :
    db.bulkWriter();
  const results = [];
  const failures = [];

  for (const competition of targets) {
    try {
      const snapshot = await db
        .collection(`fixtures/${season}/fixtures`)
        .where("leagueId", "==", competition.id)
        .get();

      const fixtures = snapshot.docs.map((doc) => doc.data());
      const bracket = buildBracket({
        fixtures,
        competition,
        expectedRounds: competition.expectedRounds,
      });

      writer.set(
        bracketDocRef(db, season, competition.id),
        { ...bracket, season: String(season), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );

      results.push({
        leagueId: String(competition.id),
        name: competition.expected,
        fixtureCount: fixtures.length,
        roundCount: bracket.rounds.filter((r) => r.drawn).length,
        tieCount: bracket.rounds.reduce((sum, r) => sum + r.ties.length, 0),
        unmatched: bracket.unmatched.length,
      });
    } catch (error) {
      failures.push({ leagueId: String(competition.id), error: error.message });
    }
  }

  await writer.close();

  return {
    season: String(season),
    dryRun,
    competitionsRequested: targets.length,
    results,
    failures,
  };
};

module.exports = {
  DECIDED,
  IN_PLAY,
  ROUND_LADDER,
  aggregateOf,
  bracketDocRef,
  buildBracket,
  classifyRound,
  decideTie,
  syncBrackets,
};
