"use client";

import React, { useMemo } from "react";
import { Avatar, Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import {
  WhatshotRounded,
  AcUnitRounded,
  SwapHorizRounded,
} from "@mui/icons-material";

import { HEAT_TIERS, type StanceMap } from "@/lib/live/heat";
import type { RatedPlayer } from "@/lib/live/matchStory";
import type { SquadLookup } from "./HeatXI";

interface YourMatchProps {
  stances: StanceMap;
  rated: RatedPlayer[];
  squad: SquadLookup;
}

type Row = {
  playerId: string;
  mood: "hot" | "cold" | null;
  wantedSub: boolean;
  /** null when the crowd never reached a verdict on this player. */
  agreed: boolean | null;
};

/**
 * Your own calls, held up against where the crowd ended.
 *
 * "Agreed" is a comparison of direction only — you said hot, the club finished
 * rating them. It is not a score and nothing is paid for it: XP in this app
 * rewards turning up, never being right, and putting a hit rate on an opinion
 * would quietly turn a vibe check into a leaderboard.
 */
export default function YourMatch({ stances, rated, squad }: YourMatchProps) {
  const theme = useTheme() as any;

  const rows: Row[] = useMemo(() => {
    const byId = new Map(rated.map((r) => [r.playerId, r]));

    return Object.entries(stances)
      .filter(([, stance]) => stance?.mood || stance?.subFor)
      .map(([playerId, stance]) => {
        const crowd = byId.get(playerId);
        const direction = crowd ? HEAT_TIERS[crowd.tier].direction : "none";
        const mood = (stance.mood ?? null) as Row["mood"];

        return {
          playerId,
          mood,
          wantedSub: Boolean(stance.subFor),
          agreed: !mood || direction === "none" ? null : direction === mood,
        };
      });
  }, [stances, rated]);

  if (rows.length === 0) return null;

  const judged = rows.filter((r) => r.agreed !== null);
  const agreed = judged.filter((r) => r.agreed).length;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 0.5 }}>
        Your match
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        You called {rows.length} player{rows.length === 1 ? "" : "s"}
        {judged.length > 0 &&
          ` — the club ended up with you on ${agreed} of ${judged.length}`}
        .
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={1}>
        {rows.map((row) => {
          const info = squad[row.playerId];
          const tone = row.mood
            ? row.mood === "hot"
              ? theme.palette.heat.hotSolid
              : theme.palette.heat.coldSolid
            : theme.palette.heat.subDemand;
          const Icon = row.mood
            ? row.mood === "hot"
              ? WhatshotRounded
              : AcUnitRounded
            : SwapHorizRounded;

          return (
            <Stack
              key={row.playerId}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                ...theme.clay?.box,
                px: 1,
                py: 0.75,
                borderRadius: "999px",
                borderColor: alpha(tone, 0.5),
              }}
            >
              <Avatar
                src={
                  info?.photo ||
                  `https://media.api-sports.io/football/players/${row.playerId}.png`
                }
                sx={{ width: 26, height: 26, bgcolor: "background.default" }}
              />
              <Typography variant="caption" fontWeight={800} noWrap>
                {info?.name?.split(" ").pop() ?? `#${row.playerId}`}
              </Typography>
              <Icon sx={{ fontSize: 15, color: tone }} />
              {row.agreed !== null && (
                <Typography
                  variant="caption"
                  fontWeight={900}
                  sx={{
                    color: row.agreed
                      ? theme.palette.success.main
                      : "text.secondary",
                  }}
                >
                  {row.agreed ? "WITH THE CLUB" : "AGAINST THE GRAIN"}
                </Typography>
              )}
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
