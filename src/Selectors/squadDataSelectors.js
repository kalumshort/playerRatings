import { createSelector } from "@reduxjs/toolkit";
import { slugToClub } from "../Hooks/Helper_Functions";

// 1. Core Helper: Prioritizes URL slug, falls back to User state
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

// 2. Full Squad Array (Active)
export const selectSquadData = (state, clubSlug = null) => {
  const teamId = getActiveTeamId(state, clubSlug);
  if (!teamId) return [];
  return state.teamSquads?.squads?.[teamId]?.activeSquad || [];
};

// 3. Full Season Squad Array (Historical/All Players)
export const selectSeasonSquadData = (state, clubSlug = null) => {
  const teamId = getActiveTeamId(state, clubSlug); // Updated to use clubSlug
  if (!teamId) return [];
  return state.teamSquads?.squads?.[teamId]?.seasonSquad || [];
};

// 4. Squad Object (Active)
export const selectSquadDataObject = (state, clubSlug = null) => {
  const squad = selectSquadData(state, clubSlug);
  if (!squad || squad.length === 0) return {};

  return squad.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {});
};

// 5. Season Squad Object (All Players)
export const selectSeasonSquadDataObject = (state, clubSlug = null) => {
  const squad = selectSeasonSquadData(state, clubSlug); // Pass slug context
  if (!squad || squad.length === 0) return {};

  return squad.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {});
};

// 6. Metadata Selectors (Remain Global)
export const selectSquadLoad = (state) => ({
  squadLoaded: state.teamSquads.loaded,
  squadError: state.teamSquads.error,
  squadLoading: state.teamSquads.loading,
});

// 7. Factory Selector for Individual Players
// This now requires both the playerId and the optional clubSlug
export const selectSquadPlayerById = (id, clubSlug = null) =>
  createSelector(
    [(state) => selectSeasonSquadDataObject(state, clubSlug)],
    (squadState) => squadState[id] || null
  );
