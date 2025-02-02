import React, { useState } from "react";
import LineupPlayer from "../LineupPlayer";
import { useDispatch, useSelector } from "react-redux";
import { selectSquadData } from "../../../../Selectors/squadDataSelectors";
import { Button } from "@mui/material";
import { handlePredictTeamSubmit } from "../../../../Firebase/Firebase";
import { setLocalStorageItem } from "../../../../Hooks/Helper_Functions";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";

import { useDroppable } from "@dnd-kit/core";

export default function DroppablePitch({
  fixture,
  readOnly = false,
  readOnlyTeam,
  chosenTeam,
  setTeam,
}) {
  const dispatch = useDispatch();

  const squadData = useSelector(selectSquadData);

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
                // onDrop={(e) => {
                //   e.preventDefault();
                //   const droppedData = e.dataTransfer.getData("text/plain");
                //   handlePlayerDrop({
                //     droppedLocation: id,
                //     droppedPlayerId: droppedData,
                //   });
                // }}
                // className={"player-substitute"}
              />
            ) : readOnlyTeam ? (
              <></>
            ) : (
              <DroppableLocation
                key={id}
                id={id} // Pass the 'id' prop to DroppableLocation
              />
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
function DroppableLocation({ id }) {
  const { setNodeRef, isOver } = useDroppable({
    id: String(id),
  });

  return (
    <div
      ref={setNodeRef}
      className={`droppable-location player ${isOver ? "over" : ""}`} // Optional: Add styles when it's being hovered over
      style={{ border: isOver ? "2px solid green" : "2px dashed gray" }} // Optional: Change border color when over
    >
      Drop here
    </div>
  );
}
