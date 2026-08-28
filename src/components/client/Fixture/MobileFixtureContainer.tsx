"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Tabs, Tab, Box, Fade, Stack } from "@mui/material";
import WinnerPredict from "./Components/WinnerPredict";
import ScorePrediction from "./Components/ScorePrediction";
import PreMatchMOTM from "./Components/PreMatchMOTM";
import LineupPredictor from "./Components/Lineup/LineupPredictor";
import Lineup from "./Components/Lineup/Lineup";
import Statistics from "./Components/Statistics";
import Events from "./Components/Events";
import { MoodSelector } from "./Components/FanMoodSelector/MoodSelector";
import PlayerRatings from "./Components/PlayerRatings/PlayerRatings";
import FixturePredictionsTab from "./Components/FixturePredictionsTab";
import MatchXpSummary from "@/components/client/Gamification/MatchXpSummary";
import { useClubView } from "@/context/ClubViewProvider";
import { isArchivedSeason } from "@/lib/config/season";
import LineupPredictorResults from "./Components/Lineup/LineupPredictorResults";
import FixtureUnavailable from "./FixtureUnavailable";

// Components (Ensure these paths match your new Next.js structure)

interface MobileFixtureContainerProps {
  fixture: any;
  showPredictions: boolean;
  currentYear: string;
  groupId: string;
  groupData: any;
}

export default function MobileFixtureContainer({
  fixture,
  showPredictions,
  currentYear,
  groupId,
  groupData,
}: MobileFixtureContainerProps) {
  // Archived seasons are read-only. The interactive children below already model
  // "can't interact" as isGuestView, so reuse that switch rather than a parallel one.
  // currentYear is resolved server-side, so this is right on the first render.
  const { isGuestView: isGuest } = useClubView();
  const isGuestView = isGuest || isArchivedSeason(currentYear);

  // 1. Match Status Helpers
  const status = fixture?.fixture?.status?.short;
  const isPreMatch = ["NS", "TBD"].includes(status);
  const isLive = ["1H", "HT", "2H", "ET", "P"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status);
  const hasLineups = !!(fixture?.lineups && fixture.lineups.length > 0);

  // 2. Memoized Tab Configuration
  const tabs = useMemo(() => {
    const arr: { label: string; value: string }[] = [];

    if (isPreMatch) {
      if (showPredictions)
        arr.push({ label: "Predictions", value: "Predicts" });
      if (!hasLineups && showPredictions)
        arr.push({ label: "Fans XI", value: "Predict-XI" });
      if (hasLineups) arr.push({ label: "Lineup", value: "Lineup" });
    } else if (isLive) {
      arr.push(
        { label: "Lineup", value: "Lineup" },
        { label: "Pulse", value: "Pulse" },
        { label: "Stats", value: "Stats" },
        { label: "Events", value: "Events" },
        { label: "Ratings", value: "Ratings" },
        { label: "Consensus", value: "PostPredicts" },
      );
    } else if (isFinished) {
      arr.push(
        { label: "Ratings", value: "Ratings" },
        { label: "Pulse", value: "Pulse" },
        { label: "Consensus", value: "PostPredicts" },
        { label: "Lineup", value: "Lineup" },
        { label: "Stats", value: "Stats" },
        { label: "Events", value: "Events" },
      );
    }

    return arr;
  }, [isPreMatch, isLive, isFinished, showPredictions, hasLineups]);

  // 3. State Management
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.value || "");

  // Sync tab if props change match status (e.g., match goes live)
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.value === selectedTab)) {
      setSelectedTab(tabs[0].value);
    }
  }, [tabs, selectedTab]);

  if (tabs.length === 0) {
    return <FixtureUnavailable status={fixture?.fixture?.status?.short} />;
  }

  return (
    <>
      {/* Collapsed by default — the checklist is eleven lines, useful on
          demand and clutter otherwise. Above the tabs so it is reachable from
          every panel rather than hiding behind one. */}
      {!isGuestView && !isPreMatch && (
        <Box sx={{ px: 1, pb: 1 }}>
          <MatchXpSummary fixture={fixture} groupData={groupData} />
        </Box>
      )}

      {/* --- STICKY TAB NAVIGATOR --- */}
      <Box sx={{ position: "sticky", top: 70, zIndex: 20, px: 1, pb: 1 }}>
        {/* MuiTabs draws its own track (sunken fill, hairline, pill radius), so
            there is no wrapper box here. The 10px-rounded clay box that used to
            wrap it re-painted the track in `paper` and clipped its corners,
            which is what squared the bar off. The track is opaque, so it still
            covers content scrolling under the sticky bar on its own. */}
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
          variant="fullWidth"
          scrollButtons={false}
          TabIndicatorProps={{ style: { display: "none" } }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              disableRipple
            />
          ))}
        </Tabs>
      </Box>

      {/* --- CONTENT AREA --- */}
      <Box
        sx={{
          px: 1,
          pb: 6,
          minHeight: "60vh",
        }}
      >
        <Fade in={true} key={selectedTab} timeout={400}>
          <Box sx={{ maxWidth: 1000, mx: "auto" }}>
            {selectedTab === "Predicts" && (
              <FixturePredictionsTab
                fixture={fixture}
                groupId={groupId}
                currentYear={currentYear}
                groupData={groupData}
                isPreMatch={isPreMatch}
                isGuestView={isGuestView}
              />
            )}

            {selectedTab === "Predict-XI" && (
              <LineupPredictor
                fixture={fixture}
                groupId={groupId}
                currentYear={currentYear}
                groupData={groupData}
                isGuestView={isGuestView}
              />
            )}

            {selectedTab === "Lineup" && (
              <Lineup
                fixture={fixture}
                groupId={groupId}
                currentYear={currentYear}
                groupData={groupData}
                isGuestView={isGuestView}
              />
            )}

            {selectedTab === "Ratings" && (
              <PlayerRatings
                fixture={fixture}
                groupId={groupId}
                currentYear={currentYear}
                groupData={groupData}
                isGuestView={isGuestView}
              />
            )}

            {selectedTab === "Pulse" && (
              <MoodSelector
                fixture={fixture}
                groupId={groupId}
                currentYear={currentYear}
                groupData={groupData}
                isGuestView={isGuestView}
              />
            )}

            {selectedTab === "Stats" && (
              <Statistics
                fixture={fixture}
                groupData={groupData}
                isGuestView={isGuestView}
              />
            )}

            {selectedTab === "Events" && (
              <Events
                events={fixture?.events}
                groupData={groupData}
                isGuestView={isGuestView}
                fixture={fixture}
                groupId={groupId}
                currentYear={currentYear}
              />
            )}

            {selectedTab === "PostPredicts" && (
              <>
                <FixturePredictionsTab
                  fixture={fixture}
                  groupId={groupId}
                  currentYear={currentYear}
                  groupData={groupData}
                  isPreMatch={isPreMatch}
                  isGuestView={isGuestView}
                />
                {/* Pass the real isGuestView. Hardcoding `true` here hid the
                    tab bar and forced the consensus branch, so a member could
                    never see their own XI once the match had started — which
                    is exactly when the prediction becomes scoreable. */}
                <LineupPredictorResults
                  fixture={fixture}
                  groupId={groupId}
                  currentYear={currentYear}
                  groupData={groupData}
                  isGuestView={isGuestView}
                />
              </>
            )}
          </Box>
        </Fade>
      </Box>
    </>
  );
}
