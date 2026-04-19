"use client";

import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

interface SquadPlayer {
  id: string | number;
  name: string;
  photo?: string;
  position?: string;
  number?: number | string;
}

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
  const theme = useTheme() as any;
  const accent = compareColor ?? theme.palette.secondary?.main ?? "#ff9800";

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");

  const players = useMemo(() => {
    if (!squadData) return [];
    return Object.values(squadData)
      .filter((p) => String(p.id) !== String(excludePlayerId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [squadData, excludePlayerId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setQuery("");
  };

  const handlePick = (player: SquadPlayer) => {
    onSelect(player);
    handleClose();
  };

  if (comparePlayer) {
    return (
      <Chip
        avatar={<Avatar src={comparePlayer.photo} alt={comparePlayer.name} />}
        label={
          <Stack direction="row" spacing={0.75} alignItems="center">
            <CompareArrowsIcon
              sx={{ fontSize: 14, color: accent, opacity: 0.9 }}
            />
            <Typography
              component="span"
              sx={{ fontWeight: 700, fontSize: "0.8rem" }}
            >
              vs {comparePlayer.name}
            </Typography>
          </Stack>
        }
        onDelete={onClear}
        deleteIcon={<CloseIcon />}
        sx={{
          bgcolor: `${accent}1a`,
          color: "text.primary",
          border: `1px solid ${accent}55`,
          fontWeight: 700,
          "& .MuiChip-deleteIcon": {
            color: "text.secondary",
            "&:hover": { color: accent },
          },
        }}
      />
    );
  }

  return (
    <>
      <Chip
        icon={<AddIcon sx={{ fontSize: 16 }} />}
        label="Compare player"
        onClick={handleOpen}
        sx={{
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "0.75rem",
          borderRadius: "10px",
          border: `1px dashed ${theme.palette.divider}`,
          bgcolor: "transparent",
          color: "text.secondary",
          "&:hover": {
            bgcolor: `${accent}10`,
            borderColor: accent,
            color: "text.primary",
          },
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 280,
              maxHeight: 420,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            },
          },
        }}
        MenuListProps={{ sx: { py: 0 } }}
      >
        <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Search squad…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ overflow: "auto", maxHeight: 340 }}>
          {filtered.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                No players match
              </Typography>
            </Box>
          ) : (
            filtered.map((p) => (
              <ListItemButton
                key={String(p.id)}
                onClick={() => handlePick(p)}
                sx={{ px: 1.5, py: 1 }}
              >
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Avatar src={p.photo} alt={p.name} sx={{ width: 32, height: 32 }} />
                </ListItemAvatar>
                <ListItemText
                  primary={p.name}
                  secondary={
                    p.position
                      ? `${p.position}${p.number ? ` · #${p.number}` : ""}`
                      : undefined
                  }
                  primaryTypographyProps={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                  secondaryTypographyProps={{ fontSize: "0.7rem" }}
                />
              </ListItemButton>
            ))
          )}
        </Box>
      </Menu>
    </>
  );
}
