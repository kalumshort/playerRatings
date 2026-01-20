import { createSelector } from "@reduxjs/toolkit";
import { selectSeasonSquadDataObject } from "./squadDataSelectors";

// --- 1. CORE ACCESSORS ---
const selectRatingsSlice = (state) => state.playerRatings;
const selectActiveGroupId = (state) => state.groupData.activeGroupId;

// --- 2. BUCKET SELECTOR (The "Brain") ---
// Automatically finds the correct data bucket for the current group
const selectActiveRatingsBucket = createSelector(
  [selectRatingsSlice, selectActiveGroupId],
  (ratings, groupId) => {
    if (!groupId || !ratings.byGroupId[groupId]) {
      return { matches: {}, players: {} }; // Return empty structure if not loaded
    }
    return ratings.byGroupId[groupId];
  },
);

// --- 3. DERIVED BASE SELECTORS ---
// These now point to the bucket, not the root state
export const allMatchRatings = createSelector(
  [selectActiveRatingsBucket],
  (bucket) => bucket.matches || {},
);

export const allPlayerRatings = createSelector(
  [selectActiveRatingsBucket],
  (bucket) => bucket.players || {},
);

// --- 4. LOADING STATE SELECTOR ---
// Note: Loading states are global per slice in your current setup,
// but you might want to make them per-group later. For now, we keep it simple.
// Ensure you import selectActiveGroupId at the top of your selectors file
// import { selectActiveGroupId } from './groupSelectors'; (or wherever it lives)

export const selectPlayerRatingsLoad = createSelector(
  [selectRatingsSlice, selectActiveGroupId],
  (slice, groupId) => {
    // 1. Check if we actually have data for this group in the state
    // We check 'slice.byGroupId[groupId]' to see if the bucket exists
    const groupData =
      groupId && slice.byGroupId ? slice.byGroupId[groupId] : null;
    const hasData = !!groupData;

    return {
      ratingsLoaded: !slice.loading,
      ratingsError: slice.error,
      ratingsLoading: slice.loading,

      // 2. Dynamic Loading States
      // If global loading is true, we assume we are loading.
      playerSeasonOverallRatingsLoading: slice.loading,

      // 3. THE FIX: Only return true if we actually found data for this group
      playerSeasonOverallRatingsLoaded: hasData,

      playerAllMatchesRatingLoading: slice.loading,
      playerAllMatchesRatingLoaded: hasData,
    };
  },
);

// --- 5. DATA SELECTORS ---

export const selectAllPlayersSeasonOverallRating = createSelector(
  [allPlayerRatings],
  (players) => {
    const ratings = {};
    Object.entries(players).forEach(([playerId, playerData]) => {
      ratings[playerId] = playerData.seasonOverall || {};
    });
    return ratings;
  },
);

export const selectPlayerRatingsById = (playerId) =>
  createSelector([allPlayerRatings], (players) => players[playerId]);

export const selectPlayerOverallRatingById = (playerId) =>
  createSelector(
    [allPlayerRatings],
    (players) => players[playerId]?.seasonOverall || {},
  );

export const selectMatchRatingsById = (matchId) =>
  createSelector([allMatchRatings], (matches) => matches[matchId]?.players);

export const selectMatchMotmById = (matchId) =>
  createSelector([allMatchRatings], (matches) => matches[matchId]?.motm);

// Typo fix from original file: selectPlayerRatinsById -> selectPlayerRatingsById
// I kept the duplicate just in case you use it elsewhere, but mapped it to the same logic.
export const selectPlayerRatinsById = selectPlayerRatingsById;

// --- 6. COMPLEX LOGIC (MOTM Percentages) ---
export const selectMotmPercentagesByMatchId = (matchId, clubSlug) =>
  createSelector(
    [
      selectMatchMotmById(matchId),
      (state) => selectSeasonSquadDataObject(state, clubSlug),
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
          const player = squadData[playerId];

          return {
            playerId,
            votes,
            percentage: ((votes / motmTotalVotes) * 100).toFixed(0),
            name: player?.name || "Unknown",
            img: player?.photo || "",
          };
        })
        .sort((a, b) => b.percentage - a.percentage);
    },
  );

export const selectGlobalData = (state) => state.globalData;
