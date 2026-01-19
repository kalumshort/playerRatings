import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFixtures, fetchTeamSquad } from "./Fixtures_Hooks";

export const useDataManager = () => {
  const dispatch = useDispatch();

  // 1. GET CONTEXT
  const activeGroupId = useSelector((state) => state.groupData.activeGroupId);
  const groups = useSelector((state) => state.groupData.byGroupId);
  const currentYear = useSelector((state) => state.globalData.currentYear);

  const activeGroup = groups[activeGroupId];
  const clubId = activeGroup?.groupClubId;

  // 2. CHECK STATUS (Optimized)
  // We use the double bang (!!) to convert data to a simple Boolean (true/false).
  // Booleans are primitives; they don't trigger re-renders like Arrays/Objects do.
  const hasFixtures = useSelector(
    (state) => !!state.fixtures.byClubId[clubId]?.[currentYear],
  );

  const hasSquad = useSelector(
    (state) => !!state.teamSquads.byClubId[clubId]?.[currentYear],
  );

  // 3. FETCH EFFECT
  useEffect(() => {
    // Safety check: ensure we have the config variables
    if (!clubId || !currentYear) return;

    // A. FETCH FIXTURES
    // Only fetch if we DO NOT have fixtures
    if (!hasFixtures) {
      console.log(
        `[Data Manager] 📥 Fetching Fixtures: Club ${clubId}, Year ${currentYear}`,
      );
      dispatch(fetchFixtures({ clubId, currentYear }));
    }
    // (Optional) Remove the "Cached" log to reduce console noise,
    // or keep it for debugging but now it will only fire once.
    else {
      // console.log(`[Data Manager] ✅ Fixtures cached for Club ${clubId}`);
    }

    // B. FETCH SQUAD
    if (!hasSquad) {
      console.log(
        `[Data Manager] 📥 Fetching Squad: Club ${clubId}, Year ${currentYear}`,
      );
      dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
    } else {
      // console.log(`[Data Manager] ✅ Squad cached for Club ${clubId}`);
    }
  }, [clubId, currentYear, hasFixtures, hasSquad, dispatch]);
  // ^^^ Now depending on stable Booleans, not constantly changing Arrays

  return {
    isLoading: (!hasFixtures || !hasSquad) && !!clubId,
  };
};
