"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Box, Grid } from "@mui/material";

// Types & Selectors
import { RootState } from "@/lib/redux/store";
import LineupPredictorResults from "./LineupPredictorResults";
import EnhancedLineupPredictor from "./EnhancedLineupPredictor";

interface LineupPredictorProps {
  fixture: any;
  readOnly?: boolean;
  currentYear: string;
  groupId: string;
  groupData: any;
  isGuestView: boolean;
}

export default function LineupPredictor({
  fixture,
  readOnly,
  currentYear,
  groupId,
  groupData,
  isGuestView,
}: LineupPredictorProps) {
  const matchId = String(fixture.id);

  // 1. SELECTOR: Access saved user prediction
  const usersMatchData = useSelector(
    (state: RootState) => state.userData?.matches?.[matchId],
  );

  const storedPrediction = usersMatchData?.chosenTeam;

  // --- RENDER LOGIC ---

  // CASE A: VIEW MODE
  // Triggered if the user has already submitted a team or if the prop is forced
  if (isGuestView || storedPrediction || readOnly) {
    return (
      <Box sx={{ flexGrow: 1, mt: 2 }}>
        <Grid container spacing={4} alignItems="flex-start">
          {/* LEFT: User's Saved XI / Tabs */}
          <Grid size={{ xs: 12, md: 12 }}>
            <LineupPredictorResults
              fixture={fixture}
              groupId={groupId}
              currentYear={currentYear}
              groupData={groupData}
              isGuestView={isGuestView}
            />
          </Grid>

          {/* RIGHT: Community Consensus Stats */}
          {/* <Grid size={{ xs: 12, md: 12 }}>
            <CommunityTeamStats
              fixture={fixture}
              groupId={groupId}
              currentYear={currentYear}
              groupData={groupData}
            />
          </Grid> */}
        </Grid>
      </Box>
    );
  }

  // CASE B: PREDICT MODE
  // The heavy interactive builder
  return (
    <EnhancedLineupPredictor
      fixture={fixture}
      groupId={groupId}
      currentYear={currentYear}
      groupData={groupData}
    />
  );
}
