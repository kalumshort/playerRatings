import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

// Base State Accessors
export const selectGroupState = (state: RootState) => state.groupData;
export const selectUserState = (state: RootState) => state.userData;

// 1. Status Selectors
export const selectGroupLoading = createSelector(
  [selectGroupState],
  (groupData) => groupData.loading,
);

export const selectGroupLoaded = createSelector(
  [selectGroupState],
  (groupData) => groupData.loaded,
);

// 2. Data Dictionary
export const selectGroupData = createSelector(
  [selectGroupState],
  (groupData) => groupData.byGroupId || {},
);

// 3. Active Group Logic (The one in the URL)
export const selectActiveGroupId = createSelector(
  [selectGroupState],
  (groupData) => groupData.activeGroupId,
);

export const selectActiveGroupData = createSelector(
  [selectGroupData, selectActiveGroupId],
  (groupsDictionary, activeId) => {
    return activeId ? groupsDictionary[activeId] : null;
  },
);

// 4. NEW: Home Group Logic (For the automatic redirect at /)
// This looks at the user's profile to find their primary club ID
export const selectUserHomeGroup = createSelector(
  [selectGroupData, selectUserState],
  (groupsDictionary, userData) => {
    const homeGroupId = userData.accountData?.activeGroup;
    return homeGroupId ? groupsDictionary[homeGroupId] : null;
  },
);
