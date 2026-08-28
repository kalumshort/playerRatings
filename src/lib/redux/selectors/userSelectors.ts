import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const selectUserState = (state: RootState) => state.userData;

export const selectUserAccountData = createSelector(
  [selectUserState],
  (userData) => userData.accountData || {},
);

export const selectIsUserLoaded = createSelector(
  [selectUserState],
  (userData) => userData.loaded,
);

// This selector pulls the homeGroupId we'll use in our HomeRouteController
export const selectHomeGroupId = createSelector(
  [selectUserAccountData],
  (accountData) => accountData.homeGroupId || null,
);

// Check for global or group-specific admin status
export const selectUserPermissions = createSelector(
  [selectUserAccountData],
  (accountData) => accountData.groupPermissions || {},
);

export interface UserMatchStatus {
  rated: boolean;
  predicted: boolean;
}

/**
 * Per-match "have I done this yet", keyed by match id, for the schedule badges.
 *
 * Reads the same two fields the fixture page writes: `ratingsSubmitted` from
 * handleSubmitPlayerRatings and `teamSubmitted` from the lineup predictor
 * (see src/lib/firebase/client-actions.ts). Empty for guests, which is exactly
 * what FixtureRow wants — it renders no badge at all when a status is missing.
 *
 * Memoized, so the objects it hands to React.memo'd rows keep stable
 * references between renders.
 */
export const selectUserMatchStatuses = createSelector(
  // Keyed on `matches` alone, not the whole slice: depending on selectUserState
  // would rebuild every status object whenever accountData changed, defeating
  // the row-level React.memo.
  [(state: RootState) => state.userData.matches],
  (matches) => {
    const statuses: Record<string, UserMatchStatus> = {};
    Object.entries(matches || {}).forEach(([matchId, data]: any) => {
      statuses[matchId] = {
        rated: Boolean(data?.ratingsSubmitted),
        predicted: Boolean(data?.teamSubmitted),
      };
    });
    return statuses;
  },
);
