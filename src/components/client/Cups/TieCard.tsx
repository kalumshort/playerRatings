"use client";

import React from "react";
import { Avatar, Box, Stack, Typography, alpha, useTheme } from "@mui/material";

import {
  decidedLabel,
  tieInvolves,
  type Tie,
  type TieSide,
} from "@/lib/league/bracket";

interface TieCardProps {
  tie: Tie;
  /** The club whose page this is, highlighted through the bracket. */
  clubId?: string;
}

/**
 * One knockout tie: both clubs, the score, and how it was settled.
 *
 * A two-legged tie shows the aggregate rather than two scorelines — the
 * aggregate is the thing that decided it, and the legs are available in the
 * fixture list. Scores are read from the tie's display frame, which the
 * builder mapped by team id, so a reversed second leg cannot land on the
 * wrong side here.
 */
export default function TieCard({ tie, clubId }: TieCardProps) {
  const theme = useTheme() as any;
  const isClubTie = Boolean(clubId) && tieInvolves(tie, clubId!);
  const note = decidedLabel(tie);

  const score = tie.aggregate ?? {
    home: tie.legs[0]?.goals.home,
    away: tie.legs[0]?.goals.away,
  };

  return (
    <Box
      sx={{
        ...theme.clay?.box,
        p: 1.25,
        borderRadius: "10px",
        borderColor: isClubTie
          ? alpha(theme.palette.primary.main, 0.5)
          : undefined,
        bgcolor: isClubTie
          ? alpha(theme.palette.primary.main, 0.08)
          : undefined,
      }}
    >
      <SideRow
        side={tie.home}
        goals={score.home}
        isWinner={tie.winnerTeamId === tie.home.teamId}
        isClub={tie.home.teamId === clubId}
        settled={tie.state === "complete"}
      />
      <SideRow
        side={tie.away}
        goals={score.away}
        isWinner={tie.winnerTeamId === tie.away.teamId}
        isClub={tie.away.teamId === clubId}
        settled={tie.state === "complete"}
      />

      {(note || tie.state !== "complete" || tie.legs.length > 1) && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            fontSize: "0.6rem",
            fontWeight: 700,
            color:
              tie.state === "live"
                ? theme.palette.error.main
                : "text.secondary",
            opacity: tie.state === "live" ? 1 : 0.6,
          }}
        >
          {tie.state === "live"
            ? "LIVE"
            : tie.state === "scheduled"
              ? "To be played"
              : (note ?? (tie.legs.length > 1 ? "Two legs" : ""))}
        </Typography>
      )}
    </Box>
  );
}

const SideRow = ({
  side,
  goals,
  isWinner,
  isClub,
  settled,
}: {
  side: TieSide;
  goals: number | null | undefined;
  isWinner: boolean;
  isClub: boolean;
  settled: boolean;
}) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.25 }}>
    <Avatar
      src={side.logo}
      alt=""
      sx={{ width: 18, height: 18, bgcolor: "transparent" }}
      imgProps={{ loading: "lazy", decoding: "async" }}
    />
    <Typography
      noWrap
      sx={{
        flex: 1,
        minWidth: 0,
        fontSize: "0.72rem",
        // The winner carries the weight; a settled loser is dimmed, so a
        // completed round reads at a glance as who went through.
        fontWeight: isClub || isWinner ? 800 : 600,
        opacity: settled && !isWinner ? 0.5 : 1,
      }}
    >
      {side.name ?? `#${side.teamId}`}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.75rem",
        fontWeight: 900,
        minWidth: 14,
        textAlign: "right",
        opacity: settled && !isWinner ? 0.5 : 1,
      }}
    >
      {goals ?? "–"}
    </Typography>
  </Stack>
);
