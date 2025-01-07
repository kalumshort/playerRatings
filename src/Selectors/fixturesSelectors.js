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
  (fixturesState) => fixturesState.previousFixtures
);

// Selector for upcomingFixtures
export const selectUpcomingFixtures = createSelector(
  [selectFixtures],
  (fixturesState) => fixturesState.upcomingFixtures
);

// Selector for latestFixture
export const selectLatestFixture = createSelector(
  [selectFixtures],
  (fixturesState) => fixturesState.latestFixture
);

export const selectFixtureById = (id) =>
  createSelector(
    [selectFixtures],
    (fixturesState) =>
      fixturesState.previousFixtures.find((fixture) => fixture.id === id) ||
      fixturesState.upcomingFixtures.find((fixture) => fixture.id === id) ||
      null
  );
