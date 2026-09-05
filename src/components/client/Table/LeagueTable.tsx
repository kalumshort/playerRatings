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

import {
  type LeagueStandings,
  type StandingRow,
  zoneOf,
} from "@/lib/league/standings";

interface LeagueTableProps {
  standings: LeagueStandings;
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
export default function LeagueTable({ standings, clubId }: LeagueTableProps) {
  const theme = useTheme() as any;
  const deducted = standings.groups
    .flatMap((group) => group.rows)
    .some((row) => row.pointsAdjustment !== 0);

  return (
    <Paper sx={{ ...theme.clay?.card, p: { xs: 1.5, md: 2.5 } }}>
      {standings.groups.map((group, index) => (
        <Box key={group.name} sx={{ mt: index === 0 ? 0 : 3 }}>
          {/* A single-table competition already has its name in the page
              heading, so only a real group stage labels its groups. */}
          {standings.groups.length > 1 && (
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
const zoneColour = (row: StandingRow, theme: any): string | null => {
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

const TableRow = ({ row, isClub }: { row: StandingRow; isClub: boolean }) => {
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
