import { createSlice } from "@reduxjs/toolkit";

const playerStatsSlice = createSlice({
  name: "playerStats",
  initialState: { players: {}, loading: false, error: null, loaded: false },
  reducers: {
    fetchPlayerStatsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchPlayerStatsFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    fetchPlayerStatsSuccess(state) {
      state.loading = false;
      state.loaded = true;
    },
    fetchPlayerStatsAction(state, action) {
      const { players } = action.payload;

      // Merge new player data while keeping existing matches data
      Object.entries(players).forEach(([playerId, playerData]) => {
        state.players[playerId] = {
          ...state.players[playerId], // Preserve existing data (e.g., matches)
          ...playerData, // Merge new player data
        };
      });
    },
    addPlayersMatchesStats(state, action) {
      const { playerId, matchesData } = action.payload;

      if (!state[playerId]) {
        state.players[playerId] = {};
      }

      state.players[playerId].matches = {
        ...state.players[playerId].matches,
        ...matchesData,
      };
    },
  },
});

export const {
  fetchPlayerStatsStart,
  fetchPlayerStatsFailure,
  fetchPlayerStatsSuccess,
  fetchPlayerStatsAction,
  addPlayersMatchesStats,
} = playerStatsSlice.actions;

export default playerStatsSlice.reducer;
