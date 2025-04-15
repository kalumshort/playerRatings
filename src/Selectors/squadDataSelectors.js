import { createSelector } from "@reduxjs/toolkit";

// Helper to get current teamId
const getActiveTeamId = (state) => {
  const activeGroup = state.userData?.data?.activeGroup;
  return state.groupData?.data?.[activeGroup]?.groupClubId;
};

// Selector for full squad array
export const selectSquadData = (state) => {
  const teamId = getActiveTeamId(state);
  return state.teamSquads?.squads?.[teamId]?.activeSquad || [];
};

// Selector for squad as object keyed by player ID
export const selectSquadDataObject = (state) => {
  const squad = selectSquadData(state);
  return squad.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {});
};

export const selectSquadLoad = (state) => ({
  squadLoaded: state.teamSquads.loaded,
  squadError: state.teamSquads.error,
  squadLoading: state.teamSquads.loading,
});

export const selectSquadPlayerById = (id) =>
  createSelector([selectSquadDataObject], (squadState) => squadState[id]);
