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

export const selectGroupData = createSelector(
  selectGroupState,
  (groupData) => groupData.data
);
