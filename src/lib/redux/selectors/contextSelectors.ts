import { RootState } from "../store";
import { Group } from "../slices/groupSlice";

/**
 * The active club + season, as plain scalar accessors.
 *
 * This lived as a duplicated `selectActiveContext` in both fixturesSelectors
 * and squadSelectors — each memoized on the whole `groupData` and `globalData`
 * slices and returning a fresh `{ clubId, year }`, so any write to either slice
 * invalidated every downstream selector that used it.
 *
 * Scalars need no createSelector: they already return primitives, which are
 * reference-stable by definition. Kept in their own module so
 * fixturesSelectors and squadSelectors don't have to import from each other.
 */
export const selectActiveClubId = (state: RootState) => {
  const activeGroupId = state.groupData.activeGroupId;
  if (!activeGroupId) return undefined;
  return (state.groupData.byGroupId[activeGroupId] as Group | undefined)
    ?.groupClubId;
};

export const selectCurrentYear = (state: RootState) =>
  state.globalData.currentYear;
