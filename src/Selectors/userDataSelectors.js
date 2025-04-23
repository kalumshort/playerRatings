import { createSelector } from "@reduxjs/toolkit";

// Selector to get the userData
export const selectUserData = (state) => state.userData;

export const selectUserDataData = createSelector(
  [selectUserData],
  (userData) => userData.accountData // Return the actual user data
);
