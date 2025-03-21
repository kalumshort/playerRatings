import { createSelector } from "@reduxjs/toolkit";

export const selectSquadData = (state) => state.teamSquads?.[33]?.activeSquad;

export const selectSquadDataObject = (state) =>
  state.teamSquads?.squads[33]?.activeSquad?.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {}) || {};

export const selectSquadLoad = (state) => ({
  squadLoaded: state.teamSquads.loaded,
  squadError: state.teamSquads.error,
  squadLoading: state.teamSquads.loading,
});

export const selectSquadPlayerById = (id) =>
  createSelector([selectSquadDataObject], (squadState) => squadState[id]);
