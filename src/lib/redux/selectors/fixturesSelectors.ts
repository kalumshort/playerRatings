import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { selectActiveClubId, selectCurrentYear } from "./contextSelectors";

const selectFixturesSlice = (state: RootState) => state.fixtures;

export const selectFixturesLoading = createSelector(
  [selectFixturesSlice],
  (slice) => slice.loading,
);

export const selectFixturesLoaded = createSelector(
  [selectFixturesSlice],
  (slice) => slice.loaded,
);

// --- Main Data Selector ---
export const selectActiveClubFixtures = createSelector(
  [selectFixturesSlice, selectActiveClubId, selectCurrentYear],
  (fixturesSlice, clubId, year) => {
    if (!clubId || !year) return [];
    return fixturesSlice.byClubId[clubId]?.[year] || [];
  },
);

/**
 * Whether fixtures for the CURRENT club+season have actually been fetched.
 *
 * The global `loading`/`loaded` flags can't answer this: right after a season
 * switch `loaded` is still true from the previous season while the new bucket
 * is absent, so consumers rendered "no data" instead of a skeleton.
 * `selectActiveClubFixtures` collapses both cases to `[]`, so check for the
 * bucket itself.
 */
export const selectActiveClubFixturesLoaded = createSelector(
  [selectFixturesSlice, selectActiveClubId, selectCurrentYear],
  (fixturesSlice, clubId, year) =>
    Boolean(clubId && year && fixturesSlice.byClubId[clubId]?.[year]),
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
