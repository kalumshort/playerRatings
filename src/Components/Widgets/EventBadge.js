import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import StyleIcon from "@mui/icons-material/Style";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

// --- REUSABLE BADGE COMPONENT ---
export const EventBadge = React.memo(({ type, label, time }) => {
  let icon = null;
  let color = "#333";
  let bg = "rgba(0,0,0,0.05)"; // Default subtle grey

  switch (type) {
    case "goal":
    case "penalty":
      icon = <SportsSoccerIcon fontSize="inherit" />;
      color = "#2ecc71"; // Green
      bg = "rgba(46, 204, 113, 0.1)";
      break;
    case "assist":
      icon = <AutoFixHighIcon fontSize="inherit" />;
      color = "#3498db"; // Blue
      bg = "rgba(52, 152, 219, 0.1)";
      break;
    case "yellow":
      icon = <StyleIcon fontSize="inherit" />; // No rotation needed usually, or rotate if preferred
      color = "#f1c40f"; // Yellow
      bg = "rgba(241, 196, 15, 0.1)";
      break;
    case "red":
      icon = <StyleIcon fontSize="inherit" />;
      color = "#e74c3c"; // Red
      bg = "rgba(231, 76, 60, 0.1)";
      break;
    case "subIn":
      icon = (
        <CompareArrowsIcon
          fontSize="inherit"
          sx={{ transform: "rotate(90deg)" }}
        />
      );
      color = "#2ecc71"; // Green
      bg = "rgba(46, 204, 113, 0.1)";
      break;
    case "subOut":
      icon = (
        <CompareArrowsIcon
          fontSize="inherit"
          sx={{ transform: "rotate(90deg)" }}
        />
      );
      color = "#e74c3c"; // Red
      bg = "rgba(231, 76, 60, 0.1)";
      break;
    default:
      break;
  }

  return (
    <Tooltip title={label} arrow>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          borderRadius: "6px",
          px: "6px",
          py: "2px",
          border: `1px solid ${color}`,
          bgcolor: bg,
          height: "22px", // Fixed height for alignment
        }}
      >
        <Box sx={{ display: "flex", color: color, fontSize: "14px" }}>
          {icon}
        </Box>
        {time && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: "800",
              color: color,
              fontSize: "0.7rem",
              lineHeight: 1,
            }}
          >
            {time}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
});
