"use client";

import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { WhatshotRounded, AcUnitRounded } from "@mui/icons-material";

import PitchPlayer from "../Lineup/PitchPlayer";
import { HEAT_TIERS, type HeatTier } from "@/lib/live/heat";
import { heroesOf, villainsOf, type RatedPlayer } from "@/lib/live/matchStory";

export interface SquadLookup {
  [playerId: string]: { name: string; photo?: string };
}

interface HeatXIProps {
  rated: RatedPlayer[];
  squad: SquadLookup;
}

/**
 * Who the crowd finished the match rating, and who they had given up on.
 *
 * Deliberately not a formation. The fans' verdict is a ranking, not a team
 * sheet, and dropping five rated players into an eleven-slot pitch would invent
 * eight opinions nobody expressed.
 */
export default function HeatXI({ rated, squad }: HeatXIProps) {
  const heroes = heroesOf(rated);
  const villains = villainsOf(rated);

  if (heroes.length === 0 && villains.length === 0) return null;

  return (
    <Stack spacing={2.5}>
      {heroes.length > 0 && (
        <VerdictRow
          title="The fans' heroes"
          icon={<WhatshotRounded sx={{ fontSize: 16 }} />}
          tone="hot"
          players={heroes}
          squad={squad}
        />
      )}
      {villains.length > 0 && (
        <VerdictRow
          title="The crowd turned"
          icon={<AcUnitRounded sx={{ fontSize: 16 }} />}
          tone="cold"
          players={villains}
          squad={squad}
        />
      )}
    </Stack>
  );
}

const VerdictRow = ({
  title,
  icon,
  tone,
  players,
  squad,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "hot" | "cold";
  players: RatedPlayer[];
  squad: SquadLookup;
}) => {
  const theme = useTheme();
  const color =
    tone === "hot" ? theme.palette.heat.hotSolid : theme.palette.heat.coldSolid;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1, color }}>
        {icon}
        <Typography
          variant="caption"
          fontWeight={900}
          letterSpacing={0.8}
          sx={{ color: "text.primary" }}
        >
          {title.toUpperCase()}
        </Typography>
      </Stack>

      {/* Scrolls inside itself rather than pushing the card wide on a phone. */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          pb: 1,
          "&::-webkit-scrollbar": { height: 4 },
        }}
      >
        {players.map((p) => {
          const info = squad[p.playerId];
          return (
            <Box key={p.playerId} sx={{ width: 74, flexShrink: 0 }}>
              <PitchPlayer
                name={
                  info?.name?.split(" ").pop()?.toUpperCase() ??
                  `#${p.playerId}`
                }
                fullName={info?.name}
                photo={
                  info?.photo ||
                  `https://media.api-sports.io/football/players/${p.playerId}.png`
                }
                badge={`${p.net > 0 ? "+" : ""}${p.net}`}
                size={52}
              />
              <Typography
                variant="caption"
                align="center"
                display="block"
                sx={{ color, fontWeight: 800, fontSize: "0.6rem", mt: 0.25 }}
              >
                {tierLabel(p.tier)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const tierLabel = (tier: HeatTier) => HEAT_TIERS[tier].label.toUpperCase();
