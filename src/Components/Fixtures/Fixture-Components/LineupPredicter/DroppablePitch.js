import React, { useState } from "react";
import LineupPlayer from "../LineupPlayer";
import { useDispatch, useSelector } from "react-redux";
import { selectSquadData } from "../../../../Selectors/squadDataSelectors";
import { Button } from "@mui/material";
import { handlePredictTeamSubmit } from "../../../../Firebase/Firebase";
import { setLocalStorageItem } from "../../../../Hooks/Helper_Functions";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";

export default function DroppablePitch({
  fixture,
  readOnly = false,
  readOnlyTeam,
}) {
  const dispatch = useDispatch();

  const squadData = useSelector(selectSquadData);

  const [chosenTeam, setTeam] = useState(readOnlyTeam ? readOnlyTeam : {});

  const handlePlayerDrop = ({ droppedPlayerId, droppedLocation }) => {
    if (readOnly) {
      return;
    }
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

  const handlePlayerDelete = (playerId) => {
    if (readOnly) {
      return;
    }
    setTeam((prevTeam) => {
      const updatedTeam = Object.fromEntries(
        Object.entries(prevTeam).filter(([_, id]) => id !== String(playerId))
      );
      return updatedTeam;
    });
  };

  const handleTeamSubmit = async () => {
    if (readOnly) {
      return;
    }
    const filteredPlayers = Object.keys(chosenTeam).reduce((result, key) => {
      const playerId = chosenTeam[key];
      if (squadData[playerId]) {
        result[key] = squadData[playerId];
      }
      return result;
    }, {});

    setLocalStorageItem(
      `userPredictedTeam-${fixture.id}`,
      JSON.stringify(chosenTeam)
    );
    await handlePredictTeamSubmit({
      players: filteredPlayers,
      matchId: fixture.id,
    });
    dispatch(fetchMatchPredictions(fixture.id));
  };

  return (
    <div
      className="DroppablePitchContainer"
      onDragOver={(e) => e.preventDefault()}
    >
      {[
        [1],
        [2, 3, 4, 5, 6],
        [7, 8, 9, 10, 11],
        [12, 13, 14, 15, 16],
        [17, 18, 19, 20, 21],
      ].map((row, rowIndex) => (
        <div className="DroppablePitchRow" key={`row-${rowIndex}`}>
          {row.map((id) =>
            chosenTeam[id] ? (
              <LineupPlayer
                key={id} // Ensure each component has a unique key
                player={squadData[chosenTeam[id]]}
                onDelete={!readOnly && handlePlayerDelete}
                draggable={!readOnly}
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "text/plain",
                    squadData[chosenTeam[id]].id
                  );
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedData = e.dataTransfer.getData("text/plain");
                  handlePlayerDrop({
                    droppedLocation: id,
                    droppedPlayerId: droppedData,
                  });
                }}
                // className={"player-substitute"}
              />
            ) : readOnlyTeam ? (
              <></>
            ) : (
              <div
                className="player"
                id={id}
                key={id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedData = e.dataTransfer.getData("text/plain");
                  handlePlayerDrop({
                    droppedLocation: id,
                    droppedPlayerId: droppedData,
                  });
                }}
              ></div>
            )
          )}
        </div>
      ))}
      {Object.keys(chosenTeam).length === 11 && !readOnly && (
        <Button
          variant="contained"
          className="predictTeamSubmit"
          onClick={handleTeamSubmit}
        >
          Submit
        </Button>
      )}
    </div>
  );
}
