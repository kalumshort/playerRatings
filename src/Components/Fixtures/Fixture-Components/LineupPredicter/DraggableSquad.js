import React, { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import { selectSquadData } from "../../../../Selectors/squadDataSelectors";
import { useSelector } from "react-redux";

export default function DraggableSquad() {
  const squadData = useSelector(selectSquadData);
  const [selectedTab, setSelectedTab] = useState("G");
  const [positions, setPositions] = useState({});

  // Filter players based on the selected tab
  const filteredPlayers = Object.fromEntries(
    Object.entries(squadData).filter(
      ([, player]) => player.position === selectedTab
    )
  );

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  const handleTouchStart = (e, id) => {
    const touch = e.touches[0];
    setPositions((prev) => ({
      ...prev,
      [id]: { x: touch.clientX, y: touch.clientY },
    }));
  };

  const handleTouchMove = (e, id) => {
    if (!positions[id]) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - positions[id].x;
    const deltaY = touch.clientY - positions[id].y;

    setPositions((prev) => ({
      ...prev,
      [id]: { x: touch.clientX, y: touch.clientY, dx: deltaX, dy: deltaY },
    }));
  };

  const handleTouchEnd = (id) => {
    setPositions((prev) => ({
      ...prev,
      [id]: { ...prev[id], dx: 0, dy: 0 },
    }));
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
        {Object.entries(filteredPlayers).map(([id, player]) => {
          const pos = positions[id] || { dx: 0, dy: 0 };
          return (
            <div
              key={id}
              className="player"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", id);
                e.dataTransfer.effectAllowed = "move";
              }}
              style={{
                transform: `translate(${pos.dx}px, ${pos.dy}px)`,
                touchAction: "none",
              }}
              onTouchStart={(e) => handleTouchStart(e, id)}
              onTouchMove={(e) => handleTouchMove(e, id)}
              onTouchEnd={() => handleTouchEnd(id)}
            >
              <img
                src={player.img}
                alt={player.name}
                className="lineup-player-img"
              />
              <span className="lineup-player-name">{player.name}</span>
            </div>
          );
        })}
      </div>
    </Box>
  );
}
