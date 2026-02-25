import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Group } from "../slices/groupSlice";

const selectFixturesSlice = (state: RootState) => state.fixtures;
const selectGroupData = (state: RootState) => state.groupData;
const selectGlobalData = (state: RootState) => state.globalData;

export const selectFixturesLoading = createSelector(
  [selectFixturesSlice],
  (slice) => slice.loading,
);

// --- Context Helper ---
const selectActiveContext = createSelector(
  [selectGroupData, selectGlobalData],
  (groupData, globalData) => {
    const activeGroupId = groupData.activeGroupId;

    // Explicitly cast the result to Group
    // This tells TS: "I know this is a full Group object from our interface"
    const activeGroup = activeGroupId
      ? (groupData.byGroupId[activeGroupId] as Group)
      : undefined;

    return {
      clubId: activeGroup?.groupClubId, // The error will disappear here
      year: globalData.currentYear,
    };
  },
);

// --- Main Data Selector ---
export const selectActiveClubFixtures = createSelector(
  [selectFixturesSlice, selectActiveContext],
  (fixturesSlice, { clubId, year }) => {
    if (!clubId || !year) return [];
    return fixturesSlice.byClubId[clubId]?.[year] || [];
  },
);

// --- Derived Time-based Selectors ---
export const selectPreviousFixtures = createSelector(
  [selectActiveClubFixtures],
  (fixtures) =>
    [...fixtures]
      .filter((f) => f.fixture?.timestamp < Math.floor(Date.now() / 1000))
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp),
);

export const selectUpcomingFixtures = createSelector(
  [selectActiveClubFixtures],
  (fixtures) =>
    [...fixtures]
      .filter((f) => f.fixture?.timestamp > Math.floor(Date.now() / 1000))
      .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp),
);

export const selectLatestFixture = createSelector(
  [selectPreviousFixtures, selectUpcomingFixtures],
  (previous, upcoming) => {
    if (previous.length > 0) {
      const lastMatchTime = previous[0].fixture.timestamp * 1000;
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
      // Show last match if played within 24h, otherwise show next
      return lastMatchTime < twentyFourHoursAgo
        ? upcoming[0] || null
        : previous[0];
    }
    return upcoming[0] || null;
  },
);

export const selectFixtureById = createSelector(
  [selectActiveClubFixtures, (_, fixtureId: string | number) => fixtureId],
  (fixtures, fixtureId) =>
    fixtures.find((f) => String(f.id) === String(fixtureId)) || null,
);
