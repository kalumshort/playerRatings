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
