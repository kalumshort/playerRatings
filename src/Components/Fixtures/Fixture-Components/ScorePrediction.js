import React, { useState } from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { Button } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { handlePredictTeamScore } from "../../../Firebase/Firebase";
import {
  setLocalStorageItem,
  useLocalStorage,
} from "../../../Hooks/Helper_Functions";
import ScorePredictionResults from "./ScorePredictionResults";
import { useDispatch } from "react-redux";
import { fetchMatchPredictions } from "../../../Hooks/Fixtures_Hooks";

export default function ScorePrediction({ fixture }) {
  const dispatch = useDispatch();

  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [homeAwayScore, setAwayTeamScore] = useState(0);

  const storedUsersPredictedScore = useLocalStorage(
    `userPredictedScore-${fixture.id}`
  );

  const handleTeamScoreSubmit = async () => {
    setLocalStorageItem(
      `userPredictedScore-${fixture.id}`,
      `${homeTeamScore}-${homeAwayScore}`
    );

    await handlePredictTeamScore({
      matchId: fixture.id,
      score: `${homeTeamScore}-${homeAwayScore}`,
      homeGoals: homeTeamScore,
      awayGoals: homeAwayScore,
    });

    dispatch(fetchMatchPredictions(fixture.id));
  };
  return storedUsersPredictedScore ? (
    <ScorePredictionResults fixture={fixture}></ScorePredictionResults>
  ) : (
    <ContentContainer className="scorePredictionContainer">
      <h1 className="smallHeading">Score Prediction</h1>
      <div className="scorePredictionTeams">
        <div className="scorePredictionTeam">
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
        </div>
        <span>-</span>
        <div className="scorePredictionTeam">
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
      </div>
      <Button
        onClick={() => handleTeamScoreSubmit()}
        style={{
          position: "absolute",
          top: "1px",
          right: "1px",
          padding: "0px",
        }}
        variant="outlined"
      >
        Submit
      </Button>
    </ContentContainer>
  );
}
