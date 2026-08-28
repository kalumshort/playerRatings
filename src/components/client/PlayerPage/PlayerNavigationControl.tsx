"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import { useClubView } from "@/context/ClubViewProvider";
import { withSeasonParam } from "@/lib/config/season";
import PickerTrigger from "./PickerTrigger";
import SquadPickerMenu, { type SquadPlayer } from "./SquadPickerMenu";

interface PlayerNavigationControlProps {
  squadData: Record<string, SquadPlayer> | null | undefined;
  currentPlayerId: string;
  onNavigate?: () => void;
  season?: string;
}

export default function PlayerNavigationControl({
  squadData,
  currentPlayerId,
  onNavigate,
  season: seasonProp,
}: PlayerNavigationControlProps) {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const clubSlug = params?.clubSlug as string | undefined;
  const { season: contextSeason } = useClubView();
  const season = seasonProp ?? contextSeason;

  const accent = theme.palette.primary?.main ?? "#1976d2";

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const players = useMemo(() => {
    if (!squadData) return [];
    return Object.values(squadData)
      .filter((p) => String(p.id) !== String(currentPlayerId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [squadData, currentPlayerId]);

  const handlePick = (player: SquadPlayer) => {
    if (!clubSlug) return;
    onNavigate?.();
    router.push(withSeasonParam(`/${clubSlug}/players/${player.id}`, season));
  };

  return (
    <>
      <PickerTrigger
        icon={<SwapHorizIcon sx={{ fontSize: 17 }} />}
        label="Switch player"
        accent={accent}
        active={Boolean(anchorEl)}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      />

      <SquadPickerMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        players={players}
        onPick={handlePick}
        accent={accent}
      />
    </>
  );
}
