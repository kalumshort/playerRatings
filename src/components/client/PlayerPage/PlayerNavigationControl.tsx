"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Chip,
  InputAdornment,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface SquadPlayer {
  id: string | number;
  name: string;
  photo?: string;
  position?: string;
  number?: number | string;
}

interface PlayerNavigationControlProps {
  squadData: Record<string, SquadPlayer> | null | undefined;
  currentPlayerId: string;
  onNavigate?: () => void;
}

export default function PlayerNavigationControl({
  squadData,
  currentPlayerId,
  onNavigate,
}: PlayerNavigationControlProps) {
  const theme = useTheme() as any;
  const router = useRouter();
  const params = useParams();
  const clubSlug = params?.clubSlug as string | undefined;

  const accent = theme.palette.primary?.main ?? "#1976d2";

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");

  const players = useMemo(() => {
    if (!squadData) return [];
    return Object.values(squadData)
      .filter((p) => String(p.id) !== String(currentPlayerId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [squadData, currentPlayerId]);

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
    handleClose();
    if (!clubSlug) return;
    onNavigate?.();
    router.push(`/${clubSlug}/players/${player.id}`);
  };

  return (
    <>
      <Chip
        icon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
        label={
          <Box
            component="span"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}
          >
            Switch player
            <KeyboardArrowDownIcon sx={{ fontSize: 16, ml: 0.25 }} />
          </Box>
        }
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
                  <Avatar
                    src={p.photo}
                    alt={p.name}
                    sx={{ width: 32, height: 32 }}
                  />
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
