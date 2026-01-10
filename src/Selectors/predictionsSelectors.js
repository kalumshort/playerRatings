import { createSelector } from "@reduxjs/toolkit";

// --- 1. SLICE ACCESSORS ---
const selectPredictionsSlice = (state) => state.predictions;
const selectActiveGroupId = (state) => state.groupData.activeGroupId;

// --- 2. LOADING STATE SELECTORS ---
export const selectPredictionsLoad = createSelector(
  [selectPredictionsSlice],
  (slice) => ({
    predictionsLoaded: !slice.loading, // Derived loaded state
    predictionsError: slice.error,
    predictionsLoading: slice.loading,
  })
);

// --- 3. CONTEXT AWARE SELECTOR ---
// This selector automatically finds the prediction for a specific match
// inside the CURRENT active group.
export const selectPredictionsByMatchId = (matchId) =>
  createSelector(
    [selectPredictionsSlice, selectActiveGroupId],
    (predictionsState, activeGroupId) => {
      if (!activeGroupId || !matchId) return {};

      // 1. Find the bucket for the active group
      const groupPredictions = predictionsState.byGroupId[activeGroupId];

      // 2. Return the specific match data or empty object
      return groupPredictions?.[matchId] || {};
    }
  );
