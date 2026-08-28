import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

const selectPredictionsSlice = (state: RootState) => state.predictions;
const selectActiveGroupId = (state: RootState) => state.groupData.activeGroupId;

export const selectPredictionsLoad = createSelector(
  [selectPredictionsSlice],
  (slice) => ({
    predictionsLoaded: !slice.loading,
    predictionsError: slice.error,
    predictionsLoading: slice.loading,
  }),
);

// CONTEXT AWARE SELECTOR
export const selectPredictionByMatchId = createSelector(
  [
    selectPredictionsSlice,
    selectActiveGroupId,
    (state: RootState, matchId: string) => matchId,
  ],
  (predictionsState, activeGroupId, matchId) => {
    if (!activeGroupId || !matchId) return {};
    return predictionsState.byGroupId[activeGroupId]?.[matchId] || {};
  },
);
