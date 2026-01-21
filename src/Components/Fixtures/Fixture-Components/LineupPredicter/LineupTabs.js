import React, { useState } from "react";
import { Box, Tabs, Tab, Paper, Fade } from "@mui/material";
import { Person, Groups } from "@mui/icons-material"; // Icons for tabs
import ChosenLineup from "./chosenLineup";
import ConsensusLineup from "./ConsensusLineup";
import { useSelector } from "react-redux";
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import { selectPredictionsByMatchId } from "../../../../Selectors/predictionsSelectors";

// Import your child components

export default function LineupTabs({ fixture }) {
  const [activeTab, setActiveTab] = useState(0);
  const squadData = useSelector((state) => selectSquadDataObject(state));
  const userPrediction = useSelector(selectUserMatchData(fixture.id));
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mb: 4 }}>
      {/* --- NAVIGATION TABS --- */}
      <Paper
        elevation={0}
        sx={(theme) => ({
          ...theme.clay.box,
          display: "flex",
          alignItems: "center",
          borderRadius: "24px",
          overflow: "hidden",
          margin: "0px",
        })}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          centered
          sx={{ width: "100%" }}
        >
          <Tab
            icon={<Person fontSize="small" />}
            iconPosition="start"
            label="My XI"
          />
          <Tab
            icon={<Groups fontSize="small" />}
            iconPosition="start"
            label="Community XI"
          />
        </Tabs>
      </Paper>

      {/* TAB 0: USER PREDICTION */}
      <div role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && (
          <Fade in={activeTab === 0} timeout={500}>
            <Box>
              <ChosenLineup
                squadData={squadData}
                userPrediction={userPrediction}
                chosenTeam={userPrediction.chosenTeam} // Pass the user's specific picks
                formation={userPrediction.userFormation} // Pass the user's specific formation
              />
            </Box>
          </Fade>
        )}
      </div>

      {/* TAB 1: COMMUNITY CONSENSUS */}
      <div role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && (
          <Fade in={activeTab === 1} timeout={500}>
            <Box>
              <ConsensusLineup
                matchPredictions={matchPredictions} // Pass the raw Firestore data here
              />
            </Box>
          </Fade>
        )}
      </div>
    </Box>
  );
}
