"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Box, Tabs, Tab, Fade, Typography } from "@mui/material";
import { PersonRounded, GroupsRounded } from "@mui/icons-material";

// TYPES
import { RootState } from "@/lib/redux/store";
import ChosenLineup from "./LineupPredictorUserSquad";
import ConsensusLineup from "./LineupPredictorConsensusLineup";
import { selectActiveSquadMapped } from "@/lib/redux/selectors/squadSelectors";
import { CommunityTeamStats } from "./LineupPredictorPlayerData";

interface LineupTabsProps {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
  isGuestView: any;
}

export default function LineupPredictorResults({
  fixture,
  groupId,
  currentYear,
  groupData,
  isGuestView,
}: LineupTabsProps) {
  const [activeTab, setActiveTab] = useState(isGuestView ? 1 : 0);
  const matchId = String(fixture.id);

  // SELECTORS
  const squadData = useSelector((state: RootState) =>
    selectActiveSquadMapped(state, groupData.groupClubId, currentYear),
  );

  const userPrediction = useSelector(
    (state: RootState) => state.userData?.matches?.[matchId],
  );

  const matchPredictions = useSelector(
    (state: RootState) => state.predictions.byGroupId[groupId]?.[matchId],
  );

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mb: 4 }}>
      {/* --- CONDITIONAL TABS --- */}
      {/* No wrapper Paper here: MuiTabs already draws its own track (sunken
          fill, hairline, pill radius). The 24px-rounded Paper that used to sit
          around it clipped that track into square-looking corners. */}
      {!isGuestView && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab
            icon={<PersonRounded fontSize="small" />}
            iconPosition="start"
            label="My XI"
          />
          <Tab
            icon={<GroupsRounded fontSize="small" />}
            iconPosition="start"
            label="Group XI"
          />
          <Tab
            icon={<GroupsRounded fontSize="small" />}
            iconPosition="start"
            label="Stats"
          />
        </Tabs>
      )}

      {/* --- CONTENT AREA --- */}
      <Box sx={{ position: "relative", minHeight: 400 }}>
        {/* TAB 0: USER PREDICTION (Only shown if NOT a guest) */}
        {!isGuestView && activeTab === 0 && (
          <Fade in={true} timeout={400}>
            <Box>
              <ChosenLineup
                squadData={squadData}
                userPrediction={userPrediction}
                fixture={fixture}
                groupData={groupData}
                matchPredictions={matchPredictions}
              />
            </Box>
          </Fade>
        )}

        {/* TAB 1: COMMUNITY CONSENSUS (Shown for everyone) */}
        {(isGuestView || activeTab === 1) && (
          <Fade in={true} timeout={400}>
            <Box>
              {matchPredictions ? (
                <ConsensusLineup
                  matchPredictions={matchPredictions}
                  squadData={squadData}
                  groupData={groupData}
                  fixture={fixture}
                />
              ) : (
                <Box sx={{ p: 4, textAlign: "center", opacity: 0.5 }}>
                  <GroupsRounded sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2" fontWeight={700}>
                    No community data yet
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {activeTab === 2 && (
          <CommunityTeamStats
            fixture={fixture}
            groupId={groupId}
            currentYear={currentYear}
            groupData={groupData}
          />
        )}
      </Box>
    </Box>
  );
}
