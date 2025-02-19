import {
  firebaseGetCollecion,
  firebaseGetDocument,
} from "../Firebase/Firebase";
import {
  fetchFixturesFailure,
  fetchFixturesSuccess,
  fetchFixturesStart,
  fixturesReducer,
} from "../redux/Reducers/fixturesReducer";
import { fetchMatchPrediction } from "../redux/Reducers/predictionsReducer";
import {
  fetchMatchPlayerRatingsAction,
  matchMotmVotesAction,
} from "../redux/Reducers/playerRatingsReducer";
import {
  addPlayersMatchesStats,
  fetchPlayerStatsAction,
} from "../redux/Reducers/playersReducer";

// export const fetchFixturess = () => async (dispatch) => {
//   try {
//     const fetchedFixtures = [];
//     await firebaseGet("fixtures/2024", (docId, data) => {
//       fetchedFixtures.push({ id: docId, ...data });
//     });
//     dispatch(fetchFixturesSuccess(fetchedFixtures));
//   } catch (error) {
//     dispatch(fetchFixturesFailure(error.message));
//   }
// };
export const fetchFixtures = () => async (dispatch) => {
  try {
    dispatch(fetchFixturesStart()); // Start loading

    const fixturesData = await firebaseGetCollecion("fixtures/2024/data");

    const fixtures = Object.entries(fixturesData)
      .map(([id, fixture]) => ({ id, ...fixture }))
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

    dispatch(fixturesReducer(fixtures));
    dispatch(fetchFixturesSuccess());
  } catch (error) {
    console.error("Error getting fixtures:", error);
    dispatch(fetchFixturesFailure(error.message));
  }
};

export const fetchPlayerMatchesStats = (playerId) => async (dispatch) => {
  try {
    if (!playerId) {
      return;
    }
    const fixturesData = await firebaseGetCollecion(
      `groups/001/seasons/2024/players/${playerId}/matches`
    );

    const fixtures = Object.entries(fixturesData).map(([id, fixture]) => ({
      id,
      ...fixture,
    }));
    dispatch(
      addPlayersMatchesStats({ playerId: playerId, matchesData: fixtures })
    );
  } catch (error) {
    console.error("Error getting fixtures:", error);
  }
};

export const fetchMatchPlayerRatings = (matchId) => async (dispatch) => {
  if (!matchId) {
    return;
  }
  try {
    const playerRatings = await firebaseGetCollecion(
      `groups/001/seasons/2024/playerRatings/${matchId}/players`
    );

    const matchMotmVotes = await firebaseGetDocument(
      `groups/001/seasons/2024/playerRatings`,
      matchId
    );

    dispatch(
      fetchMatchPlayerRatingsAction({ matchId: matchId, data: playerRatings })
    );
    dispatch(matchMotmVotesAction({ matchId: matchId, data: matchMotmVotes }));
  } catch (error) {
    console.log(error);
  }
};

export const fetchPlayerStats = () => async (dispatch) => {
  try {
    const playerRatings = await firebaseGetCollecion(
      `groups/001/seasons/2024/players`
    );

    dispatch(fetchPlayerStatsAction({ players: playerRatings }));
  } catch (error) {
    console.log(error);
  }
};

export const fetchMatchPredictions = (matchId) => async (dispatch) => {
  if (!matchId) {
    return;
  }
  try {
    const matchPredictions = await firebaseGetDocument(
      `groups/001/seasons/2024/predictions`,
      matchId
    );
    if (!matchPredictions) {
      return;
    }
    dispatch(
      fetchMatchPrediction({
        matchId: matchPredictions.id,
        data: matchPredictions,
      })
    );
  } catch (error) {
    console.error("Error getting fixtures:", error);
  }
};

// const findLatestFixture = (fixtures, now) => {
//   const recentPastThreshold = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

//   const sortedFixtures = fixtures.sort(
//     (a, b) => a.fixture.timestamp - b.fixture.timestamp
//   );

//   const latest = sortedFixtures.find((fixture) => {
//     const timestamp = fixture.fixture.timestamp * 1000;
//     return (
//       timestamp > now ||
//       (timestamp <= now && now - timestamp <= recentPastThreshold)
//     );
//   });

//   return latest || null;
// };
