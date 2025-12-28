import { createSelector } from "@reduxjs/toolkit";
import { slugToClub } from "../Hooks/Helper_Functions";

// Helper to get current teamId
// 1. Improved Helper: Now handles slugs for guests
const getActiveTeamId = (state, clubSlug = null) => {
  // Priority 1: URL Context (Public/Guest view)
  if (clubSlug && slugToClub[clubSlug]) {
    return slugToClub[clubSlug].teamId;
  }

  // Priority 2: User Preference (Private view on base domain)
  const activeGroupId = state.userData?.accountData?.activeGroup;
  const groupClubId = state.groupData?.data?.[activeGroupId]?.groupClubId;

  return groupClubId || null;
};

// Selector for full squad array
export const selectSquadData = (state, clubSlug = null) => {
  const teamId = getActiveTeamId(state, clubSlug);

  if (!teamId) return [];
  return state.teamSquads?.squads?.[teamId]?.activeSquad || [];
};
export const selectSeasonSquadData = (state) => {
  const teamId = getActiveTeamId(state);

  return state.teamSquads?.squads?.[teamId]?.seasonSquad;
};

// Selector for squad as object keyed by player ID
export const selectSquadDataObject = (state, clubSlug = null) => {
  const squad = selectSquadData(state, clubSlug);

  if (!squad || squad.length === 0) return {};

  return squad.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {});
};
export const selectSeasonSquadDataObject = (state) => {
  const squad = selectSeasonSquadData(state);

  return squad?.reduce((acc, player) => {
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
  createSelector([selectSeasonSquadDataObject], (squadState) => squadState[id]);
