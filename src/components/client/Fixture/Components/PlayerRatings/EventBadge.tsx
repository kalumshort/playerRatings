"use client";

import React, { useMemo } from "react";
import { Box, Typography, Tooltip, Zoom } from "@mui/material";
import {
  SportsSoccerRounded as GoalIcon,
  AutoFixHighRounded as AssistIcon,
  StyleRounded as CardIcon,
  CompareArrowsRounded as SubIcon,
} from "@mui/icons-material";

// 1. CONFIGURATION LOOKUP
// Moving logic out of the component body for better performance and readability
const EVENT_CONFIG: Record<string, any> = {
  goal: { icon: GoalIcon, color: "#2F5C34", bg: "#A0E8AF" },
  penalty: { icon: GoalIcon, color: "#2F5C34", bg: "#A0E8AF" },
  assist: { icon: AssistIcon, color: "#2B4C6F", bg: "#A2D2FF" },
  yellow: { icon: CardIcon, color: "#744210", bg: "#F6E05E", rotate: 90 },
  red: { icon: CardIcon, color: "#742A2A", bg: "#FEB2B2", rotate: 90 },
  subIn: { icon: SubIcon, color: "#2F5C34", bg: "#C6F6D5", rotate: 90 },
  subOut: { icon: SubIcon, color: "#742A2A", bg: "#FED7D7", rotate: 90 },
};

interface EventBadgeProps {
  type: string;
  label: string;
  time: string;
}

const EventBadge = ({ type, label, time }: EventBadgeProps) => {
  const config = EVENT_CONFIG[type] || {
    icon: GoalIcon,
    color: "text.primary",
    bg: "background.default",
  };

  const Icon = config.icon;

  return (
    <Tooltip
      title={label.toUpperCase()}
      arrow
      TransitionComponent={Zoom}
      enterTouchDelay={0}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.7,
          borderRadius: "20px",
          px: 1.2,
          py: 0.4,
          bgcolor: config.bg,
          color: config.color,
          // Clay shadow for a slightly raised effect
          boxShadow:
            "0 2px 4px rgba(0,0,0,0.1), inset 0 -1px 0 rgba(0,0,0,0.1)",
          transition: "transform 0.2s ease",
          "&:hover": { transform: "translateY(-1px)" },
          cursor: "default",
          userSelect: "none",
        }}
      >
        <Icon
          sx={{
            fontSize: 14,
            transform: config.rotate ? `rotate(${config.rotate}deg)` : "none",
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 900,
            fontSize: "0.65rem",
            lineHeight: 1,
            letterSpacing: 0.5,
          }}
        >
          {time}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default React.memo(EventBadge);
