import { createSlice } from "@reduxjs/toolkit";

const predictionsSlice = createSlice({
  name: "predictions",
  initialState: { matches: {}, loading: false, error: null, loaded: false },
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
      state.loaded = true;
    },
    fetchMatchPrediction(state, action) {
      const { matchId, data } = action.payload;
      state.matches[matchId] = data;
    },
  },
});

export const {
  fetchPredictionsStart,
  fetchPredictionsFailure,
  fetchPredictionsSuccess,
  fetchMatchPrediction,
} = predictionsSlice.actions;

export default predictionsSlice.reducer;
