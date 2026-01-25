import React, { useState } from "react";
import Lineup from "./Lineup";
import { Box, Paper, Tab, Tabs, useTheme } from "@mui/material";
import PlayerRatings from "./PlayerRatings/PlayerRatings";

export default function LineupAndPlayerRatings({ fixture }) {
  const [selectedTab, setSelectedTab] = useState("lineup");

  const theme = useTheme(); // Access global theme

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        // 1. CLAY STYLE & LAYOUT FIXES
        width: "100%", // Force it to fit parent width
        overflow: "hidden", // Cut off anything that pushes wide
        display: "flex",
        flexDirection: "column",
        minHeight: 600, // Stable height for Tablet/Desktop
        p: 2, // Internal padding
      }}
    >
      {/* --- CUSTOM CLAY TABS --- */}
      <Box
        sx={{
          // The "Track" for the tabs (Inset/Pressed look)
          bgcolor:
            theme.palette.mode === "light"
              ? "rgba(0,0,0,0.03)"
              : "rgba(255,255,255,0.05)",
          borderRadius: "24px",
          p: 0.5,
          mb: 2,
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          scrollButtons="auto"
          // Hide the default ugly underline
          TabIndicatorProps={{ style: { display: "none" } }}
          sx={{
            minHeight: 48,
            "& .MuiTab-root": {
              borderRadius: "20px",
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.95rem",
              minHeight: 48,
              transition: "all 0.3s ease",
              color: "text.secondary",
              zIndex: 1,

              // ACTIVE STATE (The "Pill" Look)
              "&.Mui-selected": {
                bgcolor: "background.paper", // White pill on top of grey track
                color: "primary.main", // Matcha Green text
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", // Floating effect
              },
            },
          }}
        >
          <Tab label="Start XI" value="lineup" />
          <Tab label="Player Ratings" value="ratings" />
        </Tabs>
      </Box>

      {/* --- CONTENT AREA --- */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {selectedTab === "lineup" && <Lineup fixture={fixture} />}
        {selectedTab === "ratings" && <PlayerRatings fixture={fixture} />}
      </Box>
    </Paper>
  );
}
