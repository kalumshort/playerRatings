import {
  firebaseGetCollecion,
  firebaseGetDocument,
} from "../Firebase/Firebase";

import {
  fetchFixturesFailure,
  fetchFixturesSuccess,
  fetchFixturesStart,
  // fixtureReducer is no longer needed here for the main fetch
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
  fetchPlayerOverallSeasonRatingsStart,
  fetchRatingsFailure,
  fetchRatingsStart,
  fetchRatingsSuccess,
  matchMotmVotesAction,
} from "../redux/Reducers/playerRatingsReducer";

import {
  // fetchTeamSquadAction, // REMOVED: Merged into Success
  fetchTeamSquadFailure,
  fetchTeamSquadStart,
  fetchTeamSquadSuccess,
} from "../redux/Reducers/teamSquads";

import { getAuth } from "firebase/auth";
import { fetchUserMatchData } from "../redux/Reducers/userDataReducer";

import {
  collection,
  getDocs,
  getFirestore,
  or,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

// --- 1. GLOBAL FIXTURES (UPDATED) ---
export const fetchFixtures =
  ({ clubId, currentYear }) =>
  async (dispatch) => {
    try {
      dispatch(fetchFixturesStart());

      const db = getFirestore();
      const matchesRef = collection(db, `fixtures/${currentYear}/fixtures`);

      const teamIdNumber = Number(clubId);

      // Query: Team is Home OR Away, sorted by newest
      const q = query(
        matchesRef,
        or(
          where("homeTeamId", "==", teamIdNumber),
          where("awayTeamId", "==", teamIdNumber)
        ),
        orderBy("timestamp", "desc")
      );

      const querySnapshot = await getDocs(q);

      const fixtures = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((fixture) => !["1371777", "1402829"].includes(fixture.id));

      // UPDATED: Dispatch with Context (ClubID + Year)
      dispatch(
        fetchFixturesSuccess({
          clubId,
          year: currentYear,
          fixtures,
        })
      );
    } catch (error) {
      console.error("Error getting fixtures:", error);
      if (error.message.includes("index")) {
        console.error(
          "⚠️ YOU NEED TO CREATE A FIRESTORE INDEX. CLICK THE LINK IN THE CONSOLE."
        );
      }
      dispatch(fetchFixturesFailure(error.message));
    }
  };

// --- 2. GLOBAL SQUADS (UPDATED) ---
export const fetchTeamSquad =
  ({ squadId, currentYear }) =>
  async (dispatch) => {
    if (!squadId || !currentYear) {
      console.log("fetchTeamSquad missing params");
      return;
    }

    try {
      dispatch(fetchTeamSquadStart());

      const teamSquadData = await firebaseGetDocument(
        `teamSquads/${squadId}/season`,
        currentYear.toString()
      );

      // 🛡️ SANITIZATION STEP: Convert Firestore Timestamps to ISO Strings
      if (teamSquadData) {
        if (teamSquadData.lastUpdated?.toDate) {
          // Convert Firestore Timestamp to String
          teamSquadData.lastUpdated = teamSquadData.lastUpdated
            .toDate()
            .toISOString();
        } else if (teamSquadData.lastUpdated instanceof Timestamp) {
          // Fallback check
          teamSquadData.lastUpdated = teamSquadData.lastUpdated
            .toDate()
            .toISOString();
        }
      }

      dispatch(
        fetchTeamSquadSuccess({
          clubId: squadId,
          year: currentYear.toString(),
          data: teamSquadData,
        })
      );
    } catch (error) {
      console.error("Error fetching squad:", error);
      dispatch(fetchTeamSquadFailure(error.message));
    }
  };

// --- 3. PLAYER RATINGS (UNCHANGED for now, but ready for scaling) ---
export const fetchPlayerRatingsAllMatches =
  ({ playerId, groupId, currentYear }) =>
  async (dispatch) => {
    try {
      if (!playerId) return;

      const fixturesData = await firebaseGetCollecion(
        `groups/${groupId}/seasons/${currentYear}/players/${playerId}/matches`
      );

      const fixtures = Object.entries(fixturesData).map(([id, fixture]) => ({
        id,
        ...fixture,
      }));

      dispatch(
        fetchAllMatchRatingsForPlayerAction({
          groupId, // ✅ ADD THIS
          playerId,
          matchesData: fixtures,
        })
      );
    } catch (error) {
      console.error("Error getting player ratings:", error);
    }
  };

// src/Hooks/Fixtures_Hooks.js

export const fetchAllPlayersSeasonOverallRating =
  ({ groupId, currentYear }) =>
  async (dispatch) => {
    dispatch(fetchPlayerOverallSeasonRatingsStart());

    try {
      // 1. Fetch raw data
      const playerRatings = await firebaseGetCollecion(
        `groups/${groupId}/seasons/${currentYear}/players`
      );

      // 2. 🛡️ SANITIZE DATA (Fixes Redux Crash)
      // Loop through every player and convert Timestamps to Strings
      const sanitizedRatings = Object.entries(playerRatings).reduce(
        (acc, [key, data]) => {
          const cleanData = { ...data };

          // Check specific fields that might be Timestamps
          if (
            cleanData.lastUpdated &&
            typeof cleanData.lastUpdated.toDate === "function"
          ) {
            cleanData.lastUpdated = cleanData.lastUpdated
              .toDate()
              .toISOString();
          }

          // If you have other timestamp fields (like createdAt), convert them here too

          acc[key] = cleanData;
          return acc;
        },
        {}
      );

      // 3. Dispatch clean data
      dispatch(
        fetchAllPlayersSeasonOverallRatingAction({
          groupId,
          players: sanitizedRatings,
        })
      );
    } catch (error) {
      console.log("Failed to fetch all players season overall ratings", error);
      dispatch(fetchRatingsFailure());
    }
  };

export const fetchMatchPlayerRatings =
  ({ matchId, groupId, currentYear }) =>
  async (dispatch) => {
    if (!matchId || !groupId || !currentYear) return;

    try {
      dispatch(fetchRatingsStart());

      const playerRatings = await firebaseGetCollecion(
        `groups/${groupId}/seasons/${currentYear}/playerRatings/${matchId}/players`
      );

      const matchMotmVotes = await firebaseGetDocument(
        `groups/${groupId}/seasons/${currentYear}/playerRatings`,
        matchId
      );

      dispatch(
        fetchMatchPlayerRatingsAction({
          groupId, // ✅ ADD THIS
          matchId,
          data: playerRatings,
        })
      );
      dispatch(
        matchMotmVotesAction({
          groupId, // ✅ ADD THIS
          matchId,
          data: matchMotmVotes,
        })
      );
      dispatch(fetchRatingsSuccess());
    } catch (error) {
      dispatch(fetchRatingsFailure());
      console.log(error);
    }
  };

export const fetchUsersMatchData =
  ({ matchId, groupId, currentYear }) =>
  async (dispatch) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const matchData = await firebaseGetDocument(
        `users/${user.uid}/groups/${groupId}/seasons/${currentYear}/matches`,
        matchId
      );
      dispatch(fetchUserMatchData({ matchId, data: matchData }));
    } catch (err) {
      console.log(err);
    }
  };

export const fetchMatchPredictions =
  ({ matchId, groupId, currentYear }) =>
  async (dispatch) => {
    if (!matchId || !groupId) return;

    // ... (Auth checks remain the same) ...

    try {
      dispatch(fetchPredictionsStart());

      const matchPredictions = await firebaseGetDocument(
        `groups/${groupId}/seasons/${currentYear}/predictions`,
        matchId
      );

      if (!matchPredictions) return;

      // ✅ FIX: Pass 'groupId' here!
      dispatch(
        fetchMatchPrediction({
          groupId: groupId, // <--- ADD THIS
          matchId: matchPredictions.id,
          data: matchPredictions,
        })
      );
      dispatch(fetchPredictionsSuccess());
    } catch (error) {
      dispatch(fetchPredictionsFailure(error.message));
      console.error("Error getting predictions:", error);
    }
  };
