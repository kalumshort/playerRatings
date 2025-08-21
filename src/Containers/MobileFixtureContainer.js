import React, { useEffect, useState } from "react";
import ScorePrediction from "../Components/Fixtures/Fixture-Components/Predictions/ScorePrediction";

import LineupPredictor from "../Components/Fixtures/Fixture-Components/LineupPredicter/LineupPredictor";

import Statistics from "../Components/Fixtures/Fixture-Components/Statistics";
import Events from "../Components/Fixtures/Fixture-Components/Events";
import PostKickoffPredictions from "../Components/Fixtures/Fixture-Components/PostKickoffPredictions";
import { Paper, Tab, Tabs } from "@mui/material";
import Lineup from "../Components/Fixtures/Fixture-Components/Lineup";
import PlayerRatings from "../Components/Fixtures/Fixture-Components/PlayerRatings/PlayerRatings";
import WinnerPredict from "../Components/Fixtures/Fixture-Components/Predictions/WinnerPredict";
import PreMatchMOTM from "../Components/Fixtures/Fixture-Components/Predictions/PreMatchMOTM";
import MoodSelector from "../Components/Fixtures/Fixture-Components/MoodSelector";

export default function MobileFixtureContainer({
  fixture,
  showPredictions,
  currentYear,
  groupId,
}) {
  const isPreMatch = fixture?.fixture?.status?.short === "NS";
  console.log(fixture);

  // Dynamically build tabs array using useMemo for stable reference
  const tabs = React.useMemo(() => {
    const arr = [];
    if (fixture?.lineups) arr.push({ label: "Lineup", value: "Lineup" });
    if (
      (!fixture?.lineups || fixture.lineups.length === 0) &&
      isPreMatch &&
      showPredictions
    )
      arr.push({ label: "Your XI ", value: "Predict-XI" });
    if (isPreMatch && showPredictions)
      arr.push({ label: "Predicts", value: "Predicts" });
    if (!isPreMatch) arr.push({ label: "Moods", value: "Moods" });
    if (!isPreMatch) arr.push({ label: "Ratings", value: "Ratings" });
    if (!isPreMatch) arr.push({ label: "Stats", value: "Stats" });
    if (!isPreMatch) arr.push({ label: "Events", value: "Events" });
    if (!isPreMatch) arr.push({ label: "Predictions", value: "PostPredicts" });
    return arr;
  }, [fixture, isPreMatch, showPredictions]);

  // The value of the first tab or undefined if none exist
  const getFirstTabValue = React.useCallback(
    () => (tabs[0] ? tabs[0].value : undefined),
    [tabs]
  );

  const [selectedTab, setSelectedTab] = useState(getFirstTabValue());

  // If the available tabs change (fixture or showPredictions changes), update the selected tab
  useEffect(() => {
    setSelectedTab(getFirstTabValue());
  }, [fixture, showPredictions, getFirstTabValue]);

  // If no tabs at all, you might want to show a "No data" or blank state here
  if (tabs.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        To early for predictions.
      </div>
    );
  }

  return (
    <>
      <Paper
        className="MobileFixtureTabs"
        sx={{ position: "relative", overflow: "hidden" }}
      >
        <Tabs
          value={selectedTab}
          onChange={(_, newValue) => setSelectedTab(newValue)}
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
          {tabs.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
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
      {selectedTab === "Moods" && (
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
    </>
  );
}
