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

// 5b. Match-level aggregates, for the share card.
//
// Nothing precomputes a team number anywhere — the ratings bucket only stores
// per-player {totalRating, totalSubmits}. Both of these compose on
// selectMatchRatingsById, so they keep the same (state, matchId) signature and
// inherit the weakMapMemoize cache-per-argument described above.

export interface MatchTeamAverage {
  average: number;
  /** How many players carry at least one rating. */
  rated: number;
}

/**
 * The unweighted mean of the per-player AVERAGES.
 *
 * Deliberately NOT sum(totalRating)/sum(totalSubmits): under that form a keeper
 * with 40 votes outweighs a sub with 4, which is the wrong answer to "how did
 * the team play". Players with no submits are excluded rather than counted as
 * zero — the same totalSubmits guard RatingLineup.getRating uses.
 */
export const selectMatchTeamAverage = createSelector(
  [selectMatchRatingsById],
  (players): MatchTeamAverage | null => {
    if (!players) return null;

    let sum = 0;
    let rated = 0;

    Object.values(players as Record<string, any>).forEach((p) => {
      const submits = Number(p?.totalSubmits) || 0;
      if (submits <= 0) return;
      sum += Number(p.totalRating) / submits;
      rated += 1;
    });

    return rated === 0 ? null : { average: sum / rated, rated };
  },
);

export interface MatchTopRated {
  playerId: string;
  average: number;
  name: string;
  img: string;
}

/** The best-rated player of the match. Joins the squad the same way MOTM does. */
export const selectMatchTopRated = createSelector(
  [selectMatchRatingsById, selectSeasonSquadDataObject],
  (players, squadData): MatchTopRated | null => {
    if (!players) return null;

    let bestId = "";
    let bestAverage = -Infinity;

    Object.entries(players as Record<string, any>).forEach(([id, p]) => {
      const submits = Number(p?.totalSubmits) || 0;
      if (submits <= 0) return;
      const average = Number(p.totalRating) / submits;
      if (average > bestAverage) {
        bestAverage = average;
        bestId = id;
      }
    });

    if (!bestId) return null;

    const player = squadData?.[bestId];
    return {
      playerId: bestId,
      average: bestAverage,
      name: player?.name || "Unknown",
      img: player?.photo || "",
    };
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
