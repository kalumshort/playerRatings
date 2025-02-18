import React from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { Button, ButtonGroup } from "@mui/material";
import { handlePredictWinningTeam } from "../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../Hooks/Fixtures_Hooks";
import { useDispatch, useSelector } from "react-redux";

import {
  setLocalStorageItem,
  useLocalStorage,
} from "../../../Hooks/Helper_Functions";
import { selectPredictionsByMatchId } from "../../../Selectors/predictionsSelectors";

export default function WinnerPredict({ fixture }) {
  const dispatch = useDispatch();

  const storedUsersPredictedResult = useLocalStorage(
    `userPredictedResult-${fixture.id}`
  );
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));

  const handleWinningTeamPredict = async (choice) => {
    setLocalStorageItem(`userPredictedResult-${fixture.id}`, choice);
    await handlePredictWinningTeam({ matchId: fixture.id, choice: choice });
    dispatch(fetchMatchPredictions(fixture.id));
  };

  const { totalVotes, draw, away, home } = matchPredictions.result || {};

  const percentages = {
    home: (home / totalVotes) * 100,
    draw: (draw / totalVotes) * 100,
    away: (away / totalVotes) * 100,
  };

  const maxPercentage = Math.max(
    percentages.home,
    percentages.draw,
    percentages.away
  );

  return (
    <ContentContainer className="scorePredictionContainer containerMargin">
      <h4 className="smallHeading">Who will Win?</h4>
      {!storedUsersPredictedResult ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <ButtonGroup variant="outlined" className="winnerPredictButtonGroup">
            <Button onClick={() => handleWinningTeamPredict("home")} s>
              <img
                src={fixture.teams.home.logo}
                alt={`${fixture.teams.home.name} logo`}
                className="team-logo"
              />
            </Button>
            <Button onClick={() => handleWinningTeamPredict("draw")}>
              Draw
            </Button>
            <Button onClick={() => handleWinningTeamPredict("away")}>
              <img
                src={fixture.teams.away.logo}
                alt={`${fixture.teams.away.name} logo`}
                className="team-logo"
              />
            </Button>
          </ButtonGroup>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
            height: "100%",
          }}
        >
          <div
            className={`WinnerPredictTeamContainer ${
              percentages.home === maxPercentage ? "WinningResult" : ""
            }`}
          >
            <img
              src={fixture.teams.home.logo}
              alt={`${fixture.teams.home.name} logo`}
              className="team-logo"
            />
            <span>{percentages.home.toFixed(0)}%</span>
          </div>
          <div
            className={`WinnerPredictTeamContainer ${
              percentages.draw === maxPercentage ? "WinningResult" : ""
            }`}
          >
            <span style={{ color: "grey" }}>Draw</span>
            <span>{percentages.draw.toFixed(0)}%</span>
          </div>
          <div
            className={`WinnerPredictTeamContainer ${
              percentages.away === maxPercentage ? "WinningResult" : ""
            }`}
          >
            <img
              src={fixture.teams.away.logo}
              alt={`${fixture.teams.away.name} logo`}
              className="team-logo"
            />
            <span>{percentages.away.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
