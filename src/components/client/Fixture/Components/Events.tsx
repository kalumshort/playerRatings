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
import { toast } from "sonner";
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
const buildEventThemes = (theme: any): Record<string, any> => ({
  Goal: {
    icon: SportsSoccerRounded,
    bg: theme.palette.event.goal,
    color: theme.palette.event.goalText,
    label: "GOAL!",
  },
  Card: {
    icon: StyleRounded,
    bg: theme.palette.cards.red,
    color: theme.palette.cards.redText,
  },
  subst: {
    icon: SwapHorizRounded,
    bg: theme.palette.background.paper,
    color: theme.palette.primary.main,
    label: "SUBSTITUTION",
  },
});

// Helper to identify events uniquely without an ID.
// NOTE: this is the map key inside groups/{gid}/seasons/{yr}/eventsReactions/{fixtureId}.
// Changing its format orphans every reaction already recorded.
const getEventKey = (event: any) =>
  `${event.time.elapsed}_${event.type}_${event.player?.id || "no-id"}`;

// Module-level so the "no reactions" case keeps a stable reference — a fresh
// {} per row per render would defeat EventRow's memo.
const EMPTY_REACTIONS: Record<string, number> = {};

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

  // One config for the whole list rather than one per row per render.
  const eventThemes = useMemo(() => buildEventThemes(theme), [theme]);

  const eventOptions = useMemo(() => {
    if (!events) return [];
    return [
      "All",
      ...Array.from(new Set(events.map((item: any) => item.type))),
    ];
  }, [events]);

  // Keys are computed over the UNFILTERED list so a row's React identity
  // survives a filter change. With key={index} the open reaction Popover stayed
  // bound to whichever event moved into that slot.
  //
  // getEventKey is the Firestore map key inside eventsReactions/{fixtureId} and
  // must not change, but it can genuinely collide (a goal and a VAR-disallowed
  // goal in the same minute are both type "Goal"), so the React key gets a
  // suffix while the Firestore key stays untouched.
  const keyedEvents = useMemo(() => {
    const seen = new Map<string, number>();
    return (events ?? []).map((event: any) => {
      const eventKey = getEventKey(event);
      const n = seen.get(eventKey) ?? 0;
      seen.set(eventKey, n + 1);
      return {
        event,
        eventKey,
        reactKey: n === 0 ? eventKey : `${eventKey}#${n}`,
      };
    });
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedType === "All") return keyedEvents;
    return keyedEvents.filter(({ event }) => event.type === selectedType);
  }, [keyedEvents, selectedType]);

  if (!events || events.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <FlagRounded sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
        <Typography variant="body2" color="text.secondary" fontWeight={800}>
          Awaiting match events...
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
    >
      <Box
        sx={{
          p: 2.5,
          borderBottom: 1,
          borderColor: "divider",
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
        {filteredEvents.map(({ event, eventKey, reactKey }, index: number) => {
          return (
            <EventRow
              key={reactKey}
              event={event}
              reactions={dbReactions[eventKey] || EMPTY_REACTIONS}
              isLast={index === filteredEvents.length - 1}
              groupId={groupId}
              currentYear={currentYear}
              matchId={fixture.id}
              eventKey={eventKey}
              isMatchLive={isMatchLive}
              themes={eventThemes}
            />
          );
        })}
      </Box>
    </Paper>
  );
}

const EventRowBase = ({
  event,
  isLast,
  groupId,
  currentYear,
  matchId,
  reactions,
  eventKey,
  isMatchLive,
  themes,
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
      toast.error("Couldn't add your reaction.", { id: "event-reaction" });
    }
  };

  // Built once by the parent and passed in — this used to rebuild a config
  // object (with icon components) for every row on every render.
  const config = themes[event.type] || {
    icon: FlagRounded,
    bg: theme.palette.background.default,
    color: theme.palette.text.secondary,
  };

  const isYellow = event.detail?.includes("Yellow");
  const iconBg =
    event.type === "Card" && isYellow ? theme.palette.cards.yellow : config.bg;
  const iconColor =
    event.type === "Card" && isYellow
      ? theme.palette.cards.yellowText
      : config.color;

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
              key={emoji}
              label={`${emoji} ${count}`}
              size="small"
              sx={{
                height: 24,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}
            />
          ))}

          {isMatchLive && (
            <IconButton
              aria-label="Add a reaction"
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.05),
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
            PaperProps={{ sx: { p: 1 } }}
          >
            <Stack direction="row" spacing={0.5}>
              {EMOJI_OPTIONS.map((emoji) => (
                <IconButton
                  key={emoji}
                  aria-label={`React with ${emoji}`}
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
        }}
      />
    </Box>
  );
};

// Props are now all stable (see EMPTY_REACTIONS and the hoisted themes), so
// rows stop re-rendering on every live fixture tick.
const EventRow = React.memo(EventRowBase);

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
          <Box
            component="span"
            sx={{ opacity: 0.6, fontSize: "0.7rem" }}
          >
            IN:
          </Box>{" "}
          {event.assist?.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 800, color: "error.main" }}
        >
          <Box
            component="span"
            sx={{ opacity: 0.6, fontSize: "0.7rem" }}
          >
            OUT:
          </Box>{" "}
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
