import { createSlice } from "@reduxjs/toolkit";

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: {
    matches: {},
    players: {},
    loading: false,
    error: null,
    loaded: false,
  },
  reducers: {
    fetchRatingsStart(state) {
      state.loading = true;
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
    },
  },
});

export const {
  fetchRatingsStart,
  fetchRatingsFailure,
  fetchRatingsSuccess,
  fetchMatchPlayerRatingsAction,
  matchMotmVotesAction,
} = ratingsSlice.actions;

export default ratingsSlice.reducer;
