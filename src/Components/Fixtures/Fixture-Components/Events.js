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
} from "@mui/material";
import {
  SportsSoccerRounded,
  StyleRounded,
  SwapHorizRounded,
  FlagRounded,
  FilterListRounded,
} from "@mui/icons-material"; // Rounded Icons

export default function Events({ events }) {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState("All");

  const eventOptions = useMemo(() => {
    if (!events) return [];
    return ["All", ...new Set(events.map((item) => item.type))];
  }, [events]);

  const filteredEvents =
    selectedType === "All"
      ? events
      : events?.filter((item) => item.type === selectedType);

  // --- EMPTY STATE ---
  if (!events || events.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={(theme) => ({
          ...theme.clay.card,
          p: 4,
          textAlign: "center",
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography variant="body1" color="text.secondary" fontWeight="bold">
          No Match Events Yet
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        ...theme.clay.card, // 1. Global Clay Style
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        margin: "0px",
      })}
    >
      {/* --- HEADER --- */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor:
            theme.palette.mode === "light"
              ? "rgba(0,0,0,0.02)"
              : "rgba(255,255,255,0.02)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FlagRounded color="primary" />
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px">
            MATCH FEED
          </Typography>
        </Stack>

        {/* --- FILTER (Pressed Pill) --- */}
        <Box
          sx={(theme) => ({
            ...theme.clay.box, // Pressed Groove look
            borderRadius: "12px",
            bgcolor: "background.paper",
            px: 1.5,
            py: 0.5,
          })}
        >
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            size="small"
            variant="standard"
            disableUnderline
            IconComponent={FilterListRounded}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "text.secondary",
              "& .MuiSelect-select": {
                pr: 3,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                py: 0.5,
              },
              "& .MuiSvgIcon-root": {
                fontSize: "1.1rem",
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: 3,
                  mt: 1,
                  boxShadow: theme.shadows[4],
                  border: `1px solid ${theme.palette.divider}`,
                },
              },
            }}
          >
            {eventOptions.map((opt) => (
              <MenuItem
                key={opt}
                value={opt}
                sx={{ fontSize: "0.8rem", fontWeight: 600 }}
              >
                {opt.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {/* --- SCROLLABLE LIST --- */}
      <Box
        sx={{
          maxHeight: 500,
          overflowY: "auto",
          overflowX: "hidden",
          p: 0,
          pb: 2,
        }}
      >
        {filteredEvents.map((event, index) => (
          <EventItem
            key={index}
            event={event}
            isLast={index === filteredEvents.length - 1}
          />
        ))}
      </Box>
    </Paper>
  );
}

// --- SUB-COMPONENTS ---

const EventItem = ({ event, isLast }) => {
  const theme = useTheme();

  let EventIcon = FlagRounded;
  let iconColor = theme.palette.text.secondary;
  let iconBg = theme.palette.background.default;
  let borderColor = "transparent";

  switch (event.type) {
    case "Goal":
      EventIcon = SportsSoccerRounded;
      iconColor = "#1a3b1e"; // Dark Green
      iconBg = "#A0E8AF"; // Matcha
      borderColor = "#2F5C34";
      break;
    case "Card":
      EventIcon = StyleRounded;
      if (event.detail === "Yellow Card") {
        iconColor = "#5F370E";
        iconBg = "#F6E05E"; // Pastel Yellow
        borderColor = "#D69E2E";
      } else {
        iconColor = "#742A2A";
        iconBg = "#FEB2B2"; // Pastel Red
        borderColor = "#C53030";
      }
      break;
    case "subst":
      EventIcon = SwapHorizRounded;
      iconColor = theme.palette.primary.main;
      iconBg = theme.palette.background.paper;
      borderColor = theme.palette.divider;
      break;
    default:
      break;
  }

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        gap: 2.5,
        p: 2.5,
        width: "100%",
        boxSizing: "border-box",
        transition: "background-color 0.2s",
        "&:hover": { bgcolor: theme.palette.action.hover },
      }}
    >
      {/* TIMELINE CONNECTOR */}
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: 39, // Aligned center with icon (20 + 2.5padding + width/2)
            top: 55,
            bottom: 0,
            width: "2px",
            bgcolor: theme.palette.divider,
            opacity: 0.6,
            borderRadius: 1,
          }}
        />
      )}

      {/* Left Column: Time & Icon */}
      <Stack
        alignItems="center"
        spacing={1}
        sx={{ minWidth: 40, width: 40, flexShrink: 0 }}
      >
        <Typography variant="caption" fontWeight={800} color="text.secondary">
          {event.time.elapsed}'
        </Typography>

        {/* Floating Icon Sphere */}
        <Box
          sx={(theme) => ({
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: iconBg,
            color: iconColor,
            display: "grid",
            placeItems: "center",

            // 3D Button Look
            border: `1px solid ${borderColor}`,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",

            zIndex: 1,
          })}
        >
          <EventIcon sx={{ fontSize: 20 }} />
        </Box>
      </Stack>

      {/* Center Column: Details */}
      <Box sx={{ flex: 1, pt: 0.5, minWidth: 0 }}>
        <EventDetailsContent event={event} />
      </Box>

      {/* Right Column: Logo */}
      <Box sx={{ pt: 1, width: 28, flexShrink: 0 }}>
        <Avatar
          src={event.team.logo}
          sx={{
            width: 28,
            height: 28,
            border: `2px solid ${theme.palette.background.default}`,
            boxShadow: theme.shadows[2],
          }}
        />
      </Box>
    </Box>
  );
};

const EventDetailsContent = ({ event }) => {
  const wrapStyle = {
    whiteSpace: "normal",
    wordBreak: "break-word",
    display: "block",
  };

  if (event.type === "subst") {
    return (
      <>
        <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
          SUBSTITUTION
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: 600,
              ...wrapStyle,
            }}
          >
            <Box
              component="span"
              sx={{ color: "primary.main", fontWeight: 900 }}
            >
              IN
            </Box>
            {event.assist.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: 600,
              color: "text.disabled",
              ...wrapStyle,
            }}
          >
            <Box component="span" sx={{ color: "error.main", fontWeight: 900 }}>
              OUT
            </Box>
            {event.player.name}
          </Typography>
        </Stack>
      </>
    );
  }
  if (event.type === "Goal") {
    return (
      <>
        <Typography
          variant="subtitle2"
          fontWeight={900}
          sx={{ color: "primary.dark", letterSpacing: 1 }}
        >
          GOAL!
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={wrapStyle}>
          {event.player.name}
        </Typography>
        {event.assist.name && (
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={wrapStyle}
          >
            Assist: {event.assist.name}
          </Typography>
        )}
      </>
    );
  }
  if (event.type === "Card") {
    return (
      <>
        <Typography variant="subtitle2" fontWeight={800}>
          {event.detail}
        </Typography>
        <Typography variant="body2" sx={wrapStyle}>
          {event.player.name}
        </Typography>
        {event.comments && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ ...wrapStyle, mt: 0.5, fontStyle: "italic" }}
          >
            {event.comments}
          </Typography>
        )}
      </>
    );
  }
  return (
    <>
      <Typography variant="subtitle2" fontWeight={800}>
        {event.detail}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={wrapStyle}>
        {event.player.name}
      </Typography>
    </>
  );
};
