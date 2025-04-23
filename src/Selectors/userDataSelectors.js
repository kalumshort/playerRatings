import { createSelector } from "@reduxjs/toolkit";

// Selector to get the userData
export const selectUserData = (state) => state.userData;
export const selectUserMatchesData = (state) => state.userData.matches;

export const selectUserDataData = createSelector(
  [selectUserData],
  (userData) => userData.accountData // Return the actual user data
);

export const selectUserMatchData = (matchId) =>
  createSelector(
    [selectUserMatchesData],
    (matches) => matches[matchId] // Return the actual user data
  );
