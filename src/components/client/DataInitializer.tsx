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
      console.log(`[Data] 📥 Fetching Fixtures: ${clubId} (${currentYear})`);
      dispatch(fetchFixtures({ clubId, currentYear }));
    }

    if (!hasSquad) {
      console.log(`[Data] 📥 Fetching Squad: ${clubId} (${currentYear})`);
      dispatch(fetchTeamSquad({ squadId: clubId, currentYear }));
    }

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
