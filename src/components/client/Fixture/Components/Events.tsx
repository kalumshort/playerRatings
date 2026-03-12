"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Select,
  MenuItem,
  Avatar,
  useTheme,
  alpha,
} from "@mui/material";
import {
  SportsSoccerRounded,
  StyleRounded,
  SwapHorizRounded,
  FlagRounded,
  FilterListRounded,
} from "@mui/icons-material";

// --- CONSTANTS ---
const EVENT_THEMES: Record<string, any> = {
  Goal: {
    icon: SportsSoccerRounded,
    bg: "#A0E8AF",
    color: "#1a3b1e",
    border: "#2F5C34",
    label: "GOAL!",
  },
  Card: {
    icon: StyleRounded,
    bg: "#FEB2B2", // Default Red
    color: "#742A2A",
    border: "#C53030",
  },
  subst: {
    icon: SwapHorizRounded,
    bg: "background.paper",
    color: "primary.main",
    border: "divider",
    label: "SUBSTITUTION",
  },
};

export default function Events({
  events,
  groupData,
  isGuestView,
}: {
  events: any[];
  groupData: any;
  isGuestView: boolean;
}) {
  const theme = useTheme() as any;
  const [selectedType, setSelectedType] = useState("All");

  // 1. DYNAMIC FILTER OPTIONS
  const eventOptions = useMemo(() => {
    if (!events) return [];
    return ["All", ...Array.from(new Set(events.map((item) => item.type)))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedType === "All") return events;
    return events?.filter((item) => item.type === selectedType);
  }, [events, selectedType]);

  if (!events || events.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{ ...theme.clay?.card, p: 6, textAlign: "center" }}
      >
        <FlagRounded sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
        <Typography variant="body2" color="text.secondary" fontWeight={800}>
          Awaiting match events...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FlagRounded color="primary" />
          <Typography variant="h6" fontWeight={900}>
            MATCH FEED
          </Typography>
        </Stack>

        <Box sx={{ ...theme.clay?.box, borderRadius: "12px", px: 1, py: 0.5 }}>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            size="small"
            variant="standard"
            disableUnderline
            IconComponent={FilterListRounded}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "text.secondary",
            }}
          >
            {eventOptions.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontWeight: 700 }}>
                {opt.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {/* TIMELINE LIST */}
      <Box sx={{ maxHeight: 500, overflowY: "auto", py: 2 }}>
        {filteredEvents.map((event, index) => (
          <EventRow
            key={index}
            event={event}
            isLast={index === filteredEvents.length - 1}
          />
        ))}
      </Box>
    </Paper>
  );
}

const EventRow = ({ event, isLast }: any) => {
  const theme = useTheme();
  const config = EVENT_THEMES[event.type] || {
    icon: FlagRounded,
    bg: "grey.100",
    color: "grey.700",
    border: "divider",
  };

  // Custom logic for Yellow vs Red Cards
  const isYellow = event.detail?.includes("Yellow");
  const iconBg = event.type === "Card" && isYellow ? "#F6E05E" : config.bg;
  const iconColor =
    event.type === "Card" && isYellow ? "#5F370E" : config.color;

  return (
    <Box sx={{ display: "flex", gap: 3, px: 3, py: 2, position: "relative" }}>
      {/* Timeline Connector Line */}
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: 47,
            top: 60,
            bottom: 0,
            width: 2,
            bgcolor: "divider",
            opacity: 0.5,
          }}
        />
      )}

      {/* TIME & ICON */}
      <Stack alignItems="center" spacing={1} sx={{ width: 40, flexShrink: 0 }}>
        <Typography variant="caption" fontWeight={900} color="text.secondary">
          {event.time.elapsed}'
        </Typography>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: iconBg,
            color: iconColor,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: 2,
            zIndex: 1,
          }}
        >
          <config.icon sx={{ fontSize: 18 }} />
        </Box>
      </Stack>

      {/* CONTENT */}
      <Box sx={{ flex: 1, pt: 4 }}>
        <EventContent event={event} label={config.label} />
      </Box>

      {/* TEAM LOGO */}
      <Avatar
        src={event.team.logo}
        sx={{
          width: 28,
          height: 28,
          mt: 4,
          border: `2px solid ${theme.palette.background.paper}`,
          boxShadow: 1,
        }}
      />
    </Box>
  );
};

const EventContent = ({ event, label }: any) => {
  if (event.type === "subst") {
    return (
      <Box>
        <Typography
          variant="caption"
          fontWeight={900}
          color="text.secondary"
          letterSpacing={1}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 800, color: "primary.main" }}
        >
          <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>IN:</span>{" "}
          {event.assist?.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 800, color: "error.main" }}
        >
          <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>OUT:</span>{" "}
          {event.player?.name}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight={900}
        color="primary.main"
        letterSpacing={1}
      >
        {label || event.type.toUpperCase()}
      </Typography>
      <Typography variant="body2" fontWeight={800}>
        {event.player?.name}
      </Typography>
      {event.assist?.name && (
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          Assist: {event.assist.name}
        </Typography>
      )}
      {event.comments && (
        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          sx={{ fontStyle: "italic" }}
        >
          {event.comments}
        </Typography>
      )}
    </Box>
  );
};
