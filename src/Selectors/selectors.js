import { createSelector } from "@reduxjs/toolkit";
import { selectSeasonSquadDataObject } from "./squadDataSelectors";

export const allRatings = (state) => state.playerRatings;
export const allMatchRatings = (state) => state.playerRatings.matches;
export const allPlayerRatings = (state) => state.playerRatings.players;

export const selectAllPlayersSeasonOverallRating = (state) => {
  const players = state.playerRatings.players;

  const playerSeasonOverallRatings = {};

  Object.entries(players).forEach(([playerId, playerData]) => {
    playerSeasonOverallRatings[playerId] = playerData.seasonOverall || {};
  });

  return playerSeasonOverallRatings;
};

export const selectPlayerRatingsLoad = (state) => ({
  ratingsLoaded: state.playerRatings.loaded,
  ratingsError: state.playerRatings.error,
  ratingsLoading: state.playerRatings.loading,

  playerSeasonOverallRatingsLoading:
    state.playerRatings.playerSeasonOverallRatingsLoading,

  playerSeasonOverallRatingsLoaded:
    state.playerRatings.playerSeasonOverallRatingsLoaded,

  playerAllMatchesRatingLoading:
    state.playerRatings.playerAllMatchesRatingLoading,

  playerAllMatchesRatingLoaded:
    state.playerRatings.playerAllMatchesRatingLoaded,
});

export const selectPlayerRatingsById = (playerId) =>
  createSelector([allPlayerRatings], (players) => players[playerId]);

export const selectPlayerOverallRatingById = (playerId) =>
  createSelector(
    [allPlayerRatings],
    (players) => players[playerId]?.seasonOverall || {}
  );

export const selectMatchRatingsById = (matchId) =>
  createSelector([allMatchRatings], (matches) => matches[matchId]?.players);

export const selectMatchMotmById = (matchId) =>
  createSelector([allMatchRatings], (matches) => matches[matchId]?.motm);

export const selectPlayerRatinsById = (playerId) =>
  createSelector([allPlayerRatings], (player) => player[playerId]);

export const selectMotmPercentagesByMatchId = (matchId, clubSlug) =>
  createSelector(
    [
      selectMatchMotmById(matchId),
      (state) => selectSeasonSquadDataObject(state, clubSlug), // Pass the whole squad object here
    ],
    (motmData, squadData) => {
      // 1. Guard Clause
      if (
        !motmData ||
        !motmData.playerVotes ||
        !motmData.motmTotalVotes ||
        !squadData
      ) {
        return [];
      }

      const { playerVotes, motmTotalVotes } = motmData;

      // 2. Map and Transform
      return Object.entries(playerVotes)
        .map(([playerId, votes]) => {
          const player = squadData[playerId]; // Direct lookup is O(1)

          return {
            playerId,
            votes,
            percentage: ((votes / motmTotalVotes) * 100).toFixed(0),
            name: player?.name || "Unknown",
            img: player?.photo || "",
          };
        })
        .sort((a, b) => b.percentage - a.percentage);
    }
  );

export const selectGlobalData = (state) => state.globalData;
