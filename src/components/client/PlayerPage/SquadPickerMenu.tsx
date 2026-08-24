"use client";

import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  InputAdornment,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

export interface SquadPlayer {
  id: string | number;
  name: string;
  photo?: string;
  position?: string;
  number?: number | string;
}

interface SquadPickerMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Already excludes whichever player the caller doesn't want listed. */
  players: SquadPlayer[];
  onPick: (player: SquadPlayer) => void;
  /** Tints the hover and the search focus ring, so the menu inherits the
   *  identity of the control that opened it. */
  accent: string;
}

/**
 * The squad search menu shared by the "Switch player" and "Compare" controls.
 *
 * Extracted because both controls had their own copy of it — same filtering,
 * same list markup, same styling — which is how they had already drifted apart
 * on details like avatar size. One menu means one place to restyle.
 */
export default function SquadPickerMenu({
  anchorEl,
  open,
  onClose,
  players,
  onPick,
  accent,
}: SquadPickerMenuProps) {
  const theme = useTheme();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  const close = () => {
    onClose();
    setQuery("");
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={close}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            // Never wider than the phone it's on. The fixed 280px was fine at
            // 390px wide and cramped everywhere else.
            width: { xs: "calc(100vw - 32px)", sm: 320 },
            maxWidth: 320,
            maxHeight: 440,
            borderRadius: "14px",
            border: `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
          },
        },
      }}
      MenuListProps={{ sx: { py: 0 } }}
    >
      {/* Search header — outside the scroll area, so it stays put. */}
      <Box
        sx={{
          p: 1.25,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Search squad…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Menu treats typing as type-ahead navigation and steals focus from
          // the field otherwise.
          onKeyDown={(e) => e.stopPropagation()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: "10px",
              fontSize: "0.85rem",
              bgcolor: "background.paper",
              "& fieldset": { borderColor: theme.palette.divider },
              "&:hover fieldset": { borderColor: alpha(accent, 0.5) },
              "&.Mui-focused fieldset": { borderColor: accent },
            },
          }}
        />

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.75,
            ml: 0.5,
            color: "text.disabled",
            fontWeight: 700,
            letterSpacing: 0.5,
            fontSize: "0.65rem",
          }}
        >
          {filtered.length} {filtered.length === 1 ? "PLAYER" : "PLAYERS"}
        </Typography>
      </Box>

      <Box sx={{ overflowY: "auto", maxHeight: 340, py: 0.75 }}>
        {filtered.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
            <PersonSearchIcon
              sx={{ fontSize: 28, color: "text.disabled", mb: 0.5 }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 700 }}
            >
              No players match
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Try a different name
            </Typography>
          </Box>
        ) : (
          filtered.map((p) => (
            <ListItemButton
              key={String(p.id)}
              onClick={() => {
                onPick(p);
                close();
              }}
              sx={{
                mx: 0.75,
                px: 1,
                py: 0.75,
                borderRadius: "10px",
                width: "auto",
                "&:hover": { bgcolor: alpha(accent, 0.1) },
              }}
            >
              <ListItemAvatar sx={{ minWidth: 46 }}>
                <Avatar
                  src={p.photo}
                  alt={p.name}
                  sx={{
                    width: 36,
                    height: 36,
                    // The api-sports photos are cut-outs, so the surface behind
                    // them has to follow the theme rather than sit on white.
                    bgcolor: "background.default",
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
              </ListItemAvatar>

              <ListItemText
                primary={p.name}
                secondary={p.position || undefined}
                primaryTypographyProps={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  noWrap: true,
                }}
                secondaryTypographyProps={{
                  fontSize: "0.7rem",
                  noWrap: true,
                }}
              />

              {/* Shirt number as a badge rather than buried in the subtitle —
                  it is the thing people scan a squad list by. */}
              {p.number ? (
                <Box
                  sx={{
                    ml: 1,
                    minWidth: 26,
                    textAlign: "center",
                    px: 0.75,
                    py: 0.25,
                    borderRadius: "7px",
                    bgcolor: alpha(accent, 0.12),
                    color: "text.secondary",
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {p.number}
                </Box>
              ) : null}
            </ListItemButton>
          ))
        )}
      </Box>
    </Menu>
  );
}
