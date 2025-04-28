import { createSlice } from "@reduxjs/toolkit";

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    matches: {},
    players: {},
    loading: false,
    error: null,
    loaded: false,
    playerSeasonOverallRatingsLoading: false,
    playerSeasonOverallRatingsLoaded: false,
    playerAllMatchesRatingLoading: false,
    playerAllMatchesRatingLoaded: false,
  },
  reducers: {
    fetchRatingsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchPlayerOverallSeasonRatingsStart(state) {
      state.playerSeasonOverallRatingsLoading = true;
      state.error = null;
    },
    fetchPlayerAllMatchesRatingLoading(state) {
      state.playerAllMatchesRatingLoading = true;
      state.error = null;
    },
    fetchRatingsFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    fetchRatingsSuccess(state) {
      state.loading = false;
      state.loaded = true;
    },
    fetchMatchPlayerRatingsAction(state, action) {
      const { matchId, data } = action.payload;

      // Ensure the matchId object exists
      if (!state.matches[matchId]) {
        state.matches[matchId] = {}; // Initialize the match entry if not already present
      }

      // Save the data inside the new "players" entry
      state.matches[matchId]["players"] = data;
    },
    matchMotmVotesAction(state, action) {
      const { matchId, data } = action.payload;

      // Ensure the matchId object exists
      if (!state.matches[matchId]) {
        state.matches[matchId] = {}; // Initialize the match entry if not already present
      }

      // Save the data inside the new "motm" entry
      state.matches[matchId]["motm"] = data;
      state.loading = false;
    },
    fetchAllPlayersSeasonOverallRatingAction(state, action) {
      const { players } = action.payload;

      // Merge new player data while keeping existing matches data
      Object.entries(players).forEach(([playerId, playerData]) => {
        state.players[playerId] = {
          ...state.players[playerId], // Preserve existing data (e.g., matches)
          seasonOverall: {
            ...state.players[playerId]?.seasonOverall, // Preserve existing seasonOverall data if any
            ...playerData, // Merge new player data from the Firebase document
          },
        };
      });
      state.playerSeasonOverallRatingsLoading = false;
      state.playerSeasonOverallRatingsLoaded = true;
    },

    fetchAllMatchRatingsForPlayerAction(state, action) {
      const { playerId, matchesData } = action.payload;

      if (!state.players[playerId]) {
        state.players[playerId] = {};
      }

      state.players[playerId].matches = {
        ...state.players[playerId].matches,
        ...matchesData,
      };

      state.playerAllMatchesRatingLoading = false;
      state.playerAllMatchesRatingLoaded = true;
    },
    clearRatings(state) {
      state.matches = {}; // Clear matches data
      state.players = {}; // Clear players data
      state.loading = false; // Reset loading state
      state.error = null; // Reset error state
      state.loaded = false; // Reset loaded state
      state.playerSeasonOverallRatingsLoading = false; // Reset loading for player season ratings
      state.playerSeasonOverallRatingsLoaded = false; // Reset loaded flag for player season ratings
      state.playerAllMatchesRatingLoading = false; // Reset loading for player match ratings
      state.playerAllMatchesRatingLoaded = false; // Reset loaded flag for player match ratings
    },
  },
});

export const {
  fetchRatingsStart,
  fetchRatingsFailure,
  fetchRatingsSuccess,
  fetchMatchPlayerRatingsAction,
  matchMotmVotesAction,
  fetchAllPlayersSeasonOverallRatingAction,
  fetchAllMatchRatingsForPlayerAction,
  fetchPlayerOverallSeasonRatingsStart,
  fetchPlayerAllMatchesRatingLoading,
  clearRatings,
} = ratingsSlice.actions;

export default ratingsSlice.reducer;
