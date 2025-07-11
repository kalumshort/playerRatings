import React from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { Button } from "@mui/material";
import { handlePredictWinningTeam } from "../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../Hooks/Fixtures_Hooks";
import { useDispatch, useSelector } from "react-redux";

import { selectPredictionsByMatchId } from "../../../Selectors/predictionsSelectors";
import useGroupData from "../../../Hooks/useGroupsData";
import { useAuth } from "../../../Providers/AuthContext";
import { selectUserMatchData } from "../../../Selectors/userDataSelectors";
import useGlobalData from "../../../Hooks/useGlobalData";
import { current } from "@reduxjs/toolkit";

export default function WinnerPredict({ fixture }) {
  const dispatch = useDispatch();
  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const globalData = useGlobalData();

  const usersMatchData = useSelector(selectUserMatchData(fixture.id));

  const storedUsersPredictedResult = usersMatchData?.result;

  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));

  const handleWinningTeamPredict = async (choice) => {
    await handlePredictWinningTeam({
      matchId: fixture.id,
      choice: choice,
      groupId: activeGroup.groupId,
      userId: user.uid,
      currentYear: globalData.currentYear,
    });
    dispatch(
      fetchMatchPredictions({
        matchId: fixture.id,
        groupId: activeGroup.groupId,
        currentYear: globalData.currentYear,
      })
    );
  };

  const { totalVotes, draw, away, home } = matchPredictions.result || {};

  const percentages = {
    home: (home / totalVotes) * 100,
    draw: (draw / totalVotes) * 100,
    away: (away / totalVotes) * 100,
  };

  // const maxPercentage = Math.max(
  //   percentages.home,
  //   percentages.draw,
  //   percentages.away
  // );

  return (
    <ContentContainer className="scorePredictionContainer">
      <h1 className="smallHeading">Who will win?</h1>
      {!storedUsersPredictedResult ? (
        <div className="winnerPredictButtonGroup">
          <Button onClick={() => handleWinningTeamPredict("home")} s>
            <img
              src={fixture.teams.home.logo}
              alt={`${fixture.teams.home.name} logo`}
              className="team-logo-small"
            />
          </Button>
          <Button onClick={() => handleWinningTeamPredict("draw")}>Draw</Button>
          <Button onClick={() => handleWinningTeamPredict("away")}>
            <img
              src={fixture.teams.away.logo}
              alt={`${fixture.teams.away.name} logo`}
              className="team-logo-small"
            />
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            width: "100%",
          }}
        >
          <div className={`WinnerPredictTeamContainer`}>
            <img
              src={fixture.teams.home.logo}
              alt={`${fixture.teams.home.name} logo`}
              className="team-logo-small"
            />
            <span>
              {isNaN(percentages?.home) ? 0 : percentages.home.toFixed(0)}%
            </span>
          </div>
          <div className={`WinnerPredictTeamContainer `}>
            <span style={{ color: "grey" }}>X</span>
            <span>
              {isNaN(percentages?.draw) ? 0 : percentages.draw.toFixed(0)}%
            </span>
          </div>
          <div className={`WinnerPredictTeamContainer`}>
            <img
              src={fixture.teams.away.logo}
              alt={`${fixture.teams.away.name} logo`}
              className="team-logo-small"
            />
            <span>
              {isNaN(percentages?.away) ? 0 : percentages.away.toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
