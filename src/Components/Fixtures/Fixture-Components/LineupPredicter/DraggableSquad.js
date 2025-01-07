import React from "react";
import { selectSquadData } from "../../../../Selectors/squadDataSelectors";
import { useSelector } from "react-redux";

export default function DraggableSquad() {
  const squadData = useSelector(selectSquadData);

  return (
    <div className="DraggableSquadContainer">
      {Object.entries(squadData).map(([id, player]) => (
        <div
          key={id}
          className="player"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", id);
            e.dataTransfer.effectAllowed = "move";
          }}
        >
          <img
            src={player.img}
            alt={player.name}
            className="lineup-player-img"
          />
          <span>{player.name}</span>
        </div>
      ))}
    </div>
  );
}
