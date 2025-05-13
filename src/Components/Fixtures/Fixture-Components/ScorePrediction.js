import React, { useState } from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { handlePredictTeamScore } from "../../../Firebase/Firebase";

import ScorePredictionResults from "./ScorePredictionResults";
import { useDispatch, useSelector } from "react-redux";
import { fetchMatchPredictions } from "../../../Hooks/Fixtures_Hooks";
import useGroupData from "../../../Hooks/useGroupsData";
import { useAuth } from "../../../Providers/AuthContext";
import { selectUserMatchData } from "../../../Selectors/userDataSelectors";

export default function ScorePrediction({ fixture }) {
  const dispatch = useDispatch();
  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));
  console.log(usersMatchData);

  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [homeAwayScore, setAwayTeamScore] = useState(0);

  const storedUsersPredictedScore = usersMatchData?.ScorePrediction;

  const handleTeamScoreSubmit = async () => {
    await handlePredictTeamScore({
      matchId: fixture.id,
      score: `${homeTeamScore}-${homeAwayScore}`,
      homeGoals: homeTeamScore,
      awayGoals: homeAwayScore,
      groupId: activeGroup.groupId,
      userId: user.uid,
    });

    dispatch(
      fetchMatchPredictions({
        matchId: fixture.id,
        groupId: activeGroup.groupId,
      })
    );
  };
  return storedUsersPredictedScore ? (
    <ScorePredictionResults
      fixture={fixture}
      storedUsersPredictedScore={storedUsersPredictedScore}
    ></ScorePredictionResults>
  ) : (
    <ContentContainer className="scorePredictionContainer">
      <h1 className="smallHeading">Match Score</h1>

      <div className="scorePredictionTeams">
        <img
          src={fixture.teams.home.logo}
          className="team-logo-small"
          alt={fixture.teams.home.name}
        />
        <div className="scorePredictButtons">
          <IconButton
            onClick={() => setHomeTeamScore((prev) => prev + 1)}
            className="muiButton"
            variant="outlined"
          >
            <ArrowUpwardIcon fontSize="small" className="muiIconSmall" />
          </IconButton>
          <span className="predictionScore">{homeTeamScore}</span>
          <IconButton
            onClick={() => setHomeTeamScore((prev) => Math.max(0, prev - 1))}
            className="muiButton"
            disabled={homeTeamScore === 0}
            variant="contained"
          >
            <ArrowDownwardIcon fontSize="small" className="muiIconSmall" />
          </IconButton>
        </div>

        <Button
          onClick={() => handleTeamScoreSubmit()}
          style={{
            padding: "0px",
            margin: "0px",
          }}
          variant="text"
        >
          Submit
        </Button>

        <div className="scorePredictButtons">
          <IconButton
            onClick={() => setAwayTeamScore((prev) => prev + 1)}
            className="muiButton"
          >
            <ArrowUpwardIcon fontSize="small" className="muiIconSmall" />
          </IconButton>
          <span className="predictionScore">{homeAwayScore}</span>
          <IconButton
            onClick={() => setAwayTeamScore((prev) => Math.max(0, prev - 1))}
            className="muiButton"
            disabled={homeAwayScore === 0}
          >
            <ArrowDownwardIcon fontSize="small" className="muiIconSmall" />
          </IconButton>
        </div>
        <img
          src={fixture.teams.away.logo}
          className="team-logo-small"
          alt={fixture.teams.away.name}
        />
      </div>
    </ContentContainer>
  );
}
