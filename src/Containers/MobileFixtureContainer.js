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

export default function MobileFixtureContainer({ fixture }) {
  const isPreMatch = fixture?.fixture?.status?.short === "NS";
  const [selectedTab, setSelectedTab] = useState("");

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <Paper className="MobileFixtureTabs">
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          aria-label="MobileFixtureNav"
          scrollButtons={true}
          allowScrollButtonsMobile={true}
        >
          {isPreMatch && <Tab label="Predicts" value="Predicts" />}
          {!fixture?.lineups || fixture.lineups.length === 0 ? (
            <Tab label="Predict XI" value="Predict-XI" />
          ) : (
            <Tab label="Lineup" value="Lineup" />
          )}
          {!isPreMatch && <Tab label="Ratings" value="Ratings" />}
          {!isPreMatch && <Tab label="Stats" value="Stats" />}
          {!isPreMatch && <Tab label="Events" value="Events" />}
          {!isPreMatch && <Tab label="Predicts" value="PostPredicts" />}
        </Tabs>
      </Paper>
      {selectedTab === "Predicts" && (
        <>
          <ScorePrediction fixture={fixture} />

          <PreMatchMOTM fixture={fixture} />
        </>
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
