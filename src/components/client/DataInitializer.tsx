"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState, AppDispatch } from "@/lib/redux/store";
import { fetchFixtures } from "@/lib/redux/slices/fixturesSlice";
import { fetchTeamSquad } from "@/lib/redux/slices/squadSlice";
import { fetchAllPlayersSeasonOverallRating } from "@/lib/redux/actions/ratingsActions";

interface DataInitializerProps {
  clubId: string;
  currentYear: string;
  groupId?: string;
}

export default function DataInitializer({
  clubId,
  currentYear,
  groupId,
}: DataInitializerProps) {
  const dispatch = useDispatch<AppDispatch>();

  // 1. Guarded selectors: Ensure we don't try to access nested state if IDs are missing
  const hasFixtures = useSelector(
    (state: RootState) =>
      clubId && currentYear && !!state.fixtures.byClubId[clubId]?.[currentYear],
  );
  const hasSquad = useSelector(
    (state: RootState) =>
      clubId &&
      currentYear &&
      !!state.teamSquads.byClubId[clubId]?.[currentYear],
  );
  const hasSeasonRatings = useSelector((state: RootState) =>
    groupId && currentYear
      ? !!state.playerRatings.byGroupId[groupId]?.players
      : false,
  );

  useEffect(() => {
    // 2. Strict Guard: Stop if critical path variables are missing
    // This prevents dispatching actions with 'undefined' IDs during hydration
    if (!clubId || !currentYear) {
      console.warn(
        "[DataInitializer] Skipping: Missing clubId or currentYear",
        { clubId, currentYear },
      );
      return;
    }

    // 3. Fetch Fixtures
    if (!hasFixtures) {
      console.log(
        `[Data] 📥 Fetching Fixtures for: ${clubId} (${currentYear})`,
      );
      dispatch(fetchFixtures({ clubId, currentYear }));
    }

    // 4. Fetch Squad
    if (!hasSquad) {
      console.log(`[Data] 📥 Fetching Squad for: ${clubId} (${currentYear})`);
      dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
    }

    // 5. Fetch Ratings (Only if groupId exists)
    if (groupId && !hasSeasonRatings) {
      console.log(`[Data] 📥 Fetching Season Ratings for Group: ${groupId}`);
      dispatch(fetchAllPlayersSeasonOverallRating({ groupId, currentYear }));
    }
  }, [
    clubId,
    currentYear,
    groupId,
    hasFixtures,
    hasSquad,
    hasSeasonRatings,
    dispatch,
  ]);

  return null;
}
