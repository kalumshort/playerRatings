import { createSelector } from "@reduxjs/toolkit";

const selectPredictions = (state) => state.predictions;

export const selectPredictionsByMatchId = (id) =>
  createSelector(
    [selectPredictions],
    (predictionsState) => predictionsState[id] || {}
  );
