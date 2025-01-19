import React from "react";
import { ContentContainer } from "../../../../Containers/GlobalContainer";
import DroppablePitch from "./DroppablePitch";
import DraggableSquad from "./DraggableSquad";
import { useLocalStorage } from "../../../../Hooks/Helper_Functions";
import { useSelector } from "react-redux";
import { selectPredictionsByMatchId } from "../../../../Selectors/predictionsSelectors";
import { selectSquadData } from "../../../../Selectors/squadDataSelectors";
import LineupPlayer from "../LineupPlayer";

export default function LineupPredictor({ fixture }) {
  const storedUsersPredictedTeam = JSON.parse(
    useLocalStorage(`userPredictedTeam-${fixture.id}`)
  );

  return storedUsersPredictedTeam ? (
    <div className="chosen-lineup-container">
      <ChosenLineup fixture={fixture} readOnlyTeam={storedUsersPredictedTeam} />
      <CommunityTeamStats
        fixture={fixture}
        readOnlyTeam={storedUsersPredictedTeam}
      />
    </div>
  ) : (
    <ContentContainer className="Prediction-lineup-container">
      <h1 className="smallHeading">Preferred Lineup </h1>
      <DroppablePitch fixture={fixture} />
      <DraggableSquad fixture={fixture} />
    </ContentContainer>
  );
}

function ChosenLineup({ fixture, readOnlyTeam }) {
  return (
    <ContentContainer className="chosen-lineup">
      <h1 className="smallHeading">Your Chosen Lineup </h1>
      <DroppablePitch
        fixture={fixture}
        readOnlyTeam={readOnlyTeam}
        readOnly={true}
      />
    </ContentContainer>
  );
}

export function CommunityTeamStats({ fixture }) {
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));
  const squadData = useSelector(selectSquadData);

  const percentagesArray = matchPredictions?.totalPlayersSubmits
    ? Object.entries(matchPredictions?.totalPlayersSubmits).map(
        ([playerId, timesSelected]) => ({
          id: playerId,
          percentage: (timesSelected / matchPredictions.totalTeamSubmits) * 100,
        })
      )
    : [];

  // Sort the array from largest to smallest percentage
  percentagesArray?.sort((a, b) => b.percentage - a.percentage);

  return (
    <ContentContainer className="community-team-stats">
      <h1 className="smallHeading">Players Chosen </h1>
      {percentagesArray?.map(({ id, percentage }) => (
        <LineupPlayer
          player={squadData[id]}
          onDelete={false}
          draggable={false}
          percentage={percentage}
          className={"marginBottom"}
        />
      ))}
    </ContentContainer>
  );
}
