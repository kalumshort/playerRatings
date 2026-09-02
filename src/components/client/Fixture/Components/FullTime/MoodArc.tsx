"use client";

import React, { useMemo } from "react";
import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";

import MoodAreaChart from "../FanMoodSelector/MoodAreaChart";
import { getStatus } from "../FanMoodSelector/moodConfig";
import { biggestMoodSwing, finalMood } from "@/lib/live/matchStory";

interface MoodArcProps {
  matchMoods: Record<string, Record<string, number>> | null;
  events: any[];
}

/**
 * How the room felt, and the moment it turned.
 *
 * Reuses the live mood chart wholesale rather than drawing a second one —
 * fans recognise the shape from during the match, and a full-time redraw in a
 * different visual language would read as a different statistic.
 */
export default function MoodArc({ matchMoods, events }: MoodArcProps) {
  const theme = useTheme();

  const swing = useMemo(() => biggestMoodSwing(matchMoods), [matchMoods]);
  const ended = useMemo(() => finalMood(matchMoods), [matchMoods]);

  if (!matchMoods || Object.keys(matchMoods).length === 0) return null;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2" fontWeight={900}>
          The mood
        </Typography>
        {ended && (
          <Typography variant="caption" fontWeight={900} letterSpacing={0.5}>
            ENDED {ended.label}
          </Typography>
        )}
      </Stack>

      <MoodAreaChart matchMoods={matchMoods} events={events} />

      {swing && Math.abs(swing.delta) >= 5 && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.25,
            borderRadius: "10px",
            bgcolor: alpha(
              getStatus(swing.to).color,
              theme.palette.mode === "dark" ? 0.18 : 0.4,
            ),
          }}
        >
          <Typography variant="caption" fontWeight={800}>
            Biggest swing at {swing.minute}&apos; — the room went{" "}
            {getStatus(swing.from).label.toLowerCase()} to{" "}
            {swing.label.toLowerCase()}.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
