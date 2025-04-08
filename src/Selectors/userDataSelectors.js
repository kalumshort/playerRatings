import { createSelector } from "@reduxjs/toolkit";

// Selector to get the userData
export const selectUserData = (state) => state.userData;

export const selectUserDataData = createSelector(
  [selectUserData],
  (userData) => userData.data // Return the actual user data
);
