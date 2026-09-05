/**
 * The one place an API fixture becomes a stored fixture document.
 *
 * There are two writers into fixtures/{season}/fixtures — the nightly per-club
 * job and the league-wide cup ingest — and a third that merges live updates
 * over the top. When the mapping was written out by hand in each of them they
 * drifted: the nightly job writes flat `status`/`timestamp`/`leagueId`
 * alongside the raw API objects, while the live poller merges only the nested
 * ones, which is why the flat `status` is stale by mid-afternoon and every
 * reader has to know to use `fixture.status.short` instead.
 *
 * One mapper, so that cannot happen a third time.
 */

/**
 * Which cadence the live poller should give this fixture.
 *
 * "club" is a match involving a club the app has a hub for; those are the ones
 * fans are watching, and they keep the existing every-minute polling. "wide" is
 * everything else that arrives with league-wide cup ingestion — a Conference
 * League Thursday is eighteen simultaneous fixtures, and polling those every
 * minute alongside the rest would multiply the day's API spend several times
 * over for matches nobody on the site is rating.
 *
 * Both writers must compute this the same way or a fixture flaps between tiers
 * every time the other one touches it — which is exactly why it lives here.
 *
 * @param {object} apiFixture - The API's fixture object.
 * @param {Set<number>} trackedTeamIds - Team ids the app has hubs for.
 * @return {string} "club" or "wide".
 */
const livePollTierFor = (apiFixture, trackedTeamIds) => {
  if (!trackedTeamIds || trackedTeamIds.size === 0) return "club";

  const home = Number(apiFixture?.teams?.home?.id);
  const away = Number(apiFixture?.teams?.away?.id);

  return trackedTeamIds.has(home) || trackedTeamIds.has(away) ? "club" : "wide";
};

/**
 * Maps an API fixture into the stored document shape.
 *
 * Writes the flattened fields as well as the raw objects: getFixturesByClubServer
 * and the client's fetchFixtures thunk both query `homeTeamId`/`awayTeamId`, and
 * the standings refresh queries `timestamp`, so a fixture written in nested form
 * only would be invisible to every one of them.
 *
 * @param {object} apiFixture - One entry from an API fixtures response.
 * @param {object} [options] - { trackedTeamIds } for the poll tier.
 * @return {object|null} The document, or null when the fixture has no id.
 */
const toFixtureDoc = (apiFixture, { trackedTeamIds } = {}) => {
  const matchId = apiFixture?.fixture?.id;
  if (!matchId) return null;

  return {
    matchId: String(matchId),
    homeTeamId: apiFixture.teams.home.id,
    awayTeamId: apiFixture.teams.away.id,
    status: apiFixture.fixture.status.short,
    kickoffTime: apiFixture.fixture.date,
    timestamp: apiFixture.fixture.timestamp,
    leagueId: apiFixture.league.id,
    leagueName: apiFixture.league.name,
    livePollTier: livePollTierFor(apiFixture, trackedTeamIds),
    fixture: apiFixture.fixture,
    league: apiFixture.league,
    teams: apiFixture.teams,
    goals: apiFixture.goals,
    score: apiFixture.score,
  };
};

/**
 * The team ids the app has club hubs for, from the directory the nightly job
 * already maintains.
 *
 * One read, and it falls back to an empty set rather than throwing — an empty
 * set means livePollTierFor answers "club" for everything, which is the
 * existing behaviour and the safe way to be wrong.
 *
 * @param {object} db - Firestore instance.
 * @return {Promise<Set<number>>} Tracked team ids.
 */
const readTrackedTeamIds = async (db) => {
  try {
    const doc = await db.collection("config").doc("clubDirectory").get();
    const clubs = doc.exists ? doc.data()?.clubs || [] : [];

    return new Set(
      clubs.map((club) => Number(club.teamId)).filter(Number.isInteger),
    );
  } catch (error) {
    console.error("Could not read the club directory for poll tiers:", error);
    return new Set();
  }
};

module.exports = {
  livePollTierFor,
  readTrackedTeamIds,
  toFixtureDoc,
};
