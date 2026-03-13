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
import { useClubView } from "@/context/ClubViewProvider";

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
  const { isGuestView } = useClubView();

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

  if (tabs.length === 0) return null;

  return (
    <>
      {/* --- STICKY TAB NAVIGATOR --- */}
      <Box sx={{ position: "sticky", top: 70, zIndex: 20, px: 1, pb: 1 }}>
        <Box
          sx={(theme: any) => ({
            ...theme.clay?.box, // Safeguard for custom theme properties
            display: "flex",
            alignItems: "center",
            p: 0.5,
            backgroundColor: "background.paper", // Fallback if clay is missing
            borderRadius: "24px",
            overflow: "hidden",
          })}
        >
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            scrollButtons={false}
            TabIndicatorProps={{ style: { display: "none" } }}
            // sx={{
            //   width: "100%",
            //   "& .MuiTab-root": {
            //     borderRadius: "20px",
            //     minHeight: "40px",
            //     margin: "0 4px",
            //     transition: "0.3s",
            //     "&.Mui-selected": {
            //       backgroundColor: "primary.main",
            //       color: "white",
            //     },
            //   },
            // }}
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
              <FixturePredictionsTab
                fixture={fixture}
                groupId={groupId}
                currentYear={currentYear}
                groupData={groupData}
                isPreMatch={isPreMatch}
                isGuestView={isGuestView}
              />
            )}
          </Box>
        </Fade>
      </Box>
    </>
  );
}
