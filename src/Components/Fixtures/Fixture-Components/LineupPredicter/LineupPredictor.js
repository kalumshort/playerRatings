import React, { useState } from "react";
import { ContentContainer } from "../../../../Containers/GlobalContainer";
import DroppablePitch from "./DroppablePitch";
import DraggableSquad from "./DraggableSquad";
import { useLocalStorage } from "../../../../Hooks/Helper_Functions";
import { useSelector } from "react-redux";
import { selectPredictionsByMatchId } from "../../../../Selectors/predictionsSelectors";
import { selectSquadData } from "../../../../Selectors/squadDataSelectors";
import LineupPlayer from "../LineupPlayer";

import { DndContext } from "@dnd-kit/core";
import { Button } from "@mui/material";

export default function LineupPredictor({ fixture, readOnly }) {
  const squadData = useSelector(selectSquadData);

  const storedUsersPredictedTeam = JSON.parse(
    useLocalStorage(`userPredictedTeam-${fixture.id}`)
  );

  const [chosenTeam, setTeam] = useState({});

  const availablePlayers = Object.keys(squadData).reduce((acc, playerId) => {
    if (!Object.values(chosenTeam).includes(playerId)) {
      acc[playerId] = squadData[playerId];
    }
    return acc;
  }, {});

  const handlePlayerDrop = (droppedPlayerId, droppedLocation) => {
    setTeam((prevTeam) => {
      const updatedTeam = { ...prevTeam };

      const currentTeamSize = Object.keys(updatedTeam).length;

      // Check if the location is occupied
      if (updatedTeam[droppedLocation]) {
        const currentPlayerAtLocation = updatedTeam[droppedLocation];

        // Check if the dropped player already exists in the team
        if (Object.values(updatedTeam).includes(droppedPlayerId)) {
          // Find the current location of the dropped player and remove them
          let droppedPlayerOldLocation = null;
          for (let location in updatedTeam) {
            if (updatedTeam[location] === droppedPlayerId) {
              droppedPlayerOldLocation = location; // Store the old location of the dropped player
              delete updatedTeam[location]; // Remove the dropped player from their old location
              break;
            }
          }

          // Now place the dropped player at the new location
          updatedTeam[droppedLocation] = droppedPlayerId;

          // Move the current player to the dropped player's old location
          if (droppedPlayerOldLocation !== null) {
            updatedTeam[droppedPlayerOldLocation] = currentPlayerAtLocation;
          }
        } else {
          // If the dropped player is not in the team, just replace the current player
          delete updatedTeam[droppedLocation]; // Remove the current player from their location
          updatedTeam[droppedLocation] = droppedPlayerId; // Place the new player at the location
        }
      } else {
        // If the location is empty, check if the player is already in the team

        if (!Object.values(updatedTeam).includes(droppedPlayerId)) {
          if (currentTeamSize >= 11) {
            alert("11 Players Max");
            return updatedTeam; // Return early if the team already has 11 players
          }
          updatedTeam[droppedLocation] = droppedPlayerId; // Add the dropped player if not already in the team
        } else {
          // If the player is already in the team, update their location
          for (let location in updatedTeam) {
            if (updatedTeam[location] === droppedPlayerId) {
              delete updatedTeam[location]; // Remove from their old location
              updatedTeam[droppedLocation] = droppedPlayerId; // Add the player to the new location
              break;
            }
          }
        }
      }

      return updatedTeam;
    });
  };

  return storedUsersPredictedTeam || readOnly ? (
    <div className="chosen-lineup-container containerMargin">
      {storedUsersPredictedTeam && (
        <ChosenLineup
          UsersPredictedTeam={storedUsersPredictedTeam}
          squadData={squadData}
        />
      )}
      <CommunityTeamStats fixture={fixture} />
    </div>
  ) : (
    <ContentContainer className="Prediction-lineup-container containerMargin">
      <h1 className="smallHeading">
        Preferred <br></br>Lineup
      </h1>
      <Button
        className="lineupPredicClear"
        variant="outlined"
        onClick={() => setTeam({})}
      >
        Clear
      </Button>
      <DndContext
        onDragEnd={(event) => {
          const { active, over } = event;

          // When a drop happens, call handleDrop
          if (over) {
            const droppedPlayerId = active.id; // The ID of the player being dragged
            const droppedLocationId = over.id; // The ID of the location where it was dropped
            handlePlayerDrop(droppedPlayerId, droppedLocationId);
          }
        }}
      >
        <DroppablePitch
          fixture={fixture}
          chosenTeam={chosenTeam}
          setTeam={setTeam}
        />
        <DraggableSquad fixture={fixture} availablePlayers={availablePlayers} />
      </DndContext>
    </ContentContainer>
  );
}

function ChosenLineup({ squadData, UsersPredictedTeam }) {
  return (
    <ContentContainer className="chosen-lineup animate__animated animate__flipInX">
      <h1 className="smallHeading">Your Chosen Lineup </h1>
      {UsersPredictedTeam && (
        <div className="userPredictedTeamContainer">
          {[
            [1],
            [2, 3, 4, 5, 6],
            [7, 8, 9, 10, 11],
            [12, 13, 14, 15, 16],
            [17, 18, 19, 20, 21],
          ].map((row, rowIndex) => (
            <div className="DroppablePitchRow" key={`row-${rowIndex}`}>
              {row.map((id) =>
                squadData[UsersPredictedTeam[id]] ? (
                  <LineupPlayer
                    key={id}
                    id={id} // Pass the 'id' prop to DroppableLocation
                    player={squadData[UsersPredictedTeam[id]]}
                  />
                ) : (
                  <></>
                )
              )}
            </div>
          ))}
        </div>
      )}
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
      {percentagesArray.length === 0 && "No Data"}
    </ContentContainer>
  );
}
