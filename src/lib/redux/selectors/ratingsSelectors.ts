import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { selectSeasonSquadDataObject } from "./squadSelectors";

// 1. Base Accessors
const selectRatingsSlice = (state: RootState) => state.playerRatings;
const selectActiveGroupId = (state: RootState) => state.groupData.activeGroupId;

// 2. The Brain: Active Bucket
const selectActiveRatingsBucket = createSelector(
  [selectRatingsSlice, selectActiveGroupId],
  (ratings, groupId) => {
    return groupId && ratings.byGroupId[groupId]
      ? ratings.byGroupId[groupId]
      : { matches: {}, players: {} };
  },
);

// 3. Data Selectors
export const selectAllMatchRatings = createSelector(
  [selectActiveRatingsBucket],
  (bucket) => bucket.matches,
);

export const selectAllPlayerOverallRatings = createSelector(
  [selectActiveRatingsBucket],
  (bucket) => {
    const ratings: Record<string, any> = {};
    Object.entries(bucket.players).forEach(([id, data]) => {
      ratings[id] = data.seasonOverall || {};
    });
    return ratings;
  },
);
export const allPlayerRatings = createSelector(
  [selectActiveRatingsBucket],
  (bucket) => bucket.players || {},
);

export const selectPlayerRatingsById = (playerId) =>
  createSelector([allPlayerRatings], (players) => players[playerId]);

// 4. Dynamic Selectors (Curried)
export const selectMatchRatingsById = (matchId: string) =>
  createSelector(
    [selectAllMatchRatings],
    (matches) => matches[matchId]?.players,
  );

export const selectMatchMotmById = (matchId: string) =>
  createSelector(
    [selectAllMatchRatings],
    (matches) => matches[matchId]?.motm || {},
  );

// 5. MOTM Percentage Logic (Cleaned up)
export const selectMotmPercentages = (matchId: string) =>
  createSelector(
    [
      selectMatchMotmById(matchId),

      (state: RootState) => selectSeasonSquadDataObject(state),
    ],
    (motmData, squadData) => {
      // Guard clause: Ensure we have votes and squad info
      if (!motmData?.playerVotes || !motmData?.motmTotalVotes || !squadData) {
        return [];
      }

      const { playerVotes, motmTotalVotes } = motmData;

      return (
        Object.entries(playerVotes as Record<string, number>)
          .map(([playerId, votes]) => {
            const player = squadData[playerId]; // Instant lookup via our dictionary!

            return {
              playerId,
              votes,
              percentage: ((votes / motmTotalVotes) * 100).toFixed(0),
              name: player?.name || "Unknown",
              img: player?.photo || "",
            };
          })
          // Sort by highest percentage first
          .sort((a, b) => Number(b.percentage) - Number(a.percentage))
      );
    },
  );

// 6. Loading States
export const selectRatingsLoadingStates = createSelector(
  [selectRatingsSlice],
  (slice) => ({
    isGlobalLoading: slice.loading,
    error: slice.error,
  }),
);
