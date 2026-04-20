"use client";

import React from "react";
import { Box, Stack } from "@mui/material";
import Masonry from "react-masonry-css";

import FixturePredictionsTab from "./Components/FixturePredictionsTab";
import LineupPredictor from "./Components/Lineup/LineupPredictor";
import Lineup from "./Components/Lineup/Lineup";
import PlayerRatings from "./Components/PlayerRatings/PlayerRatings";
import { MoodSelector } from "./Components/FanMoodSelector/MoodSelector";
import Statistics from "./Components/Statistics";
import Events from "./Components/Events";
import { useClubView } from "@/context/ClubViewProvider";
import LineupPredictorResults from "./Components/Lineup/LineupPredictorResults";

interface DesktopFixtureHubProps {
  fixture: any;
  showPredictions: boolean;
  currentYear: string;
  groupId: string;
  groupData: any;
}

const GAP = 24; // px — matches MUI spacing(3)

const MasonryGrid: React.FC<{
  children: React.ReactNode;
  cols?: number;
}> = ({ children, cols = 2 }) => (
  <Box
    sx={{
      "& .masonry-grid": {
        display: "flex",
        marginLeft: `-${GAP}px`,
        width: "auto",
      },
      "& .masonry-grid_column": {
        paddingLeft: `${GAP}px`,
        backgroundClip: "padding-box",
      },
      "& .masonry-grid_column > *": {
        marginBottom: `${GAP}px`,
      },
    }}
  >
    <Masonry
      breakpointCols={{ default: cols, 900: 1 }}
      className="masonry-grid"
      columnClassName="masonry-grid_column"
    >
      {children}
    </Masonry>
  </Box>
);

export default function DesktopFixtureHub({
  fixture,
  showPredictions,
  currentYear,
  groupId,
  groupData,
}: DesktopFixtureHubProps) {
  const { isGuestView } = useClubView();

  const status = fixture?.fixture?.status?.short;
  const isPreMatch = ["NS", "TBD"].includes(status);
  const isLive = ["1H", "HT", "2H", "ET", "P"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status);
  const hasLineups = !!(fixture?.lineups && fixture.lineups.length > 0);

  if (!isPreMatch && !isLive && !isFinished) return null;

  const commonProps = {
    fixture,
    groupId,
    currentYear,
    groupData,
    isGuestView,
  };

  const EventsEl = (
    <Events
      events={fixture?.events}
      groupData={groupData}
      isGuestView={isGuestView}
      fixture={fixture}
      groupId={groupId}
      currentYear={currentYear}
    />
  );
  const StatsEl = (
    <Statistics
      fixture={fixture}
      groupData={groupData}
      isGuestView={isGuestView}
    />
  );
  const ConsensusEl = (
    <FixturePredictionsTab {...commonProps} isPreMatch={false} />
  );

  // --- PRE-MATCH ---
  // 70/30 split: Lineup/Predictor left (70%), Predictions right (30%).
  if (isPreMatch) {
    const showLineup = hasLineups;
    const showLineupPredictor = !hasLineups && showPredictions;
    const showPredictionsPanel = showPredictions;

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "7fr 3fr" },
          gap: 3,
          alignItems: "start",
          maxWidth: 1100,
          mx: "auto",
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          {showLineup && <Lineup {...commonProps} />}
          {showLineupPredictor && <LineupPredictor {...commonProps} />}
        </Stack>
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          {showPredictionsPanel && (
            <FixturePredictionsTab {...commonProps} isPreMatch={true} />
          )}
        </Stack>
      </Box>
    );
  }

  // --- LIVE ---
  // Round-robin with DOM order [Lineup, Mood, Stats, Events] →
  //   col1: Lineup, Stats   col2: Mood, Events
  // Consensus is a separate full-width row below.
  if (isLive) {
    return (
      <Stack spacing={4}>
        <MasonryGrid cols={2}>
          <Lineup {...commonProps} />
          <MoodSelector {...commonProps} />
          {EventsEl}
          {StatsEl}
          {ConsensusEl}
        </MasonryGrid>
      </Stack>
    );
  }

  // --- FINISHED ---
  // Round-robin with DOM order [PlayerRatings, Mood, Lineup, Events, Stats] →
  //   col1: PlayerRatings, Lineup, Stats   col2: Mood, Events
  // Consensus is a separate full-width row below.
  return (
    <Stack spacing={4}>
      <MasonryGrid cols={2}>
        <MoodSelector {...commonProps} />
        <PlayerRatings {...commonProps} />
        <Lineup {...commonProps} />

        {EventsEl}
        {StatsEl}
        <LineupPredictorResults {...commonProps} isGuestView={true} />

        {ConsensusEl}
      </MasonryGrid>
    </Stack>
  );
}
