import React, { useMemo, useState, useEffect } from "react";
import { Tabs, Tab, Box, Fade } from "@mui/material";

// Components
import ScorePrediction from "../Components/Fixtures/Fixture-Components/Predictions/ScorePrediction";
import LineupPredictor from "../Components/Fixtures/Fixture-Components/LineupPredicter/LineupPredictor";
import Statistics from "../Components/Fixtures/Fixture-Components/Statistics";
import Events from "../Components/Fixtures/Fixture-Components/Events";
import PostKickoffPredictions from "../Components/Fixtures/Fixture-Components/PostKickoffPredictions";
import Lineup from "../Components/Fixtures/Fixture-Components/Lineup";
import PlayerRatings from "../Components/Fixtures/Fixture-Components/PlayerRatings/PlayerRatings";
import WinnerPredict from "../Components/Fixtures/Fixture-Components/Predictions/WinnerPredict";
import PreMatchMOTM from "../Components/Fixtures/Fixture-Components/Predictions/PreMatchMOTM";
import { MoodSelector } from "../Components/Fixtures/Fixture-Components/MoodSelector";

export default function MobileFixtureContainer({
  fixture,
  showPredictions,
  currentYear,
  groupId,
}) {
  const isPreMatch = fixture?.fixture?.status?.short === "NS";
  const hasLineups = fixture?.lineups && fixture.lineups.length > 0;

  // 1. Memoized Tab Configuration
  const tabs = useMemo(() => {
    const arr = [];
    const status = fixture?.fixture?.status?.short;
    const isLive = ["1H", "HT", "2H", "ET", "P"].includes(status);
    const isFinished = ["FT", "AET", "PEN"].includes(status);

    // --- PRE-MATCH ---
    if (isPreMatch) {
      if (showPredictions) arr.push({ label: "Predicts", value: "Predicts" });
      if (!hasLineups && showPredictions)
        arr.push({ label: "Your XI", value: "Predict-XI" });
      if (hasLineups) arr.push({ label: "Lineup", value: "Lineup" });
    }
    // --- LIVE ---
    else if (isLive) {
      arr.push({ label: "Lineup", value: "Lineup" });
      arr.push({ label: "Pulse", value: "Pulse" });
      arr.push({ label: "Stats", value: "Stats" });
      arr.push({ label: "Events", value: "Events" });
      arr.push({ label: "Ratings", value: "Ratings" });
      arr.push({ label: "Consensus", value: "PostPredicts" });
    }
    // --- POST-MATCH ---
    else if (isFinished) {
      arr.push({ label: "Ratings", value: "Ratings" });
      arr.push({ label: "Pulse", value: "Pulse" });
      arr.push({ label: "Consensus", value: "PostPredicts" });
      arr.push({ label: "Lineup", value: "Lineup" });
      arr.push({ label: "Stats", value: "Stats" });
      arr.push({ label: "Events", value: "Events" });
    }

    return arr;
  }, [fixture, isPreMatch, showPredictions, hasLineups]);

  // 2. State Management
  const [selectedTab, setSelectedTab] = useState("");

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find((t) => t.value === selectedTab)) {
      setSelectedTab(tabs[0].value);
    }
  }, [tabs, selectedTab]);

  if (tabs.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        Match data is currently being processed...
      </Box>
    );
  }

  return (
    <>
      {/* --- STICKY CLAY NAVIGATOR --- */}
      <Box
        sx={{
          position: "sticky",
          top: 70, // Adjust based on your header height
          zIndex: 20,
          px: 1,
          pb: 1,
          // Optional: Add a subtle blur behind the floating tabs
        }}
      >
        <Box
          sx={(theme) => ({
            // The "Track" -> Pressed Groove Look
            ...theme.clay.box,
            display: "flex",
            alignItems: "center",
            p: 0.5,
            borderRadius: "24px",
            overflow: "hidden",
          })}
        >
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons={false}
            // Hide default underline
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
      </Box>

      {/* --- CONTENT AREA --- */}
      <Box sx={{ px: 1, pb: 6, minHeight: "60vh" }}>
        <Fade in={true} key={selectedTab} timeout={500}>
          <Box>
            {selectedTab === "Predicts" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <WinnerPredict fixture={fixture} />
                <ScorePrediction fixture={fixture} />
                <PreMatchMOTM fixture={fixture} />
              </Box>
            )}

            {selectedTab === "Predict-XI" && (
              <LineupPredictor fixture={fixture} />
            )}

            {selectedTab === "Lineup" && (
              // Lineup component handles its own clay container now
              <Lineup fixture={fixture} />
            )}

            {selectedTab === "Ratings" && <PlayerRatings fixture={fixture} />}

            {selectedTab === "Pulse" && (
              <MoodSelector
                fixture={fixture}
                groupId={groupId}
                currentYear={currentYear}
                matchId={fixture.id}
              />
            )}

            {selectedTab === "Stats" && <Statistics fixture={fixture} />}

            {selectedTab === "Events" && <Events events={fixture?.events} />}

            {selectedTab === "PostPredicts" && (
              <PostKickoffPredictions fixture={fixture} />
            )}
          </Box>
        </Fade>
      </Box>
    </>
  );
}
