"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Paper,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Chip,
  Stack,
  useTheme,
  alpha,
  Fade,
  Skeleton,
} from "@mui/material";
import {
  FilterListRounded,
  SortRounded,
  EmojiEventsRounded,
} from "@mui/icons-material";

import { useRouter } from "next/navigation"; // Correct import for App Router

// CUSTOM IMPORTS
import { RootState } from "@/lib/redux/store";

import PodiumStep from "./PodiumStep";
import { selectAllPlayerOverallRatings } from "@/lib/redux/selectors/ratingsSelectors";
import PlayerFormWidgets from "./PlayerFormWidgets";
import { selectSeasonSquadData } from "@/lib/redux/selectors/squadSelectors";
import { useParams } from "next/navigation";
import PlayerSeasonAverageListItem from "./PlayerSeasonAvergeListItem";

export default function PlayerStatsClient() {
  const theme = useTheme() as any;
  const router = useRouter();
  const { clubSlug } = useParams();

  // 1. DATA SELECTORS (Using your new mapped selector)
  const squadData = useSelector((state: RootState) =>
    selectSeasonSquadData(state),
  );
  const allPlayersSeasonAverageRating = useSelector(
    selectAllPlayerOverallRatings,
  );

  // 2. STATE
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [positionFilter, setPositionFilter] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // 3. DATA PROCESSING
  const allPlayers = useMemo(() => {
    if (!allPlayersSeasonAverageRating || !squadData) return [];

    const mapped = Object.entries(allPlayersSeasonAverageRating)
      .filter(([id]) => squadData[id])
      .map(([id, stats]: [string, any]) => ({
        playerId: id,
        playerName: squadData[id].name,
        playerImg: squadData[id].photo,
        position: squadData[id].position,
        rating:
          stats.totalSubmits > 0 ? stats.totalRating / stats.totalSubmits : 0,
        votes: stats.totalSubmits,
      }))
      .filter((p) => p.playerId !== "4720" && p.rating > 0);

    // Sort once for Global Ranking
    return mapped.sort((a, b) => b.rating - a.rating);
  }, [allPlayersSeasonAverageRating, squadData]);

  const isLoading = allPlayers.length === 0;
  const top3Players = allPlayers.slice(0, 3);

  const listPlayers = useMemo(() => {
    let result = positionFilter
      ? allPlayers.filter((p) => p.position === positionFilter)
      : [...allPlayers];

    return sort === "asc" ? result.reverse() : result;
  }, [allPlayers, positionFilter, sort]);

  const getRatingColor = (score: number) => {
    if (score >= 7.5) return theme.palette.success.main;
    if (score >= 6.0) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Box
      sx={{
        pb: 8,
        maxWidth: "1200px",
        mx: "auto",
        px: { xs: 1, md: 3 },
        pt: 2,
      }}
    >
      <Grid container spacing={3}>
        {/* LEFT COL: LEADERBOARD & FORM (Web: Order 1, Mobile: Order 2) */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }} order={{ xs: 2, md: 1 }}>
          <Box
            sx={{
              position: "sticky",
              top: 80,
              zIndex: 10,
              mb: 2,
              p: 1.5,
              ...theme.clay?.card,

              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} pl={1}>
              <Typography variant="h6" fontWeight={800}>
                {positionFilter ? `${positionFilter}s` : "All Squad"}
              </Typography>
              <Chip
                label={listPlayers.length}
                size="small"
                sx={{
                  fontWeight: 800,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                }}
              />
            </Stack>

            <Stack direction="row">
              <IconButton
                onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
              >
                <SortRounded color={sort === "desc" ? "primary" : "action"} />
              </IconButton>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <FilterListRounded
                  color={positionFilter ? "primary" : "action"}
                />
              </IconButton>
            </Stack>
          </Box>

          <Stack spacing={1.5}>
            {listPlayers.map((player, index) => {
              const globalRank =
                allPlayers.findIndex((p) => p.playerId === player.playerId) + 1;

              return (
                <PlayerSeasonAverageListItem
                  playerId={player.playerId}
                  globalRank={globalRank}
                  clubSlug={clubSlug}
                />
              );
            })}
          </Stack>
        </Grid>

        {/* RIGHT COL: PODIUM (Web: Order 2, Mobile: Order 1) */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }} order={{ xs: 1, md: 2 }}>
          <Stack spacing={3} sx={{ position: { md: "sticky" }, top: 100 }}>
            <Paper
              elevation={0}
              sx={{
                ...theme.clay?.card,
                p: 3,
                textAlign: "center",
                background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Subtle Background Icon */}
              <EmojiEventsRounded
                sx={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  fontSize: 150,
                  opacity: 0.03,
                  transform: "rotate(-15deg)",
                }}
              />

              <Stack
                direction="row"
                spacing={1}
                justifyContent="center"
                alignItems="center"
                mb={4}
              >
                <Box
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    p: 1,
                    borderRadius: "12px",
                    display: "flex",
                  }}
                >
                  <EmojiEventsRounded color="primary" sx={{ fontSize: 20 }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={900}
                  letterSpacing={1}
                >
                  SEASON LEADERS
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: { xs: 1, sm: 2 },
                  pb: 1,
                }}
              >
                <PodiumStep rank={2} player={top3Players[1]} />
                <PodiumStep rank={1} player={top3Players[0]} />
                <PodiumStep rank={3} player={top3Players[2]} />
              </Box>
            </Paper>
            <PlayerFormWidgets />
          </Stack>
        </Grid>
      </Grid>

      {/* POSITION FILTER MENU */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {["", "Goalkeeper", "Defender", "Midfielder", "Attacker"].map((pos) => (
          <MenuItem
            key={pos}
            onClick={() => {
              setPositionFilter(pos);
              setAnchorEl(null);
            }}
          >
            {pos || "All Positions"}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
