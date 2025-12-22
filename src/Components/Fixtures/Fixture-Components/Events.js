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
  SportsSoccer,
  Style,
  SwapHoriz,
  Flag,
  FilterList,
} from "@mui/icons-material";

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

  if (!events || events.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          borderStyle: "dashed",
          borderColor: "divider",
        }}
        elevation={0}
      >
        <Typography variant="body1" color="text.secondary">
          No Match Events Yet
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      elevation={0}
      className="containerMargin"
    >
      {/* --- HEADER --- */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.action.hover,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Flag fontSize="small" color="primary" />
          <Typography variant="caption">MATCH FEED</Typography>
        </Stack>

        <Select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          size="small"
          variant="standard"
          disableUnderline
          IconComponent={FilterList}
          sx={{
            fontSize: "0.8rem",
            color: "text.secondary",
            "& .MuiSelect-select": {
              pr: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
            },
          }}
          MenuProps={{
            PaperProps: { sx: { borderRadius: 2, mt: 1, minWidth: 120 } },
          }}
        >
          {eventOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt.toUpperCase()}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* --- SCROLLABLE LIST (No Horizontal Scroll) --- */}
      <Box
        sx={{
          maxHeight: 400,
          overflowY: "auto",
          overflowX: "hidden", // STRICTLY PREVENT HORIZONTAL SCROLL
          p: 0,
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
  let EventIcon = Flag;
  let iconColor = theme.palette.text.secondary;
  let iconBg = theme.palette.action.selected;

  switch (event.type) {
    case "Goal":
      EventIcon = SportsSoccer;
      iconColor = "#000";
      iconBg = theme.palette.primary.main;
      break;
    case "Card":
      EventIcon = Style;
      if (event.detail === "Yellow Card") {
        iconColor = "#000";
        iconBg = "#FFD600";
      } else {
        iconColor = "#fff";
        iconBg = "#D50000";
      }
      break;
    case "subst":
      EventIcon = SwapHoriz;
      iconColor = theme.palette.primary.contrastText;
      iconBg = theme.palette.text.secondary;
      break;
    default:
      break;
  }

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        gap: 2,
        p: 2,
        width: "100%",
        boxSizing: "border-box",
        "&:hover": { bgcolor: theme.palette.action.hover },
      }}
    >
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: 36,
            top: 48,
            bottom: 0,
            width: 1,
            bgcolor: theme.palette.divider,
          }}
        />
      )}

      {/* Time Column (Fixed Width) */}
      <Stack
        alignItems="center"
        spacing={1}
        sx={{ minWidth: 40, width: 40, flexShrink: 0 }}
      >
        <Typography variant="caption">{event.time.elapsed}'</Typography>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            bgcolor: iconBg,
            color: iconColor,
            display: "grid",
            placeItems: "center",
            boxShadow: `0 2px 8px ${iconBg}40`,
            zIndex: 1,
          }}
        >
          <EventIcon sx={{ fontSize: 18 }} />
        </Box>
      </Stack>

      {/* Details Column (Flexible) */}
      <Box
        sx={{
          flex: 1,
          pt: 0.5,
          minWidth: 0 /* CRITICAL FIX: Allows text wrapping in flex child */,
        }}
      >
        <EventDetailsContent event={event} />
      </Box>

      {/* Logo Column (Fixed Width) */}
      <Box sx={{ pt: 1, width: 24, flexShrink: 0 }}>
        <Avatar
          src={event.team.logo}
          sx={{ width: 24, height: 24, opacity: 0.8 }}
        />
      </Box>
    </Box>
  );
};

const EventDetailsContent = ({ event }) => {
  const theme = useTheme();

  // Typography helper to force wrapping
  const wrapStyle = {
    whiteSpace: "normal",
    wordBreak: "break-word",
    display: "block",
  };

  if (event.type === "subst") {
    return (
      <>
        <Typography variant="body2" fontWeight="bold">
          Substitution
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: theme.palette.primary.main,
              ...wrapStyle,
            }}
          >
            <Box
              component="span"
              sx={{ color: "success.main", fontWeight: "bold" }}
            >
              IN:
            </Box>{" "}
            {event.assist.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.secondary",
              ...wrapStyle,
            }}
          >
            <Box
              component="span"
              sx={{ color: "error.main", fontWeight: "bold" }}
            >
              OUT:
            </Box>{" "}
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
          variant="body2"
          fontWeight="bold"
          sx={{ color: theme.palette.primary.main }}
        >
          GOAL!
        </Typography>
        <Typography variant="body2" sx={wrapStyle}>
          {event.player.name}
        </Typography>
        {event.assist.name && (
          <Typography variant="caption" color="text.secondary" sx={wrapStyle}>
            Assist: {event.assist.name}
          </Typography>
        )}
      </>
    );
  }
  if (event.type === "Card") {
    return (
      <>
        <Typography variant="body2" fontWeight="bold">
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
            sx={wrapStyle}
          >
            {event.comments}
          </Typography>
        )}
      </>
    );
  }
  return (
    <>
      <Typography variant="body2" fontWeight="bold">
        {event.detail}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={wrapStyle}>
        {event.player.name}
      </Typography>
    </>
  );
};
