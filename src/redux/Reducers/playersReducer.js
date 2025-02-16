import { createSlice } from "@reduxjs/toolkit";

const playerStatsSlice = createSlice({
  name: "playerStats",
  initialState: {},
  reducers: {
    fetchPlayerStatsAction(state, action) {
      const { players } = action.payload;

      // Merge new player data while keeping existing matches data
      Object.entries(players).forEach(([playerId, playerData]) => {
        state[playerId] = {
          ...state[playerId], // Preserve existing data (e.g., matches)
          ...playerData, // Merge new player data
        };
      });
    },
    addPlayersMatchesStats(state, action) {
      const { playerId, matchesData } = action.payload;

      if (!state[playerId]) {
        state[playerId] = {};
      }

      state[playerId].matches = {
        ...state[playerId].matches,
        ...matchesData,
      };
    },
  },
});

export const { fetchPlayerStatsAction, addPlayersMatchesStats } =
  playerStatsSlice.actions;

export default playerStatsSlice.reducer;
