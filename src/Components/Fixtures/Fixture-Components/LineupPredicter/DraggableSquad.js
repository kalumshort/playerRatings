import React, { useEffect, useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";

import { useDraggable, useDroppable } from "@dnd-kit/core";

export default function DraggableSquad({ availablePlayers }) {
  const [selectedTab, setSelectedTab] = useState("G");

  // Filter players based on the selected tab
  const filteredPlayers = Object.fromEntries(
    Object.entries(availablePlayers).filter(
      ([, player]) => player.position === selectedTab
    )
  );

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box className="DraggableSquadTabsContainer">
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
          <DraggablePlayer id={id} player={player} useAnimation={false} />
        ))}
      </div>
    </Box>
  );
}

export function DraggablePlayer({ player, locationId, useAnimation }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: String(player.id),
      activationConstraint: { delay: 250, tolerance: 5 },
    });
  const [animateClass, setAnimateClass] = useState(
    "animate__animated animate__flipInX"
  );

  // Remove animation when dragging starts
  useEffect(() => {
    if (isDragging) {
      setAnimateClass(""); // Remove animation class
    } else {
      setAnimateClass("animate__animated animate__flipInX"); // Reapply after drag
    }
  }, [isDragging]);

  const { setNodeRef: setDropRef } = useDroppable({
    id: String(locationId),
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : "none",
    transition: isDragging ? "none" : "transform 200ms ease",
    cursor: "move",
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      className={`draggable-player player ${useAnimation ? animateClass : ""}`}
      style={style}
    >
      <img src={player.img} alt={player.name} className="lineup-player-img" />
      <span className="lineup-player-name">{player.name}</span>
    </div>
  );
}
