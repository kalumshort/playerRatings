"use client";

import React from "react";
import { Box, Chip, Stack, Typography, keyframes, useTheme } from "@mui/material";

import type { LiveTable } from "@/lib/league/liveTable";

interface TableLegendProps {
  live: LiveTable;
  /** ISO string: when the provider last recomputed the official table. */
  fetchedAt: string | null;
}

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
`;

/**
 * How long ago, in words. Rendered on the client only — a relative time
 * computed on the server would be wrong by the time it arrived.
 */
const agoLabel = (iso: string | null): string | null => {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;

  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

/**
 * Says how live the table above it is, and how much to trust its ordering.
 *
 * The honesty is the point. A provisional position is our arithmetic, not the
 * competition's, and clubs level on points may be separated differently in the
 * official table — so the footnote says so rather than letting the table imply
 * a precision it does not have.
 */
export default function TableLegend({ live, fetchedAt }: TableLegendProps) {
  const theme = useTheme();
  const [ago, setAgo] = React.useState<string | null>(null);

  // After hydration, so the server and client markup agree.
  React.useEffect(() => setAgo(agoLabel(fetchedAt)), [fetchedAt]);

  const moved = live.groups
    .flatMap((group) => group.rows)
    .filter((row) => row.rankDelta !== 0).length;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        spacing={1}
        rowGap={0.75}
      >
        {live.inPlayCount > 0 && (
          <Chip
            size="small"
            label={`LIVE · ${live.inPlayCount} ${live.inPlayCount === 1 ? "match" : "matches"}`}
            sx={{
              fontWeight: 900,
              fontSize: "0.62rem",
              letterSpacing: 0.5,
              height: 22,
              color: theme.palette.error.main,
              bgcolor: `${theme.palette.error.main}22`,
              border: `1px solid ${theme.palette.error.main}55`,
              animation: `${pulse} 2s ease-in-out infinite`,
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
        )}

        {ago && (
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", opacity: 0.6, fontSize: "0.68rem" }}
          >
            Official table updated {ago}
          </Typography>
        )}
      </Stack>

      {live.isLive && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.75,
            color: "text.secondary",
            opacity: 0.55,
            fontSize: "0.66rem",
            lineHeight: 1.5,
          }}
        >
          {moved > 0
            ? "Positions are provisional. "
            : "Provisional — in-play results are included. "}
          Clubs level on points are ordered by goal difference, then goals
          scored; the official table may separate them differently.
          {live.reconciliation === "partial" &&
            " One recent result could not be matched against the official table and has been left out."}
        </Typography>
      )}
    </Box>
  );
}
