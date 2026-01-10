import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFixtures, fetchTeamSquad } from "./Fixtures_Hooks";

export const useDataManager = () => {
  const dispatch = useDispatch();

  // 1. GET CONTEXT
  // We look at the 'activeGroupId' to decide what data we need.
  const activeGroupId = useSelector((state) => state.groupData.activeGroupId);
  const groups = useSelector((state) => state.groupData.byGroupId);
  const currentYear = useSelector((state) => state.globalData.currentYear);

  // Derive the active group object safely
  const activeGroup = groups[activeGroupId];
  const clubId = activeGroup?.groupClubId; // Assuming your group object has 'groupClubId'

  // 2. CHECK CACHE (The "Smart" Part)
  // We check our new "Buckets" to see if data exists for this specific club/year
  const fixturesCached = useSelector(
    (state) => state.fixtures.byClubId[clubId]?.[currentYear]
  );

  const squadCached = useSelector(
    (state) => state.teamSquads.byClubId[clubId]?.[currentYear]
  );

  // 3. FETCH EFFECT
  useEffect(() => {
    if (!clubId || !currentYear) return;

    // A. FETCH FIXTURES
    if (!fixturesCached) {
      console.log(
        `[Data Manager] 📥 Fetching Fixtures: Club ${clubId}, Year ${currentYear}`
      );
      // NOTE: Ensure your 'fetchFixtures' thunk dispatches 'fetchFixturesSuccess' with { clubId, year, fixtures }
      dispatch(fetchFixtures({ clubId, currentYear }));
    } else {
      console.log(`[Data Manager] ✅ Fixtures cached for Club ${clubId}`);
    }

    // B. FETCH SQUAD
    if (!squadCached) {
      console.log(
        `[Data Manager] 📥 Fetching Squad: Club ${clubId}, Year ${currentYear}`
      );
      dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
    } else {
      console.log(`[Data Manager] ✅ Squad cached for Club ${clubId}`);
    }
  }, [clubId, currentYear, fixturesCached, squadCached, dispatch]);

  return {
    isLoading: (!fixturesCached || !squadCached) && !!clubId,
  };
};
