import { createSlice } from "@reduxjs/toolkit";

const predictionsSlice = createSlice({
  name: "predictions",
  initialState: {},
  reducers: {
    fetchMatchPrediction(state, action) {
      const { matchId, data } = action.payload;
      state[matchId] = data;
    },
  },
});

export const { fetchMatchPrediction } = predictionsSlice.actions;

export default predictionsSlice.reducer;
