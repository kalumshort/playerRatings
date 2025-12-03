import React, { useEffect, useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";

import { useDraggable, useDroppable } from "@dnd-kit/core";

export default function DraggableSquad({ squad, chosenTeam }) {
  const [selectedTab, setSelectedTab] = useState("Goalkeeper");

  // Filter players based on the selected tab
  const filteredPlayers = Object.fromEntries(
    Object.entries(squad).filter(
      ([playerId, player]) =>
        player.position === selectedTab &&
        !Object.values(chosenTeam).includes(playerId)
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
        <Tab
          label="GK"
          value="Goalkeeper"
          sx={{ minWidth: "auto", flexShrink: 1 }}
        />
        <Tab
          label="DEF"
          value="Defender"
          sx={{ minWidth: "auto", flexShrink: 1 }}
        />
        <Tab
          label="MID"
          value="Midfielder"
          sx={{ minWidth: "auto", flexShrink: 1 }}
        />
        <Tab
          label="FOR"
          value="Attacker"
          sx={{ minWidth: "auto", flexShrink: 1 }}
        />
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
      style={{
        ...style,
      }}
    >
      <div className="img-wrapper">
        <img
          src={player.photo}
          alt={player.name}
          className="lineup-player-img"
        />
      </div>

      <span className="lineup-player-name">{player.name}</span>
    </div>
  );
}
