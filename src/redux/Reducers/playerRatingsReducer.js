import { createSlice } from "@reduxjs/toolkit";

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: { matches: {}, players: {} },
  reducers: {
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

export const { fetchMatchPlayerRatingsAction, matchMotmVotesAction } =
  ratingsSlice.actions;

export default ratingsSlice.reducer;
