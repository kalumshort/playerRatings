import { createSelector } from "@reduxjs/toolkit";
import { selectSquadPlayerById } from "./squadDataSelectors";

export const allRatings = (state) => state.ratings;
export const allMatchRatings = (state) => state.ratings.matches;
export const allPlayerRatings = (state) => state.ratings.players;
export const allPlayerStats = (state) => state.playerStats.players;

export const selectAllPlayersStats = (state) => state.playerStats.players;

export const selectPlayerRatingsLoad = (state) => ({
  ratingsLoaded: state.ratings.loaded,
  ratingsError: state.ratings.error,
  ratingsLoading: state.ratings.loading,
});

export const selectPlayerStatsLoad = (state) => ({
  playerStatsLoaded: state.playerStats.loaded,
  playerStatsError: state.playerStats.error,
  playerStatsLoading: state.playerStats.loading,
});

export const selectPlayerStatsById = (playerId) =>
  createSelector([allPlayerStats], (players) => players[playerId]);

export const selectMatchRatingsById = (matchId) =>
  createSelector([allMatchRatings], (matches) => matches[matchId]?.players);

export const selectMatchMotmById = (matchId) =>
  createSelector([allMatchRatings], (matches) => matches[matchId]?.motm);

export const selectPlayerRatinsById = (playerId) =>
  createSelector([allPlayerRatings], (player) => player[playerId]);

export const selectMotmPercentagesByMatchId = (matchId) =>
  createSelector(
    [selectMatchMotmById(matchId), (state) => state],
    (motmData, state) => {
      if (!motmData || !motmData.playerVotes || !motmData.motmTotalVotes) {
        return [];
      }

      const { playerVotes, motmTotalVotes } = motmData;

      return Object.entries(playerVotes)
        .map(([playerId, votes]) => {
          const playerData = selectSquadPlayerById(playerId)(state);
          return {
            playerId,
            votes,
            percentage: ((votes / motmTotalVotes) * 100).toFixed(0), // Calculate percentage
            name: playerData?.name || "Unknown", // Add player name or fallback
            img: playerData?.photo || "Unknown", // Add player position or fallback
          };
        })
        .sort((a, b) => b.percentage - a.percentage); // Sort by percentage in descending order
    }
  );
