import { createSelector } from "@reduxjs/toolkit";

export const selectSquadData = (state) => state.squadData;

export const selectSquadPlayerById = (id) =>
  createSelector([selectSquadData], (squadState) => squadState[id]);
