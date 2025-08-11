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
  fetchAllMatchRatingsForPlayerAction,
  fetchAllPlayersSeasonOverallRatingAction,
  fetchMatchPlayerRatingsAction,
  fetchPlayerAllMatchesRatingLoading,
  fetchPlayerOverallSeasonRatingsStart,
  fetchRatingsFailure,
  fetchRatingsStart,
  fetchRatingsSuccess,
  matchMotmVotesAction,
} from "../redux/Reducers/playerRatingsReducer";

import {
  fetchTeamSquadAction,
  fetchTeamSquadFailure,
  fetchTeamSquadStart,
  fetchTeamSquadSuccess,
} from "../redux/Reducers/teamSquads";
import { getAuth } from "firebase/auth";
import { fetchUserMatchData } from "../redux/Reducers/userDataReducer";

import unitedPlayers from "../redux/unitedPlayers.json"; // adjust if JSON is in another file

// export const fetchFixturess = () => async (dispatch) => {
//   try {
//     const fetchedFixtures = [];
//     await firebaseGet("fixtures/2025", (docId, data) => {
//       fetchedFixtures.push({ id: docId, ...data });
//     });
//     dispatch(fetchFixturesSuccess(fetchedFixtures));
//   } catch (error) {
//     dispatch(fetchFixturesFailure(error.message));
//   }
// };
export const fetchFixtures =
  ({ clubId, currentYear }) =>
  async (dispatch) => {
    try {
      dispatch(fetchFixturesStart()); // Start loading

      const fixturesData = await firebaseGetCollecion(
        `fixtures/${currentYear}/${clubId}`
      );

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

export const fetchPlayerRatingsAllMatches =
  ({ playerId, groupId, currentYear }) =>
  async (dispatch) => {
    try {
      dispatch(fetchPlayerAllMatchesRatingLoading());
      if (!playerId) {
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.error("User is not authenticated");
        return;
      }

      const fixturesData = await firebaseGetCollecion(
        `groups/${groupId}/seasons/${currentYear}/players/${playerId}/matches`
      );

      const fixtures = Object.entries(fixturesData).map(([id, fixture]) => ({
        id,
        ...fixture,
      }));
      dispatch(
        fetchAllMatchRatingsForPlayerAction({
          playerId: playerId,
          matchesData: fixtures,
        })
      );
    } catch (error) {
      console.error("Error getting fixtures:", error);
    }
  };

export const fetchAllPlayersSeasonOverallRating =
  ({ groupId, currentYear }) =>
  async (dispatch) => {
    dispatch(fetchPlayerOverallSeasonRatingsStart());
    const auth = getAuth();

    const user = auth.currentUser;
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      const playerRatings = await firebaseGetCollecion(
        `groups/${groupId}/seasons/${currentYear}/players`
      );

      dispatch(
        fetchAllPlayersSeasonOverallRatingAction({ players: playerRatings })
      );
    } catch (error) {
      console.log(error);
      dispatch(fetchRatingsFailure());
    }
  };

export const fetchMatchPlayerRatings =
  ({ matchId, groupId, currentYear }) =>
  async (dispatch) => {
    if (!matchId || !groupId || !currentYear) {
      console.log("fetchMatchPlayerRatings called with missing parameters");
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
        `groups/${groupId}/seasons/${currentYear}/playerRatings/${matchId}/players`
      );

      const matchMotmVotes = await firebaseGetDocument(
        `groups/${groupId}/seasons/${currentYear}/playerRatings`,
        matchId
      );

      dispatch(
        fetchMatchPlayerRatingsAction({ matchId: matchId, data: playerRatings })
      );
      dispatch(
        matchMotmVotesAction({ matchId: matchId, data: matchMotmVotes })
      );
      dispatch(fetchRatingsSuccess()); // End loading
    } catch (error) {
      dispatch(fetchRatingsFailure()); // End loading

      console.log(error);
    }
  };

export const fetchUsersMatchData =
  ({ matchId, groupId, currentYear }) =>
  async (dispatch) => {
    const auth = getAuth();
    const user = auth.currentUser;

    try {
      const matchData = await firebaseGetDocument(
        `users/${user.uid}/groups/${groupId}/seasons/${currentYear}/matches`,
        matchId
      );
      dispatch(fetchUserMatchData({ matchId: matchId, data: matchData }));
    } catch (err) {
      console.log(err);
    }
  };

export const fetchTeamSquad =
  ({ squadId, currentYear }) =>
  async (dispatch) => {
    if (!squadId || !currentYear) {
      console.log("fetchTeamSquad with no squadId");
      return;
    }

    try {
      dispatch(fetchTeamSquadStart());

      const teamSquadData = await firebaseGetDocument(
        `teamSquads/${squadId}/season`,
        currentYear.toString()
      );
      console.log("teamSquadData", teamSquadData);

      const seasonSquad = teamSquadData.seasonSquad;
      const squadIds = seasonSquad.map((player) => player.id);
      squadIds.forEach((playerId) => {
        const playerData = unitedPlayers[playerId];

        if (playerData) {
          console.log(playerData);
          const playerIndex = teamSquadData.activeSquad.findIndex(
            (player) => player.id === playerId
          );
          if (playerIndex !== -1) {
            teamSquadData.activeSquad[playerIndex].photo = playerData.photo;
            teamSquadData.activeSquad[playerIndex].name = playerData.name;
          }

          const seasonPlayerIndex = teamSquadData.seasonSquad.findIndex(
            (player) => player.id === playerId
          );
          if (seasonPlayerIndex !== -1) {
            teamSquadData.seasonSquad[seasonPlayerIndex].photo =
              playerData.photo;
            teamSquadData.seasonSquad[seasonPlayerIndex].name = playerData.name;
          }
        }
      });
      console.log("teamSquadData after adding photos", teamSquadData);
      dispatch(fetchTeamSquadAction({ squadId, data: teamSquadData }));
      dispatch(fetchTeamSquadSuccess());
    } catch (error) {
      dispatch(fetchTeamSquadFailure());
      console.log(error);
    }
  };

export const fetchMatchPredictions =
  ({ matchId, groupId, currentYear }) =>
  async (dispatch) => {
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
        `groups/${groupId}/seasons/${currentYear}/predictions`,
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
