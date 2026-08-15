"use client";

import React from "react";
import { Box, Stack } from "@mui/material";
import MasonryLib, { type MasonryProps } from "react-masonry-css";

import FixturePredictionsTab from "./Components/FixturePredictionsTab";
import LineupPredictor from "./Components/Lineup/LineupPredictor";
import Lineup from "./Components/Lineup/Lineup";
import PlayerRatings from "./Components/PlayerRatings/PlayerRatings";
import { MoodSelector } from "./Components/FanMoodSelector/MoodSelector";
import Statistics from "./Components/Statistics";
import Events from "./Components/Events";
import { useClubView } from "@/context/ClubViewProvider";
import { isArchivedSeason } from "@/lib/config/season";
import LineupPredictorResults from "./Components/Lineup/LineupPredictorResults";
import FixtureUnavailable from "./FixtureUnavailable";

interface DesktopFixtureHubProps {
  fixture: any;
  showPredictions: boolean;
  currentYear: string;
  groupId: string;
  groupData: any;
}

const GAP = 24; // px — matches MUI spacing(3)

// react-masonry-css@1.0.16 ships its own index.d.ts declaring
// `render(): JSX.Element`. React 19's types require ReactNode there, so tsc
// rejects it as a JSX component even though the runtime component is fine.
// Re-typing the import is contained; patching the dependency is not.
const Masonry = MasonryLib as unknown as React.ComponentType<
  MasonryProps & { children?: React.ReactNode }
>;

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
  // Archived seasons are read-only. The interactive children below already model
  // "can't interact" as isGuestView, so reuse that switch rather than a parallel one.
  // currentYear is resolved server-side, so this is right on the first render.
  const { isGuestView: isGuest } = useClubView();
  const isGuestView = isGuest || isArchivedSeason(currentYear);

  const status = fixture?.fixture?.status?.short;
  const isPreMatch = ["NS", "TBD"].includes(status);
  const isLive = ["1H", "HT", "2H", "ET", "P"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status);
  const hasLineups = !!(fixture?.lineups && fixture.lineups.length > 0);

  // Postponed / cancelled / abandoned / awarded / walkover have no interactive
  // content — say so rather than rendering an empty page under the header.
  if (!isPreMatch && !isLive && !isFinished) {
    return <FixtureUnavailable status={status} />;
  }

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
