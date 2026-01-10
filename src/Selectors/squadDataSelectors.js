import { createSelector } from "@reduxjs/toolkit";

// --- 1. SLICE ACCESSORS ---
const selectTeamSquadsSlice = (state) => state.teamSquads;
const selectGroupData = (state) => state.groupData;
const selectGlobalData = (state) => state.globalData;

// --- 2. CONTEXT HELPER (Finds "Which Club/Year are we looking at?") ---
const selectActiveSquadContext = createSelector(
  [selectGroupData, selectGlobalData],
  (groupData, globalData) => {
    const activeGroupId = groupData.activeGroupId;
    const activeGroup = groupData.byGroupId[activeGroupId];
    return {
      clubId: activeGroup?.groupClubId,
      year: globalData.currentYear,
    };
  }
);

// --- 3. ROOT BUCKET SELECTOR ---
// Retrieves the specific squad object for the current context
// Returns: { activeSquad: [], seasonSquad: [], lastUpdated: ... }
const selectActiveClubSquadBucket = createSelector(
  [selectTeamSquadsSlice, selectActiveSquadContext],
  (squadsSlice, { clubId, year }) => {
    if (!clubId || !year) return null;
    return squadsSlice.byClubId[clubId]?.[year] || null;
  }
);

// --- 4. DATA SELECTORS (The ones you use in components) ---

// Returns the "Active Squad" (Current players)
export const selectSquadData = createSelector(
  [selectActiveClubSquadBucket],
  (bucket) => bucket?.activeSquad || []
);

// Returns the "Season Squad" (All players including transferred)
export const selectSeasonSquadData = createSelector(
  [selectActiveClubSquadBucket],
  (bucket) => bucket?.seasonSquad || []
);

// Returns Active Squad as a Dictionary { [id]: player }
export const selectSquadDataObject = createSelector(
  [selectSquadData],
  (squadArray) => {
    return squadArray.reduce((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});
  }
);

// Returns Season Squad as a Dictionary { [id]: player }
export const selectSeasonSquadDataObject = createSelector(
  [selectSeasonSquadData],
  (squadArray) => {
    return squadArray.reduce((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});
  }
);

// --- 5. LOADING STATE SELECTOR ---
export const selectSquadLoad = createSelector(
  [selectTeamSquadsSlice, selectActiveClubSquadBucket],
  (slice, bucket) => {
    // We consider it "loaded" if the specific bucket exists
    const isLoaded = !!bucket;

    return {
      squadLoaded: isLoaded,
      squadError: slice.error,
      squadLoading: slice.loading,
    };
  }
);

// --- 6. INDIVIDUAL PLAYER SELECTOR ---
// Note: This is a "Selector Factory". Call it like: useSelector(selectSquadPlayerById(123))
export const selectSquadPlayerById = (playerId) =>
  createSelector(
    [selectSeasonSquadDataObject],
    (squadObj) => squadObj[playerId] || null
  );
