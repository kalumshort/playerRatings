"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState, AppDispatch } from "@/lib/redux/store";
import { fetchFixtures } from "@/lib/redux/slices/fixturesSlice";
import { fetchTeamSquad } from "@/lib/redux/slices/squadSlice";
import { fetchAllPlayersSeasonOverallRating } from "@/lib/redux/actions/ratingsActions";
import { devLog } from "@/lib/utils/logger";

interface DataInitializerProps {
  clubId: string;
  currentYear: string;
  groupId?: string; // Added groupId as it's required for ratings
}

export default function DataInitializer({
  clubId,
  currentYear,
  groupId,
}: DataInitializerProps) {
  const dispatch = useDispatch<AppDispatch>();

  // 1. Optimized Boolean selectors
  const hasFixtures = useSelector(
    (state: RootState) => !!state.fixtures.byClubId[clubId]?.[currentYear],
  );
  const hasSquad = useSelector(
    (state: RootState) => !!state.teamSquads.byClubId[clubId]?.[currentYear],
  );
  const hasSeasonRatings = useSelector((state: RootState) =>
    groupId ? !!state.playerRatings.byGroupId[groupId]?.players : false,
  );

  useEffect(() => {
    if (!clubId || !currentYear) return;

    if (!hasFixtures) {
      devLog(`[Data] Fetching fixtures: ${clubId} (${currentYear})`);
      dispatch(fetchFixtures({ clubId, currentYear }));
    }

    if (!hasSquad) {
      devLog(`[Data] Fetching squad: ${clubId} (${currentYear})`);
      dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
    }

    if (groupId && !hasSeasonRatings) {
      devLog(`[Data] Fetching season ratings for group: ${groupId}`);
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
