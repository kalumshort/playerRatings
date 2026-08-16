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

// 4. Parameterised selectors.
//
// These used to be curried factories — calling one built a NEW createSelector
// instance, so the memo cache was thrown away on every render and the work ran
// every time. Taking the id as a second argument keeps one shared instance.
//
// Safe because reselect 5 (via RTK 2.x) memoizes arguments with weakMapMemoize,
// which caches per-argument without a size limit — 30 concurrent playerIds on
// the leaderboard don't evict each other. Under reselect 4's maxSize:1 default
// this pattern would thrash instead.
const selectMatchIdArg = (_state: RootState, matchId: string | number) =>
  String(matchId);
const selectPlayerIdArg = (_state: RootState, playerId: string | number) =>
  String(playerId);

// Stable reference for the "no MOTM data" case. `|| {}` allocated a fresh
// object per call, which alone was enough to defeat selectMotmPercentages'
// memoization even once the factory problem was fixed.
const EMPTY_MOTM: Record<string, any> = {};

export const selectPlayerRatingsById = createSelector(
  [allPlayerRatings, selectPlayerIdArg],
  (players, playerId) => players[playerId],
);

export const selectMatchRatingsById = createSelector(
  [selectAllMatchRatings, selectMatchIdArg],
  (matches, matchId) => matches[matchId]?.players,
);

export const selectMatchMotmById = createSelector(
  [selectAllMatchRatings, selectMatchIdArg],
  (matches, matchId) => matches[matchId]?.motm ?? EMPTY_MOTM,
);

// 5. MOTM Percentage Logic (Cleaned up)
export const selectMotmPercentages = createSelector(
  [selectMatchMotmById, selectSeasonSquadDataObject],
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
