import { createSlice } from "@reduxjs/toolkit";

const playerStatsSlice = createSlice({
  name: "playerStats",
  initialState: {},
  reducers: {
    fetchPlayerStatsAction(state, action) {
      const { players } = action.payload;

      console.log("playersAction", players);
      return { ...players };
    },
  },
});

export const { fetchPlayerStatsAction } = playerStatsSlice.actions;

export default playerStatsSlice.reducer;
