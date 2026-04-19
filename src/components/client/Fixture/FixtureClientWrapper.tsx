"use client";

import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux"; // Added useSelector
import { Box, Stack } from "@mui/material";

import { useAuth } from "@/context/AuthContext";

// Redux Actions & Selectors
import { fetchMatchPrediction } from "@/lib/redux/slices/predictionsSlice";
import {
  fetchMatchPlayerRatingsAction,
  matchMotmVotesAction,
} from "@/lib/redux/slices/ratingsSlice";

import FixtureHeader from "./FixtureHeader/FixtureHeader";
import { FixtureListener } from "../Listeners/FixturesListener";
import { UsersMatchDataListener } from "../Listeners/UsersMatchDataListener";
import MobileFixtureContainer from "./MobileFixtureContainer";
import { GroupPredictionsListener } from "../Listeners/GroupPredictionsListener";
import { selectFixtureById } from "@/lib/redux/selectors/fixturesSelectors";

export default function FixtureClientWrapper({
  initialFixture,
  initialPredictions,
  initialRatings,
  group,
  matchId,
  currentYear,
}: any) {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const groupId = group?.id;
  const clubId = group?.groupClubId;
  const hasHydrated = useRef(false);

  // 1. SELECT LIVE DATA FROM REDUX
  // This selector will trigger a re-render only when the specific matchId data changes
  const liveFixture = useSelector((state: any) =>
    selectFixtureById(state, matchId),
  );

  // 2. DATA MERGING STRATEGY
  // Use the live fixture from Redux if it exists (real-time),
  // otherwise fallback to initialFixture (Server Side Props)
  const fixture = liveFixture || initialFixture;

  useEffect(() => {
    if (hasHydrated.current) return;

    if (initialPredictions) {
      dispatch(
        fetchMatchPrediction({ groupId, matchId, data: initialPredictions }),
      );
    }

    if (initialRatings) {
      dispatch(
        fetchMatchPlayerRatingsAction({
          groupId,
          matchId,
          data: initialRatings.players,
        }),
      );
      dispatch(
        matchMotmVotesAction({ groupId, matchId, data: initialRatings.motm }),
      );
    }

    hasHydrated.current = true;
  }, [dispatch, initialPredictions, initialRatings, groupId, matchId]);

  // Derived state based on the merged fixture
  const isPreMatch = ["NS", "TBD"].includes(fixture?.fixture?.status?.short);
  const showPredictions = isPreMatch;

  return (
    <Box sx={{ width: "100%", pb: 5 }}>
      {/* --- REAL-TIME LISTENERS --- */}
      <FixtureListener
        fixtureId={matchId}
        currentYear={currentYear}
        clubId={clubId}
      />
      <GroupPredictionsListener
        groupId={groupId}
        matchId={matchId}
        currentYear={currentYear}
      />
      {user && groupId && (
        <UsersMatchDataListener
          groupId={groupId}
          matchId={matchId}
          currentYear={currentYear}
        />
      )}

      <Box sx={{ width: "100%" }}>
        {/* 1. HEADER - Uses the live 'fixture' */}
        <Box sx={{ mb: 3 }}>
          <FixtureHeader
            fixture={fixture}
            showDetails={true}
            showScorers={true}
            addClass={"containerMargin"}
          />
        </Box>

        {/* --- DESKTOP VIEW --- */}
        <Box sx={{ display: { xs: "none", md: "block" }, px: 2 }}>
          <Stack spacing={3}>
            <MobileFixtureContainer
              fixture={fixture}
              showPredictions={showPredictions}
              groupId={groupId}
              currentYear={currentYear}
              groupData={group}
            />

            <Box sx={{ display: "flex", gap: 3 }}>
              {/* Future desktop components like Lineups/Stats go here */}
            </Box>
          </Stack>
        </Box>

        {/* --- MOBILE VIEW --- */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <MobileFixtureContainer
            fixture={fixture}
            showPredictions={showPredictions}
            groupId={groupId}
            currentYear={currentYear}
            groupData={group}
          />
        </Box>
      </Box>
    </Box>
  );
}
