"use client";

import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

import PickerTrigger from "./PickerTrigger";
import SquadPickerMenu, { type SquadPlayer } from "./SquadPickerMenu";

interface PlayerCompareControlProps {
  squadData: Record<string, SquadPlayer> | null | undefined;
  excludePlayerId: string;
  comparePlayer: SquadPlayer | null;
  onSelect: (player: SquadPlayer) => void;
  onClear: () => void;
  compareColor?: string;
}

export default function PlayerCompareControl({
  squadData,
  excludePlayerId,
  comparePlayer,
  onSelect,
  onClear,
  compareColor,
}: PlayerCompareControlProps) {
  const theme = useTheme();
  const accent = compareColor ?? theme.palette.secondary?.main ?? "#ff9800";

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const players = useMemo(() => {
    if (!squadData) return [];
    return Object.values(squadData)
      .filter((p) => String(p.id) !== String(excludePlayerId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [squadData, excludePlayerId]);

  // ── Active state ────────────────────────────────────────────────────────
  // Once a comparison is running this stops being a picker and becomes a
  // status pill: it carries the colour the compared player is drawn in on the
  // graph, so the legend and the control are the same object.
  if (comparePlayer) {
    return (
      <Box
        sx={{
          height: 38,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          pl: 0.5,
          pr: 0.5,
          borderRadius: "999px",
          bgcolor: alpha(accent, 0.12),
          border: `1px solid ${alpha(accent, 0.45)}`,
        }}
      >
        <Avatar
          src={comparePlayer.photo}
          alt={comparePlayer.name}
          sx={{
            width: 30,
            height: 30,
            bgcolor: "background.default",
            // A ring in the compare colour, so the pill reads as the graph's
            // key without needing a separate legend.
            border: `2px solid ${accent}`,
          }}
        />

        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pr: 0.25 }}>
          <CompareArrowsIcon sx={{ fontSize: 15, color: accent }} />
          <Typography
            component="span"
            sx={{
              fontWeight: 800,
              fontSize: "0.78rem",
              letterSpacing: 0.2,
              whiteSpace: "nowrap",
              maxWidth: 150,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {comparePlayer.name}
          </Typography>
        </Stack>

        <Tooltip title="Stop comparing">
          <IconButton
            onClick={onClear}
            size="small"
            aria-label={`Stop comparing with ${comparePlayer.name}`}
            sx={{
              width: 26,
              height: 26,
              color: "text.secondary",
              "&:hover": {
                bgcolor: alpha(accent, 0.2),
                color: "text.primary",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <>
      <PickerTrigger
        icon={<AddIcon sx={{ fontSize: 17 }} />}
        label="Compare player"
        accent={accent}
        active={Boolean(anchorEl)}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      />

      <SquadPickerMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        players={players}
        onPick={onSelect}
        accent={accent}
      />
    </>
  );
}
