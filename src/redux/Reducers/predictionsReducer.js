import { createSlice } from "@reduxjs/toolkit";

const predictionsSlice = createSlice({
  name: "predictions",
  initialState: {
    byGroupId: {}, // Structure: { "group_A": { "match_123": { ...data } } }
    loading: false,
    error: null,
  },
  reducers: {
    fetchPredictionsStart(state) {
      state.loading = true;
      state.error = null;
    },

    fetchPredictionsFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },

    fetchPredictionsSuccess(state) {
      state.loading = false;
    },

    // UPDATED: Stores prediction in the specific group's bucket
    fetchMatchPrediction(state, action) {
      const { groupId, matchId, data } = action.payload;

      // 1. Create the Group Bucket if it doesn't exist
      if (!state.byGroupId[groupId]) {
        state.byGroupId[groupId] = {};
      }

      // 2. Store the match data inside that group
      state.byGroupId[groupId][matchId] = data;
    },

    // Optional: Only used on Logout now
    resetPredictions(state) {
      state.byGroupId = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  fetchPredictionsStart,
  fetchPredictionsFailure,
  fetchPredictionsSuccess,
  fetchMatchPrediction,
  resetPredictions,
} = predictionsSlice.actions;

export default predictionsSlice.reducer;
