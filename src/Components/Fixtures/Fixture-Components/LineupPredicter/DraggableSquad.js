import React, { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import { selectSquadData } from "../../../../Selectors/squadDataSelectors";
import { useSelector } from "react-redux";
import { useDraggable } from "@dnd-kit/core";

export default function DraggableSquad() {
  const squadData = useSelector(selectSquadData);
  const [selectedTab, setSelectedTab] = useState("G");

  // Filter players based on the selected tab
  const filteredPlayers = Object.fromEntries(
    Object.entries(squadData).filter(
      ([, player]) => player.position === selectedTab
    )
  );

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box>
      {/* Tabs for filtering */}
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        variant="fullWidth"
        scrollButtons="auto"
        aria-label="Player Position Tabs"
        className="DraggableSquadTabs"
      >
        <Tab label="GK" value="G" sx={{ minWidth: "auto", flexShrink: 1 }} />
        <Tab label="DEF" value="D" sx={{ minWidth: "auto", flexShrink: 1 }} />
        <Tab label="MID" value="M" sx={{ minWidth: "auto", flexShrink: 1 }} />
        <Tab label="FOR" value="F" sx={{ minWidth: "auto", flexShrink: 1 }} />
      </Tabs>

      <div className="DraggableSquadContainer">
        {Object.entries(filteredPlayers).map(([id, player]) => (
          <DraggablePlayer id={id} player={player} />
        ))}
      </div>
    </Box>
  );
}

function DraggablePlayer({ player, id }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: String(id), // Make sure the ID is unique and string-based
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : "none",
    transition: isDragging ? "none" : "transform 200ms ease", // Smooth transition when not dragging
    cursor: "move",
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="draggable-player player"
      style={style}
    >
      <img src={player.img} alt={player.name} className="lineup-player-img" />
      <span className="lineup-player-name">{player.name}</span>
    </div>
  );
}
