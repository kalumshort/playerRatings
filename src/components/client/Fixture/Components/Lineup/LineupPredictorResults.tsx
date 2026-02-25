"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Fade,
  Typography,
  useTheme,
} from "@mui/material";
import { PersonRounded, GroupsRounded } from "@mui/icons-material";
import { useParams } from "next/navigation";

// --- CHILD COMPONENTS ---

// --- TYPES ---
import { RootState } from "@/lib/redux/store";
import ChosenLineup from "./LineupPredictorUserSquad";
import ConsensusLineup from "./LineupPredictorConsensusLineup";
import { selectActiveSquadMapped } from "@/lib/redux/selectors/squadSelectors";

interface LineupTabsProps {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
}

export default function LineupPredictorResults({
  fixture,
  groupId,
  currentYear,
  groupData,
}: LineupTabsProps) {
  const theme = useTheme() as any;
  const { clubSlug } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const matchId = String(fixture.id);

  // 1. SELECTORS (Strictly typed & safe for Next.js)
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
      {/* --- NAVIGATION TABS --- */}
      <Paper
        elevation={0}
        sx={{
          ...theme.clay?.box, // Inset "well" for the tabs
          display: "flex",
          alignItems: "center",
          borderRadius: "24px",
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
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
          <Tab
            icon={<PersonRounded fontSize="small" />}
            iconPosition="start"
            label="My XI"
            disableRipple
          />
          <Tab
            icon={<GroupsRounded fontSize="small" />}
            iconPosition="start"
            label="Group XI"
            disableRipple
          />
        </Tabs>
      </Paper>

      {/* --- TAB CONTENT AREA --- */}
      <Box sx={{ position: "relative", minHeight: 400 }}>
        {/* TAB 0: USER PREDICTION */}
        {activeTab === 0 && userPrediction && (
          <Fade in={activeTab === 0} timeout={400}>
            <Box>
              <ChosenLineup
                squadData={squadData}
                userPrediction={userPrediction}
              />
            </Box>
          </Fade>
        )}

        {/* TAB 1: COMMUNITY CONSENSUS */}
        {activeTab === 1 && (
          <Fade in={activeTab === 1} timeout={400}>
            <Box>
              {matchPredictions ? (
                <ConsensusLineup
                  matchPredictions={matchPredictions}
                  squadData={squadData}
                  groupData={groupData}
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
      </Box>
    </Box>
  );
}
