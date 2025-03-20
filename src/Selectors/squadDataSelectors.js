import { createSelector } from "@reduxjs/toolkit";

export const selectSquadData = (state) => state.teamSquads?.[33]?.activeSquad;

export const selectSquadDataObject = (state) =>
  state.teamSquads?.[33]?.activeSquad?.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {}) || {};

export const selectSquadPlayerById = (id) =>
  createSelector([selectSquadDataObject], (squadState) => squadState[id]);
