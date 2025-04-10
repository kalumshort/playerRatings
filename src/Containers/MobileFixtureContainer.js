import React, { useState } from "react";
import ScorePrediction from "../Components/Fixtures/Fixture-Components/ScorePrediction";
import PreMatchMOTM from "../Components/Fixtures/Fixture-Components/PreMatchMOTM";
import LineupPredictor from "../Components/Fixtures/Fixture-Components/LineupPredicter/LineupPredictor";

import Statistics from "../Components/Fixtures/Fixture-Components/Statistics";
import Events from "../Components/Fixtures/Fixture-Components/Events";
import PostKickoffPredictions from "../Components/Fixtures/Fixture-Components/PostKickoffPredictions";
import { Paper, Tab, Tabs } from "@mui/material";
import Lineup from "../Components/Fixtures/Fixture-Components/Lineup";
import PlayerRatings from "../Components/Fixtures/Fixture-Components/PlayerRatings/PlayerRatings";
import WinnerPredict from "../Components/Fixtures/Fixture-Components/WinnerPredict";

export default function MobileFixtureContainer({ fixture }) {
  const isPreMatch = fixture?.fixture?.status?.short === "NS";

  const getFirstTabValue = () => {
    if (fixture?.lineups?.length > 0) return "Lineup";
    if (isPreMatch) return "Predict-XI";
  };

  const [selectedTab, setSelectedTab] = useState(getFirstTabValue());

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <Paper
        className="MobileFixtureTabs"
        sx={{ position: "relative", overflow: "hidden" }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="MobileFixtureNav"
          variant="scrollable"
          scrollButtons="off"
          allowScrollButtonsMobile={true}
          sx={{
            "&::before, &::after": {
              content: '""',
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "30px",
              pointerEvents: "none",
              zIndex: 1,
            },
            "&::before": {
              left: 0,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.2), transparent)",
            },
            "&::after": {
              right: 0,
              background:
                "linear-gradient(to left, rgba(0,0,0,0.2), transparent)",
            },
          }}
        >
          {!fixture?.lineups || fixture.lineups.length === 0 ? (
            <Tab label="Predict XI" value="Predict-XI" />
          ) : (
            <Tab label="Lineup" value="Lineup" />
          )}
          {isPreMatch && <Tab label="Predicts" value="Predicts" />}
          {!isPreMatch && <Tab label="Ratings" value="Ratings" />}
          {!isPreMatch && <Tab label="Stats" value="Stats" />}
          {!isPreMatch && <Tab label="Events" value="Events" />}
          {!isPreMatch && <Tab label="Predictions" value="PostPredicts" />}
        </Tabs>
      </Paper>
      {selectedTab === "Predicts" && (
        <div className="ScorePredictPTWContainer containerMargin">
          <WinnerPredict fixture={fixture} />
          <ScorePrediction fixture={fixture} />

          <PreMatchMOTM fixture={fixture} />
        </div>
      )}
      {selectedTab === "Predict-XI" && <LineupPredictor fixture={fixture} />}

      {selectedTab === "Lineup" && (
        <Paper className="containerMargin" style={{ padding: "10px 0px" }}>
          <Lineup fixture={fixture} />
        </Paper>
      )}
      {selectedTab === "Ratings" && <PlayerRatings fixture={fixture} />}
      {selectedTab === "Stats" && <Statistics fixture={fixture} />}
      {selectedTab === "Events" && <Events events={fixture?.events} />}
      {selectedTab === "PostPredicts" && (
        <PostKickoffPredictions fixture={fixture} />
      )}
    </>
  );
}
