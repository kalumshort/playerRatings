"use client";

import React from "react";
import {
  Avatar,
  Box,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import { type LeagueStandings, zoneOf } from "@/lib/league/standings";
import type { LiveStandingRow, LiveTable } from "@/lib/league/liveTable";

interface LeagueTableProps {
  standings: LeagueStandings;
  /**
   * The provisional table. When absent the official rows are rendered as-is,
   * which is what an archived season wants.
   */
  live?: LiveTable;
  /** The club whose page this is, highlighted in the table. */
  clubId?: string;
}

/** Column widths, shared by the header and every row so they can't drift. */
const COLS = {
  rank: 26,
  played: 26,
  win: 24,
  draw: 24,
  lose: 24,
  diff: 34,
  points: 32,
};

/**
 * A competition's official table.
 *
 * Renders whatever groups the standings document carries: one for a domestic
 * league or a European league phase, several for a group stage.
 */
export default function LeagueTable({
  standings,
  live,
  clubId,
}: LeagueTableProps) {
  const theme = useTheme() as any;

  // The live table when there is one, otherwise the official rows widened to
  // the same shape so the row renderer only has one case to handle.
  const groups =
    live?.groups ??
    standings.groups.map((group) => ({
      name: group.name,
      rows: group.rows.map((row) => ({
        ...row,
        baseRank: row.rank,
        rankDelta: 0,
        provisional: false,
      })) as LiveStandingRow[],
    }));

  const deducted = groups
    .flatMap((group) => group.rows)
    .some((row) => row.pointsAdjustment !== 0);

  return (
    <Paper sx={{ ...theme.clay?.card, p: { xs: 1.5, md: 2.5 } }}>
      {groups.map((group, index) => (
        <Box key={group.name} sx={{ mt: index === 0 ? 0 : 3 }}>
          {/* A single-table competition already has its name in the page
              heading, so only a real group stage labels its groups. */}
          {groups.length > 1 && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontWeight: 900,
                letterSpacing: 1.5,
                opacity: 0.6,
                mb: 1,
                px: 1.25,
              }}
            >
              {group.name.toUpperCase()}
            </Typography>
          )}

          <HeaderRow />

          <Stack spacing={0.25}>
            {group.rows.map((row) => (
              <TableRow
                key={row.teamId}
                row={row}
                isClub={Boolean(clubId) && row.teamId === String(clubId)}
              />
            ))}
          </Stack>
        </Box>
      ))}

      {deducted && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 2,
            px: 1.25,
            color: "text.secondary",
            opacity: 0.7,
            fontSize: "0.68rem",
          }}
        >
          * Points total includes an adjustment applied by the competition.
        </Typography>
      )}
    </Paper>
  );
}

/** The column headings, aligned to the same widths the rows use. */
const HeaderRow = () => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    sx={{
      px: 1.25,
      pb: 0.75,
      color: "text.secondary",
      opacity: 0.55,
      fontSize: "0.62rem",
      fontWeight: 800,
      letterSpacing: 0.5,
    }}
  >
    <Box sx={{ width: COLS.rank }} />
    <Box sx={{ width: 14 }} />
    <Box sx={{ width: 26 }} />
    <Box sx={{ flex: 1, minWidth: 0 }}>CLUB</Box>
    <Box sx={{ width: COLS.played, textAlign: "center" }}>P</Box>
    <Box sx={{ width: COLS.win, textAlign: "center", display: { xs: "none", sm: "block" } }}>W</Box>
    <Box sx={{ width: COLS.draw, textAlign: "center", display: { xs: "none", sm: "block" } }}>D</Box>
    <Box sx={{ width: COLS.lose, textAlign: "center", display: { xs: "none", sm: "block" } }}>L</Box>
    <Box sx={{ width: COLS.diff, textAlign: "center" }}>GD</Box>
    <Box sx={{ width: COLS.points, textAlign: "right" }}>PTS</Box>
  </Stack>
);

