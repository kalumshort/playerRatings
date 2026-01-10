import { createSelector } from "@reduxjs/toolkit";

export const selectGroupState = (state) => state.groupData;

export const selectGroupLoading = createSelector(
  selectGroupState,
  (groupData) => groupData.loading
);

export const selectGroupError = createSelector(
  selectGroupState,
  (groupData) => groupData.error
);

export const selectGroupLoaded = createSelector(
  selectGroupState,
  (groupData) => groupData.loaded
);

// UPDATED: Now returns the Dictionary { "groupA": {...}, "groupB": {...} }
// Renamed property access from '.data' to '.byGroupId' to match Reducer
export const selectGroupData = createSelector(
  selectGroupState,
  (groupData) => groupData.byGroupId || {}
);

// NEW: Selects the ID of the group the user is currently looking at
export const selectActiveGroupId = createSelector(
  selectGroupState,
  (groupData) => groupData.activeGroupId
);

// NEW: Convenience selector to get the Actual Object of the active group
export const selectActiveGroupData = createSelector(
  [selectGroupData, selectActiveGroupId],
  (groupsDictionary, activeId) => {
    return activeId ? groupsDictionary[activeId] : null;
  }
);
