"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux"; // Added useSelector
import { Box, useMediaQuery, useTheme } from "@mui/material";

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
import DesktopFixtureHub from "./DesktopFixtureHub";
import { GroupPredictionsListener } from "../Listeners/GroupPredictionsListener";
import { GroupRatingsListener } from "../Listeners/GroupRatingsListener";
import { selectFixtureById } from "@/lib/redux/selectors/fixturesSelectors";
import { isFinished, isLive } from "@/lib/utils/football-logic";

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
  const theme = useTheme();

  // Matches the `md` breakpoint the previous display:none switch used.
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  // Ratings only exist from 80' onwards, so a pre-match or postponed page has
  // no reason to hold two idle subscriptions open.
  const showRatings = isLive(fixture) || isFinished(fixture);

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
      {showRatings && (
        <GroupRatingsListener
          groupId={groupId}
          matchId={matchId}
          currentYear={currentYear}
        />
      )}
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

        {/*
          Two phases, because three things are in tension: the right layout must
          paint before JS runs, the content must exist in the SSR HTML (fixture
          pages are in the sitemap), and only one layout should stay mounted.

          Before hydration we emit both and let the CSS media query pick — the
          original behaviour, correct on first paint and fully server-rendered.
          Once mounted we drop to a single tree, so a phone no longer keeps the
          whole desktop hub alive (recharts, masonry, framer-motion, and a
          second onSnapshot on the same mood doc) and re-renders it on every
          Redux tick.
        */}
        {!mounted || isDesktop ? (
          <Box
            sx={{ display: mounted ? "block" : { xs: "none", md: "block" }, px: 2 }}
          >
            <DesktopFixtureHub
              fixture={fixture}
              showPredictions={showPredictions}
              groupId={groupId}
              currentYear={currentYear}
              groupData={group}
            />
          </Box>
        ) : null}

        {!mounted || !isDesktop ? (
          <Box sx={{ display: mounted ? "block" : { xs: "block", md: "none" } }}>
            <MobileFixtureContainer
              fixture={fixture}
              showPredictions={showPredictions}
              groupId={groupId}
              currentYear={currentYear}
              groupData={group}
            />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