/** Zone stripe colours, keyed off the API's own free-text description. */
const zoneColour = (row: LiveStandingRow, theme: any): string | null => {
  switch (zoneOf(row.description)) {
    case "champions-league":
      return theme.palette.info.main;
    case "europa-league":
      return theme.palette.primary.main;
    case "conference-league":
      return theme.palette.success.main;
    case "promotion":
      return theme.palette.success.main;
    case "play-off":
      return theme.palette.warning.main;
    case "relegation":
      return theme.palette.error.main;
    default:
      return null;
  }
};

const TableRow = ({
  row,
  isClub,
}: {
  row: LiveStandingRow;
  isClub: boolean;
}) => {
  const theme = useTheme() as any;
  const stripe = zoneColour(row, theme);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        px: 1.25,
        py: 0.75,
        borderRadius: "8px",
        transition: "background-color 0.4s ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        // The club whose page this is, highlighted the same way the fan
        // leaderboard marks the signed-in user.
        bgcolor: isClub
          ? alpha(theme.palette.primary.main, 0.12)
          : "transparent",
        border: isClub
          ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
          : "1px solid transparent",
        // The zone stripe sits inside the row's own left edge so it lines up
        // whether or not the row is highlighted.
        boxShadow: stripe ? `inset 3px 0 0 ${stripe}` : "none",
      }}
    >
      <Box
        sx={{
          width: COLS.rank,
          textAlign: "center",
          fontWeight: 900,
          fontSize: "0.8rem",
          color: "text.secondary",
        }}
      >
        {row.rank ?? "–"}
      </Box>

      {/* Movement against the official table. Fixed width so a row that has
          not moved still lines up with one that has. */}
      <Box
        sx={{
          width: 14,
          textAlign: "center",
          fontSize: "0.6rem",
          fontWeight: 900,
          lineHeight: 1,
          color:
            row.rankDelta > 0
              ? theme.palette.success.main
              : row.rankDelta < 0
                ? theme.palette.error.main
                : "transparent",
        }}
        aria-label={
          row.rankDelta === 0
            ? undefined
            : `${Math.abs(row.rankDelta)} ${row.rankDelta > 0 ? "up" : "down"} on the official table`
        }
      >
        {row.rankDelta > 0 ? "▲" : row.rankDelta < 0 ? "▼" : "·"}
      </Box>

      <Avatar
        src={row.teamLogo}
        alt=""
        sx={{ width: 22, height: 22, bgcolor: "transparent" }}
        imgProps={{ loading: "lazy", decoding: "async" }}
      />

      <Typography
        noWrap
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: "0.8rem",
          fontWeight: isClub ? 900 : 700,
        }}
      >
        {row.teamName}
        {row.pointsAdjustment !== 0 && (
          <Tooltip
            arrow
            title={`${row.pointsAdjustment > 0 ? "+" : ""}${row.pointsAdjustment} points applied by the competition`}
          >
            <Box
              component="span"
              sx={{
                ml: 0.5,
                fontSize: "0.7rem",
                fontWeight: 900,
                color: "text.secondary",
                cursor: "help",
              }}
            >
              *
            </Box>
          </Tooltip>
        )}
      </Typography>

      <Cell width={COLS.played}>{row.all.played}</Cell>
      <Cell width={COLS.win} hideOnMobile>
        {row.all.win}
      </Cell>
      <Cell width={COLS.draw} hideOnMobile>
        {row.all.draw}
      </Cell>
      <Cell width={COLS.lose} hideOnMobile>
        {row.all.lose}
      </Cell>
      <Cell width={COLS.diff}>
        {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
      </Cell>

      <Box
        sx={{
          width: COLS.points,
          textAlign: "right",
          fontWeight: 900,
          fontSize: "0.85rem",
          // A points total that includes a match still being played is tinted,
          // so the number never silently claims to be the official one.
          color: row.provisional ? theme.palette.primary.main : "text.primary",
        }}
      >
        {row.points}
      </Box>
    </Stack>
  );
};

const Cell = ({
  width,
  hideOnMobile = false,
  children,
}: {
  width: number;
  hideOnMobile?: boolean;
  children: React.ReactNode;
}) => (
  <Box
    sx={{
      width,
      textAlign: "center",
      fontSize: "0.75rem",
      fontWeight: 700,
      color: "text.secondary",
      display: hideOnMobile ? { xs: "none", sm: "block" } : "block",
    }}
  >
    {children}
  </Box>
);
