"use client";

import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";

/**
 * Shown when a fixture isn't in a state that has any interactive content —
 * postponed, cancelled, abandoned, awarded or a walkover. Previously both
 * fixture containers returned null here, leaving an empty page under the
 * header with no explanation.
 */
const COPY: Record<string, { title: string; body: string }> = {
  PST: {
    title: "MATCH POSTPONED",
    body: "This fixture has been postponed. Predictions and ratings will open once a new date is confirmed.",
  },
  CANC: {
    title: "MATCH CANCELLED",
    body: "This fixture was cancelled, so there's nothing to predict or rate.",
  },
  ABD: {
    title: "MATCH ABANDONED",
    body: "This fixture was abandoned before it could finish. Ratings are closed.",
  },
  AWD: {
    title: "RESULT AWARDED",
    body: "This result was awarded off the pitch, so there are no fan ratings for it.",
  },
  WO: {
    title: "WALKOVER",
    body: "This fixture was a walkover — no match was played.",
  },
};

const FALLBACK = {
  title: "MATCH UNAVAILABLE",
  body: "There's nothing to show for this fixture yet. Check back closer to kick-off.",
};

export default function FixtureUnavailable({ status }: { status?: string }) {
  const { title, body } = COPY[status ?? ""] ?? FALLBACK;

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Paper
        sx={{
          p: { xs: 4, md: 6 },
          textAlign: "center",
          maxWidth: 520,
          mx: "auto",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "action.hover",
              color: "text.secondary",
            }}
          >
            <EventBusyRoundedIcon sx={{ fontSize: 32 }} />
          </Box>

          <Typography variant="h6" fontWeight={900} letterSpacing={1}>
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {body}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
