"use client";

import React from "react";
import { Paper, Typography, Tooltip, Zoom, useTheme } from "@mui/material";
import {
  SportsSoccerRounded as GoalIcon,
  AutoFixHighRounded as AssistIcon,
  StyleRounded as CardIcon,
  CompareArrowsRounded as SubIcon,
} from "@mui/icons-material";

const buildEventConfig = (theme: any): Record<string, any> => ({
  goal: {
    icon: GoalIcon,
    color: theme.palette.event.goalText,
    bg: theme.palette.event.goal,
  },
  penalty: {
    icon: GoalIcon,
    color: theme.palette.event.goalText,
    bg: theme.palette.event.goal,
  },
  assist: {
    icon: AssistIcon,
    color: theme.palette.event.assistText,
    bg: theme.palette.event.assist,
  },
  yellow: {
    icon: CardIcon,
    color: theme.palette.cards.yellowText,
    bg: theme.palette.cards.yellow,
    rotate: 90,
  },
  red: {
    icon: CardIcon,
    color: theme.palette.cards.redText,
    bg: theme.palette.cards.red,
    rotate: 90,
  },
  subIn: {
    icon: SubIcon,
    color: theme.palette.event.goalText,
    bg: theme.palette.event.goalBg,
    rotate: 90,
  },
  subOut: {
    icon: SubIcon,
    color: theme.palette.cards.redText,
    bg: theme.palette.cards.redBg,
    rotate: 90,
  },
});

interface EventBadgeProps {
  type: string;
  label: string;
  time: string;
}

const EventBadge = ({ type, label, time }: EventBadgeProps) => {
  const theme = useTheme();
  const EVENT_CONFIG = buildEventConfig(theme);
  const config = EVENT_CONFIG[type] || {
    icon: GoalIcon,
    color: theme.palette.text.primary,
    bg: theme.palette.background.default,
  };

  const Icon = config.icon;

  return (
    <Tooltip
      title={label.toUpperCase()}
      arrow
      TransitionComponent={Zoom}
      enterTouchDelay={0}
    >
      <Paper
        variant="pill"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.7,
          px: 1.2,
          py: 0.4,
          bgcolor: config.bg,
          color: config.color,
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
        <Typography variant="caption" sx={{ lineHeight: 1, letterSpacing: 0.5 }}>
          {time}
        </Typography>
      </Paper>
    </Tooltip>
  );
};

export default React.memo(EventBadge);
