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
import {
  fetchMatchPrediction,
  fetchPredictionsFailure,
  fetchPredictionsStart,
  fetchPredictionsSuccess,
} from "../redux/Reducers/predictionsReducer";
import {
  fetchMatchPlayerRatingsAction,
  fetchRatingsFailure,
  fetchRatingsStart,
  fetchRatingsSuccess,
  matchMotmVotesAction,
} from "../redux/Reducers/playerRatingsReducer";
import {
  addPlayersMatchesStats,
  fetchPlayerStatsAction,
  fetchPlayerStatsFailure,
  fetchPlayerStatsStart,
  fetchPlayerStatsSuccess,
} from "../redux/Reducers/playersReducer";
import {
  fetchTeamSquadAction,
  fetchTeamSquadFailure,
  fetchTeamSquadStart,
  fetchTeamSquadSuccess,
} from "../redux/Reducers/teamSquads";
import { getAuth } from "firebase/auth";

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
export const fetchFixtures = (clubId) => async (dispatch) => {
  try {
    dispatch(fetchFixturesStart()); // Start loading

    const fixturesData = await firebaseGetCollecion(`fixtures/2024/${clubId}`);

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
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error("User is not authenticated");
      return;
    }
    dispatch(fetchPlayerStatsStart());

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
    dispatch(fetchPlayerStatsSuccess());
  } catch (error) {
    dispatch(fetchPlayerStatsFailure());
    console.error("Error getting fixtures:", error);
  }
};

export const fetchMatchPlayerRatings = (matchId) => async (dispatch) => {
  if (!matchId) {
    return;
  }

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User is not authenticated");
    return;
  }

  try {
    dispatch(fetchRatingsStart()); // Start loading

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
    dispatch(fetchRatingsSuccess()); // End loading
  } catch (error) {
    dispatch(fetchRatingsFailure()); // End loading

    console.log(error);
  }
};
export const fetchPlayerStats = () => async (dispatch) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User is not authenticated");
    return;
  }

  try {
    const playerRatings = await firebaseGetCollecion(
      `groups/001/seasons/2024/players`
    );

    dispatch(fetchPlayerStatsAction({ players: playerRatings }));
  } catch (error) {
    console.log(error);
  }
};

export const fetchTeamSquad = (squadId) => async (dispatch) => {
  if (!squadId) {
    console.log("fetchTeamSquad with no squadId");
    return;
  }
  try {
    dispatch(fetchTeamSquadStart());

    const teamSquadData = await firebaseGetDocument(`teamSquads`, squadId);

    const activeSquadIds = teamSquadData.playerIds;

    await Promise.all(
      activeSquadIds.map(async (playerId) => {
        try {
          const playerDoc = await firebaseGetDocument(
            "playerImages",
            playerId.toString()
          );

          if (playerDoc) {
            const playerIndex = teamSquadData.activeSquad.findIndex(
              (player) => player.id === playerId
            );
            if (playerIndex !== -1) {
              teamSquadData.activeSquad[playerIndex].photo = playerDoc.img;
            }
          }
        } catch (error) {
          console.error(
            `Error fetching player document for playerId ${playerId}:`,
            error
          );
        }
      })
    );

    dispatch(fetchTeamSquadAction({ squadId, data: teamSquadData }));
    dispatch(fetchTeamSquadSuccess());
  } catch (error) {
    dispatch(fetchTeamSquadFailure());
    console.log(error);
  }
};

export const fetchMatchPredictions = (matchId) => async (dispatch) => {
  if (!matchId) {
    return;
  }

  // Check if the user is authenticated
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User is not authenticated");
    return;
  }

  try {
    dispatch(fetchPredictionsStart());

    // Proceed with the Firestore call since the user is authenticated
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
    dispatch(fetchPredictionsSuccess());
  } catch (error) {
    dispatch(fetchPredictionsFailure());

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
