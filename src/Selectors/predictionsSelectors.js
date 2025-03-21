import { createSelector } from "@reduxjs/toolkit";

const selectPredictions = (state) => state.predictions;

export const selectPredictionsLoad = (state) => ({
  predictionsLoaded: state.predictions.loaded,
  predictionsError: state.predictions.error,
  predictionsLoading: state.predictions.loading,
});

export const selectPredictionsByMatchId = (id) =>
  createSelector(
    [selectPredictions],
    (predictionsState) => predictionsState.matches[id] || {}
  );
