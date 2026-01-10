import { createSlice } from "@reduxjs/toolkit";

const initGroupBucket = (state, groupId) => {
  if (!state.byGroupId[groupId]) {
    state.byGroupId[groupId] = { matches: {}, players: {} };
  }
  return state.byGroupId[groupId];
};

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    byGroupId: {},
    loading: false,
    error: null,
    // Keep these specific loading states for your selectors
    playerSeasonOverallRatingsLoading: false,
    playerAllMatchesRatingLoading: false,
  },
  reducers: {
    // --- LOADING HANDLERS ---
    fetchRatingsStart(state) {
      state.loading = true;
      state.error = null;
    },

    // ✅ ADDED BACK: The missing action
    fetchPlayerOverallSeasonRatingsStart(state) {
      state.playerSeasonOverallRatingsLoading = true;
      state.error = null;
    },

    // Optional: If you use this one too
    fetchPlayerAllMatchesRatingLoading(state) {
      state.playerAllMatchesRatingLoading = true;
      state.error = null;
    },

    fetchRatingsFailure(state, action) {
      state.loading = false;
      state.playerSeasonOverallRatingsLoading = false;
      state.playerAllMatchesRatingLoading = false;
      state.error = action.payload;
    },

    fetchRatingsSuccess(state) {
      state.loading = false;
    },

    // --- DATA ACTIONS ---
    fetchMatchPlayerRatingsAction(state, action) {
      const { groupId, matchId, data } = action.payload;
      const group = initGroupBucket(state, groupId);
      if (!group.matches[matchId]) group.matches[matchId] = {};
      group.matches[matchId].players = data;
    },

    matchMotmVotesAction(state, action) {
      const { groupId, matchId, data } = action.payload;
      const group = initGroupBucket(state, groupId);
      if (!group.matches[matchId]) group.matches[matchId] = {};
      group.matches[matchId].motm = data;
    },

    fetchAllPlayersSeasonOverallRatingAction(state, action) {
      const { groupId, players } = action.payload;
      const group = initGroupBucket(state, groupId);

      Object.entries(players).forEach(([playerId, playerData]) => {
        if (!group.players[playerId]) group.players[playerId] = {};
        group.players[playerId].seasonOverall = playerData;
      });

      state.playerSeasonOverallRatingsLoading = false; // Turn off loading
    },

    fetchAllMatchRatingsForPlayerAction(state, action) {
      const { groupId, playerId, matchesData } = action.payload;
      const group = initGroupBucket(state, groupId);

      if (!group.players[playerId]) group.players[playerId] = {};

      group.players[playerId].matches = {
        ...group.players[playerId].matches,
        ...matchesData,
      };

      state.playerAllMatchesRatingLoading = false; // Turn off loading
    },
  },
});

export const {
  fetchRatingsStart,
  fetchPlayerOverallSeasonRatingsStart, // Exported now
  fetchPlayerAllMatchesRatingLoading,
  fetchRatingsFailure,
  fetchRatingsSuccess,
  fetchMatchPlayerRatingsAction,
  matchMotmVotesAction,
  fetchAllPlayersSeasonOverallRatingAction,
  fetchAllMatchRatingsForPlayerAction,
} = ratingsSlice.actions;

export default ratingsSlice.reducer;
