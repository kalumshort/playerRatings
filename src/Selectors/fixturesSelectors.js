import { createSelector } from "@reduxjs/toolkit";

// Selector to retrieve the loading status (if applicable)
export const selectFixturesLoading = (state) =>
  state.fixtures?.loading || false;

// Selector to retrieve error status (if applicable)
export const selectFixturesError = (state) => state.fixtures?.error || null;

// Base selector to access the fixtures state
const selectFixtures = (state) => state.fixtures;

export const selectFixturesState = createSelector(
  (state) => state.fixtures, // Input selector
  (fixturesState) => fixturesState // Output mapping
);

// Selector for previousFixtures
export const selectPreviousFixtures = createSelector(
  [selectFixtures],
  (fixturesState) =>
    fixturesState.fixtures
      .filter(
        (fixture) => fixture.fixture.timestamp < Math.floor(Date.now() / 1000)
      )
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
);

// Selector for upcomingFixtures
export const selectUpcomingFixtures = createSelector(
  [selectFixtures],
  (fixturesState) =>
    fixturesState.fixtures
      .filter(
        (fixture) => fixture.fixture.timestamp > Math.floor(Date.now() / 1000)
      )
      .sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)
);

// Selector for latestFixture
export const selectLatestFixture = createSelector(
  [selectPreviousFixtures, selectUpcomingFixtures],
  (previousFixtures, upcomingFixtures) => {
    if (previousFixtures.length > 0) {
      const firstPreviousFixtureTime =
        previousFixtures[0].fixture.timestamp * 1000;
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

      return firstPreviousFixtureTime < twentyFourHoursAgo
        ? upcomingFixtures[0] || null
        : previousFixtures[0];
    }
    return upcomingFixtures[0] || null;
  }
);

export const selectFixtureById = (id) =>
  createSelector(
    [selectFixtures],
    (fixturesState) =>
      fixturesState.fixtures.find((fixture) => fixture.id === id) || null
  );
