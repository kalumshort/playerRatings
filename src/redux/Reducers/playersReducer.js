// import { createSlice } from "@reduxjs/toolkit";

// const playerStatsSlice = createSlice({
//   name: "playerStats",
//   initialState: { players: {}, loading: false, error: null, loaded: false },
//   reducers: {
//     // Old: fetchPlayerStatsStart
//     startFetchingPlayerStats(state) {
//       state.loading = true;
//       state.error = null;
//     },

//     // Old: fetchPlayerStatsFailure
//     failFetchingPlayerStats(state, action) {
//       state.error = action.payload;
//       state.loading = false;
//     },

//     // Old: fetchPlayerStatsSuccess
//     succeedFetchingPlayerStats(state) {
//       state.loading = false;
//       state.loaded = true;
//     },

//     // Old: fetchPlayerStatsAction
//     fetchAllPlayersSeasonOverallRating(state, action) {
//       const { players } = action.payload;

//       // Merge new player data while keeping existing matches data
//       Object.entries(players).forEach(([playerId, playerData]) => {
//         state.players[playerId] = {
//           ...state.players[playerId], // Preserve existing data (e.g., matches)
//           ...playerData, // Merge new player data
//         };
//       });
//     },

//     // Old: addPlayersMatchesStats
//     fetchAllMatchRatingsForPlayerAction(state, action) {
//       const { playerId, matchesData } = action.payload;

//       if (!state.players[playerId]) {
//         state.players[playerId] = {};
//       }

//       state.players[playerId].matches = {
//         ...state.players[playerId].matches,
//         ...matchesData,
//       };
//     },
//   },
// });

// export const {
//   startFetchingPlayerStats,
//   failFetchingPlayerStats,
//   succeedFetchingPlayerStats,
//   updatePlayerStats,
//   addPlayerMatchesStats,
// } = playerStatsSlice.actions;

// export default playerStatsSlice.reducer;
