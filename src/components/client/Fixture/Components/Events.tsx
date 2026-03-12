"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  IconButton,
  Popover,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  SportsSoccerRounded,
  StyleRounded,
  SwapHorizRounded,
  FlagRounded,
  FilterListRounded,
  AddReactionOutlined,
} from "@mui/icons-material";
import { doc, onSnapshot } from "firebase/firestore";

import { handleEventReaction } from "@/lib/firebase/client-actions";
import { clientDB } from "@/lib/firebase/client";
import { isLive } from "@/lib/utils/football-logic";

const EMOJI_OPTIONS = [
  "🔥",
  "⚽",
  "🤩",
  "🪄",
  "🤯",
  "🧱",
  "🤫",
  "🧤",
  "🤨",
  "🤡",
  "🤬",
];
const EVENT_THEMES: Record<string, any> = {
  Goal: {
    icon: SportsSoccerRounded,
    bg: "#A0E8AF",
    color: "#1a3b1e",
    label: "GOAL!",
  },
  Card: { icon: StyleRounded, bg: "#FEB2B2", color: "#742A2A" },
  subst: {
    icon: SwapHorizRounded,
    bg: "background.paper",
    color: "primary.main",
    label: "SUBSTITUTION",
  },
};

// Helper to identify events uniquely without an ID
const getEventKey = (event: any) =>
  `${event.time.elapsed}_${event.type}_${event.player?.id || "no-id"}`;

export default function Events({ events, groupId, currentYear, fixture }: any) {
  const theme = useTheme() as any;
  const [selectedType, setSelectedType] = useState("All");
  const [dbReactions, setDbReactions] = useState<any>({});
  const isMatchLive = isLive(fixture);

  // 1. LIVE LISTENER for event-specific reactions
  useEffect(() => {
    if (!groupId || !fixture?.id || !currentYear) return;

    const docRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/eventsReactions`,
      String(fixture.id),
    );

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setDbReactions(snap.data());
      }
    });

    return () => unsubscribe();
  }, [groupId, fixture?.id, currentYear]);

  const eventOptions = useMemo(() => {
    if (!events) return [];
    return [
      "All",
      ...Array.from(new Set(events.map((item: any) => item.type))),
    ];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedType === "All") return events;
    return events?.filter((item: any) => item.type === selectedType);
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
        <Select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          size="small"
          variant="standard"
          disableUnderline
          IconComponent={FilterListRounded}
          sx={{ fontSize: "0.75rem", fontWeight: 800, color: "text.secondary" }}
        >
          {eventOptions.map((opt: string) => (
            <MenuItem key={opt} value={opt} sx={{ fontWeight: 700 }}>
              {opt.toUpperCase()}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ maxHeight: 600, overflowY: "auto", py: 2 }}>
        {filteredEvents.map((event: any, index: number) => {
          const eventKey = getEventKey(event);

          return (
            <EventRow
              key={index}
              event={event}
              reactions={dbReactions[eventKey] || {}}
              isLast={index === filteredEvents.length - 1}
              groupId={groupId}
              currentYear={currentYear}
              matchId={fixture.id}
              eventKey={eventKey}
              isMatchLive={isMatchLive}
            />
          );
        })}
      </Box>
    </Paper>
  );
}

const EventRow = ({
  event,
  isLast,
  groupId,
  currentYear,
  matchId,
  reactions,
  eventKey,
  isMatchLive,
}: any) => {
  const theme = useTheme() as any;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleEmojiClick = async (emoji: string) => {
    setAnchorEl(null);
    if (!isMatchLive) return;
    try {
      await handleEventReaction({
        groupId,
        currentYear,
        matchId,
        event: event,
        moodKey: emoji,
        eventKey,
      });
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  const config = EVENT_THEMES[event.type] || {
    icon: FlagRounded,
    bg: "grey.100",
    color: "grey.700",
  };

  const isYellow = event.detail?.includes("Yellow");
  const iconBg = event.type === "Card" && isYellow ? "#F6E05E" : config.bg;
  const iconColor =
    event.type === "Card" && isYellow ? "#5F370E" : config.color;

  return (
    <Box sx={{ display: "flex", gap: 2, px: 2, py: 2, position: "relative" }}>
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: 38,
            top: 60,
            bottom: 0,
            width: 2,
            bgcolor: "divider",
            opacity: 0.5,
          }}
        />
      )}

      <Stack alignItems="center" spacing={1} sx={{ width: 45, flexShrink: 0 }}>
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
            zIndex: 1,
            boxShadow: 1,
          }}
        >
          <config.icon sx={{ fontSize: 18 }} />
        </Box>
      </Stack>

      <Box sx={{ flex: 1 }}>
        <EventContent event={event} label={config.label} />

        {/* REACTION SECTION */}
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}
        >
          {Object.entries(reactions).map(([emoji, count]: any) => (
            <Chip
              label={`${emoji} ${count}`}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.7rem",
                fontWeight: 800,
                borderRadius: "6px",
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderColor: alpha(theme.palette.divider, 0.5),
              }}
            />
          ))}

          {isMatchLive && (
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px dashed ${theme.palette.divider}`,
                width: 24,
                height: 24,
              }}
            >
              <AddReactionOutlined sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Stack>

        {isMatchLive && (
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            PaperProps={{
              sx: { p: 1, borderRadius: 3, boxShadow: theme.shadows[10] },
            }}
          >
            <Stack direction="row" spacing={0.5}>
              {EMOJI_OPTIONS.map((emoji) => (
                <IconButton
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  sx={{ fontSize: 20 }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Stack>
          </Popover>
        )}
      </Box>

      <Avatar
        src={event.team.logo}
        sx={{
          width: 28,
          height: 28,
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
    </Box>
  );
};
