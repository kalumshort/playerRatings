import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

const selectSquadSlice = (state: RootState) => state.teamSquads;
const selectGroupData = (state: RootState) => state.groupData;
const selectGlobalData = (state: RootState) => state.globalData;

// --- Context Helper ---
const selectActiveContext = createSelector(
  [selectGroupData, selectGlobalData],
  (groupData, globalData) => {
    const activeGroup = groupData.activeGroupId
      ? groupData.byGroupId[groupData.activeGroupId]
      : null;
    return {
      clubId: activeGroup?.groupClubId,
      year: globalData.currentYear,
    };
  },
);

// --- Main Squad Selector ---
export const selectActiveSquadData = createSelector(
  [selectSquadSlice, selectActiveContext],
  (squadSlice, { clubId, year }) => {
    if (!clubId || !year) return null;
    return squadSlice.byClubId[clubId]?.[year] || null;
  },
);
export const selectSeasonSquadData = createSelector(
  [selectSquadSlice, selectActiveContext],
  (squadSlice, { clubId, year }) => {
    if (!clubId || !year) return null;
    return squadSlice.byClubId[clubId]?.[year].seasonSquad.reduce(
      (acc: Record<string, any>, player: any) => {
        // We force the ID to a string for consistent object key access
        acc[String(player.id)] = player;
        return acc;
      },
      {},
    );
  },
);

export const selectActiveSquadList = createSelector(
  [selectActiveSquadData],
  (squadData) => squadData?.activeSquad || [],
);

// Returns Season Squad as a Dictionary { [id]: player }
export const selectSeasonSquadDataObject = createSelector(
  [selectActiveSquadList],
  (squadList) => {
    if (!squadList || !Array.isArray(squadList)) return {};

    return squadList.reduce((acc: Record<string, any>, player) => {
      // Use player.id or player.playerId depending on your Firestore schema
      const id = player.id || player.playerId;
      if (id) {
        acc[id] = player;
      }
      return acc;
    }, {});
  },
);

export const selectSquadLoading = createSelector(
  [selectSquadSlice],
  (slice) => slice.loading,
);

// 1. Basic input selector to get the raw squad array
const selectRawSquad = (
  state: RootState,
  clubId: string | number,
  year: string,
) => state.teamSquads.byClubId[String(clubId)]?.[year]?.activeSquad;

/**
 * Transforms the activeSquad array into an object keyed by playerId.
 * Example: { "50132": { name: "A. Bayındır", ... }, "2931": { ... } }
 */
export const selectActiveSquadMapped = createSelector(
  [selectRawSquad],
  (activeSquad) => {
    if (!activeSquad || !Array.isArray(activeSquad)) return {};

    return activeSquad.reduce((acc: Record<string, any>, player: any) => {
      // We force the ID to a string for consistent object key access
      acc[String(player.id)] = player;
      return acc;
    }, {});
  },
);
