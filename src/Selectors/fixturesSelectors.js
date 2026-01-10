import { createSelector } from "@reduxjs/toolkit";

// --- 1. SLICE ACCESSORS ---
const selectFixturesSlice = (state) => state.fixtures;
const selectGroupData = (state) => state.groupData;
const selectGlobalData = (state) => state.globalData;

// --- 2. GLOBAL STATUS SELECTORS ---
export const selectFixturesLoading = createSelector(
  [selectFixturesSlice],
  (slice) => slice.loading || false
);

export const selectFixturesError = createSelector(
  [selectFixturesSlice],
  (slice) => slice.error || null
);

// --- 3. CONTEXT HELPER (Finds "Which Club are we looking at?") ---
const selectActiveContext = createSelector(
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

// --- 4. MAIN DATA SELECTOR (The "Bucket" Finder) ---
// Returns the specific array of fixtures for the CURRENT active group/year
export const selectActiveClubFixtures = createSelector(
  [selectFixturesSlice, selectActiveContext],
  (fixturesSlice, { clubId, year }) => {
    if (!clubId || !year) return [];

    // Look up the specific bucket: byClubId -> [clubId] -> [year]
    const bucket = fixturesSlice.byClubId[clubId]?.[year];

    return bucket || []; // Return empty array if not found (loading/error)
  }
);

// --- 5. LEGACY LOAD CHECKER ---
// Replaces your old 'loaded' check.
// True if the specific bucket exists (even if empty), False if we haven't fetched yet.
export const selectFixturesLoad = createSelector(
  [selectFixturesSlice, selectActiveContext],
  (slice, { clubId, year }) => {
    // Check if we have data specifically for this club/year
    const isLoaded = !!slice.byClubId[clubId]?.[year];

    return {
      fixturesLoaded: isLoaded,
      fixturesError: slice.error,
      fixturesLoading: slice.loading,
    };
  }
);

// --- 6. DERIVED LISTS (Previous / Upcoming) ---
// These now rely on 'selectActiveClubFixtures' instead of the raw state

export const selectPreviousFixtures = createSelector(
  [selectActiveClubFixtures],
  (fixtures) =>
    fixtures
      .filter(
        (fixture) => fixture.fixture.timestamp < Math.floor(Date.now() / 1000)
      )
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
);

export const selectUpcomingFixtures = createSelector(
  [selectActiveClubFixtures],
  (fixtures) =>
    fixtures
      .filter(
        (fixture) => fixture.fixture.timestamp > Math.floor(Date.now() / 1000)
      )
      .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
);

// --- 7. LOGIC SELECTORS (Latest Match) ---

export const selectLatestFixture = createSelector(
  [selectPreviousFixtures, selectUpcomingFixtures],
  (previousFixtures, upcomingFixtures) => {
    if (previousFixtures.length > 0) {
      const firstPreviousFixtureTime =
        previousFixtures[0].fixture.timestamp * 1000;
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

      // If the last match was < 24h ago, show it. Otherwise show next match.
      return firstPreviousFixtureTime < twentyFourHoursAgo
        ? upcomingFixtures[0] || null
        : previousFixtures[0];
    }
    return upcomingFixtures[0] || null;
  }
);

// --- 8. SPECIFIC ITEM LOOKUP ---
// Searches within the ACTIVE context.
export const selectFixtureById = (id) =>
  createSelector(
    [selectActiveClubFixtures],
    (fixtures) =>
      fixtures.find((fixture) => String(fixture.id) === String(id)) || null
  );
