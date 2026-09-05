"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { ArrowRight } from "lucide-react";

import useLiveLeagueTable from "@/Hooks/useLiveLeagueTable";
import {
  windowAround,
  type LiveStandingRow,
  type LiveTable,
} from "@/lib/league/liveTable";
import type { LeagueStandings } from "@/lib/league/standings";
import { withSeasonParam } from "@/lib/config/season";

interface MiniLeagueTableProps {
  standings: LeagueStandings;
  initialLive: LiveTable;
  leagueId: number;
  season: string;
  clubId: string;
  clubSlug: string;
}

/**
 * The club's corner of the table, for the club home page.
 *
 * Three rows: the club, whoever is above it and whoever is below. That is the
 * question a fan actually has on a home page — am I climbing or slipping —
 * and it is the part of a twenty-row table worth the space.
 *
 * Live, through the same hook the full table uses, so a goal moves this too.
 */
export default function MiniLeagueTable({
  standings,
  initialLive,
  leagueId,
  season,
  clubId,
  clubSlug,
}: MiniLeagueTableProps) {
  const theme = useTheme() as any;
  const live = useLiveLeagueTable(standings, initialLive, leagueId, season);
  const table = live ?? initialLive;

  // A club is in exactly one group, so the group holding it is the one worth
  // showing — for a league that is the only group anyway.
  const rows = useMemo(() => {
    const group =
      table.groups.find((candidate) =>
        candidate.rows.some((row) => row.teamId === String(clubId)),
      ) ?? table.groups[0];

    return group ? windowAround(group.rows, String(clubId), 3) : [];
  }, [table, clubId]);

  if (rows.length === 0) return null;

  return (
    <Paper sx={{ ...theme.clay?.card, p: { xs: 1.75, md: 2 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.25 }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 900, letterSpacing: 1.5, opacity: 0.6 }}
        >
          {standings.name.toUpperCase()}
        </Typography>

        {table.inPlayCount > 0 && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 900,
              fontSize: "0.58rem",
              letterSpacing: 0.5,
              color: theme.palette.error.main,
            }}
          >
            LIVE
          </Typography>
        )}
      </Stack>

      <Stack spacing={0.25}>
        {rows.map((row) => (
          <MiniRow
            key={row.teamId}
            row={row}
            isClub={row.teamId === String(clubId)}
          />
        ))}
      </Stack>

      <Box
        component={Link}
        href={withSeasonParam(`/${clubSlug}/table`, season)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          mt: 1.25,
          pt: 1.25,
          borderTop: `1px solid ${theme.palette.divider}`,
          textDecoration: "none",
          color: "text.secondary",
          fontSize: "0.68rem",
          fontWeight: 800,
          "&:hover": { color: "text.primary" },
        }}
      >
        Full table
        <ArrowRight size={13} />
      </Box>
    </Paper>
  );
}

const MiniRow = ({
  row,
  isClub,
}: {
  row: LiveStandingRow;
  isClub: boolean;
}) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        px: 0.75,
        py: 0.75,
        borderRadius: "8px",
        bgcolor: isClub
          ? alpha(theme.palette.primary.main, 0.12)
          : "transparent",
        border: isClub
          ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
          : "1px solid transparent",
      }}
    >
      <Box
        sx={{
          width: 18,
          textAlign: "center",
          fontSize: "0.72rem",
          fontWeight: 900,
          color: "text.secondary",
        }}
      >
        {row.rank ?? "–"}
      </Box>

      {/* Movement against the official table, in the same vocabulary the full
          table uses. Transparent when nothing moved, so rows stay aligned. */}
      <Box
        sx={{
          width: 10,
          textAlign: "center",
          fontSize: "0.55rem",
          fontWeight: 900,
          lineHeight: 1,
          color:
            row.rankDelta > 0
              ? theme.palette.success.main
              : row.rankDelta < 0
                ? theme.palette.error.main
                : "transparent",
        }}
      >
        {row.rankDelta > 0 ? "▲" : row.rankDelta < 0 ? "▼" : "·"}
      </Box>

      <Avatar
        src={row.teamLogo}
        alt=""
        sx={{ width: 20, height: 20, bgcolor: "transparent" }}
        imgProps={{ loading: "lazy", decoding: "async" }}
      />

      <Typography
        noWrap
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: "0.75rem",
          fontWeight: isClub ? 900 : 600,
        }}
      >
        {row.teamName}
      </Typography>

      {row.liveMatch && (
        <Box
          component="span"
          aria-label={`Playing, ${row.liveMatch.scored}-${row.liveMatch.conceded}`}
          sx={{
            fontSize: "0.58rem",
            fontWeight: 900,
            color: theme.palette.error.main,
            whiteSpace: "nowrap",
          }}
        >
          {row.liveMatch.scored}-{row.liveMatch.conceded}
        </Box>
      )}

      <Box
        sx={{
          width: 22,
          textAlign: "right",
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "text.secondary",
        }}
      >
        {row.all.played}
      </Box>

      <Box
        sx={{
          width: 24,
          textAlign: "right",
          fontSize: "0.8rem",
          fontWeight: 900,
          color: row.provisional ? theme.palette.primary.main : "text.primary",
        }}
      >
        {row.points}
      </Box>
    </Stack>
  );
};
