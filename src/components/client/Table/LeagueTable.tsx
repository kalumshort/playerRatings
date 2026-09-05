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
  keyframes,
  useTheme,
} from "@mui/material";

import type { LeagueStandings } from "@/lib/league/standings";
import {
  cloneRow,
  type LiveMatch,
  type LiveStandingRow,
  type LiveTable,
} from "@/lib/league/liveTable";

const livePulse = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
`;

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
  // the same shape so the row renderer only has one case to handle. cloneRow
  // is the same widening the overlay uses, so the two cannot disagree about
  // what a row looks like.
  const groups =
    live?.groups ??
    standings.groups.map((group) => ({
      name: group.name,
      rows: group.rows.map(cloneRow) as LiveStandingRow[],
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

/**
 * Zone stripe colours.
 *
 * Keyed off `row.zone`, which the overlay assigns by position — not off the
 * row's own description, which belongs to whichever club held that place in
 * the official table and travels with them when the live table re-ranks.
 */
const zoneColour = (row: LiveStandingRow, theme: any): string | null => {
  switch (row.zone) {
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

      {/* The name shrinks and ellipsises; the live badge does not. Sharing one
          noWrap element made a long club name eat the badge and spill it onto
          a second line on a phone. */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{ flex: 1, minWidth: 0 }}
      >
        <Typography
          noWrap
          sx={{
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

        {row.liveMatch && <LiveMatchTag match={row.liveMatch} />}
      </Stack>

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

/** How far into the match, in the form a score bug uses. */
const minuteLabel = (match: LiveMatch): string => {
  if (match.status === "HT") return "HT";
  if (match.status === "P") return "PENS";
  if (match.status === "SUSP" || match.status === "INT") return "SUSP";
  return match.elapsed != null ? `${match.elapsed}'` : "LIVE";
};

/**
 * The match a club is playing, on its own row.
 *
 * The score is from this club's point of view — the table is read down a
 * column of clubs, so "2-1" next to a name has to mean that club is winning,
 * whichever end of the fixture they are.
 */
const LiveMatchTag = ({ match }: { match: LiveMatch }) => {
  const theme = useTheme();

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        flexShrink: 0,
        whiteSpace: "nowrap",
        px: 0.6,
        py: 0.1,
        borderRadius: "5px",
        fontSize: "0.6rem",
        fontWeight: 800,
        letterSpacing: 0.2,
        color: theme.palette.error.main,
        bgcolor: alpha(theme.palette.error.main, 0.12),
        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
      }}
      // The row already reads out the club and its figures; this gives a
      // screen reader the match in one phrase rather than four fragments.
      aria-label={`Playing ${match.opponentName ?? "opponent"} ${match.isHome ? "at home" : "away"}, ${match.scored}-${match.conceded}, ${minuteLabel(match)}`}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          bgcolor: theme.palette.error.main,
          animation: `${livePulse} 1.6s ease-in-out infinite`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      />
      <Box component="span" aria-hidden>
        {match.scored}-{match.conceded}
        {/* The opponent is the first thing to go on a narrow screen: the
            score and the minute are what the row is for, and the fixture
            list is one tap away. */}
        <Box
          component="span"
          sx={{
            display: { xs: "none", sm: "inline" },
            opacity: 0.75,
            fontWeight: 700,
            ml: 0.5,
          }}
        >
          {match.isHome ? "v" : "@"} {shortName(match.opponentName)}
        </Box>
        <Box component="span" sx={{ opacity: 0.6, ml: 0.5 }}>
          {minuteLabel(match)}
        </Box>
      </Box>
    </Box>
  );
};

/** Enough of an opponent's name to recognise them without wrapping the row. */
const shortName = (name: string | null): string => {
  if (!name) return "";
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
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
