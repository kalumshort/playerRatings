"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";

import { RootState, AppDispatch } from "@/lib/redux/store";
import { fetchFixtures } from "@/lib/redux/slices/fixturesSlice";
import { fetchTeamSquad } from "@/lib/redux/slices/squadSlice";
import { fetchAllPlayersSeasonOverallRating } from "@/lib/redux/actions/ratingsActions";
import { setCurrentYear } from "@/lib/redux/slices/globalSlice";
import { resolveSeason } from "@/lib/config/season";

interface DataInitializerProps {
  clubId: string;
  groupId?: string;
}

export default function DataInitializer({
  clubId,
  groupId,
}: DataInitializerProps) {
  const dispatch = useDispatch<AppDispatch>();

  // The single client-side reader of ?season=. Layouts don't get searchParams, so
  // this component owns it and mirrors the result into Redux for everything else.
  // It renders null, so the Suspense boundary it needs costs nothing.
  const searchParams = useSearchParams();
  const currentYear = resolveSeason(searchParams.get("season"));

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
  const hasSeasonRatings = useSelector((state: RootState) => {
    if (!groupId || !currentYear) return false;
    const bucket = state.playerRatings.byGroupId[groupId];
    // Ratings cached for a different season must not be reused
    return !!bucket?.players && bucket.season === currentYear;
  });

  // Mirror the active season into Redux so the year-aware selectors
  // (fixturesSelectors, squadSelectors) follow the switcher.
  useEffect(() => {
    dispatch(setCurrentYear(currentYear));
  }, [currentYear, dispatch]);

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
      dispatch(fetchFixtures({ clubId, currentYear }));
    }

    // 4. Fetch Squad
    if (!hasSquad) {
      dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
    }

    // 5. Fetch Ratings (Only if groupId exists)
    if (groupId && !hasSeasonRatings) {
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
