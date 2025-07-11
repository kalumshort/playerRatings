import React from "react";

import { useDispatch, useSelector } from "react-redux";
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import { Button } from "@mui/material";
import { handlePredictTeamSubmit } from "../../../../Firebase/Firebase";

import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";

import { useDroppable } from "@dnd-kit/core";
import { DraggablePlayer } from "./DraggableSquad";
import useGroupData from "../../../../Hooks/useGroupsData";
import { useAuth } from "../../../../Providers/AuthContext";
import useGlobalData from "../../../../Hooks/useGlobalData";

export default function DroppablePitch({
  fixture,
  readOnly = false,
  chosenTeam,
  UsersPredictedTeam,
}) {
  const dispatch = useDispatch();

  const { user } = useAuth();

  const globalData = useGlobalData();

  const squadData = useSelector(selectSquadDataObject);
  const { activeGroup } = useGroupData();

  // const handlePlayerDelete = (playerId) => {
  //   if (readOnly) {
  //     return;
  //   }
  //   setTeam((prevTeam) => {
  //     const updatedTeam = Object.fromEntries(
  //       Object.entries(prevTeam).filter(([_, id]) => id !== String(playerId))
  //     );
  //     return updatedTeam;
  //   });
  // };

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

    await handlePredictTeamSubmit({
      players: filteredPlayers,
      matchId: fixture.id,
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
          {row.map((id) => (
            <DroppableLocation
              key={id}
              id={id} // Pass the 'id' prop to DroppableLocation
              player={squadData[chosenTeam[id]]}
            />
          ))}
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
function DroppableLocation({ id, player }) {
  const { setNodeRef, isOver } = useDroppable({ id: id });

  return player ? (
    <DraggablePlayer locationId={id} player={player} useAnimation={true} />
  ) : (
    <div
      ref={setNodeRef}
      key={`${id}-${player ? "filled" : "empty"}`} // Forces React to remount when empty
      className={`droppable-location player ${isOver ? "over" : ""}`}
      style={{
        boxShadow: isOver
          ? "0 0 10px 2px green"
          : "0 4px 6px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.4)",
        position: "relative",
      }}
    ></div>
  );
}
