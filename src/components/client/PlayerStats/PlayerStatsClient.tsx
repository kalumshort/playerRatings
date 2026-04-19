"use client";

import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Chip,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import { FilterListRounded, SortRounded } from "@mui/icons-material";
import { useParams } from "next/navigation";

import { RootState } from "@/lib/redux/store";
import { selectAllPlayerOverallRatings } from "@/lib/redux/selectors/ratingsSelectors";
import { selectSeasonSquadData } from "@/lib/redux/selectors/squadSelectors";
import PodiumStep from "./PodiumStep";
import PlayerFormWidgets from "./PlayerFormWidgets";
import PlayerSeasonAverageListItem from "./PlayerSeasonAvergeListItem";

// Placeholder/system account excluded from rankings.
const EXCLUDED_PLAYER_IDS = new Set(["4720"]);

const POSITION_FILTERS = [
  "",
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Attacker",
] as const;

export default function PlayerStatsClient() {
  const theme = useTheme() as any;
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

    return Object.entries(allPlayersSeasonAverageRating)
      .filter(([id]) => squadData[id] && !EXCLUDED_PLAYER_IDS.has(id))
      .map(([id, stats]: [string, any]) => ({
        playerId: id,
        playerName: squadData[id].name,
        playerImg: squadData[id].photo,
        position: squadData[id].position,
        rating:
          stats.totalSubmits > 0 ? stats.totalRating / stats.totalSubmits : 0,
        votes: stats.totalSubmits,
      }))
      .filter((p) => p.rating > 0)
      .sort((a, b) => b.rating - a.rating);
  }, [allPlayersSeasonAverageRating, squadData]);

  // O(1) rank lookup keyed by the already-sorted list.
  const globalRankById = useMemo(() => {
    const map = new Map<string, number>();
    allPlayers.forEach((p, i) => map.set(p.playerId, i + 1));
    return map;
  }, [allPlayers]);

  const top3Players = allPlayers.slice(0, 3);

  const listPlayers = useMemo(() => {
    const filtered = positionFilter
      ? allPlayers.filter((p) => p.position === positionFilter)
      : allPlayers;

    return sort === "asc" ? [...filtered].reverse() : filtered;
  }, [allPlayers, positionFilter, sort]);

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
            {listPlayers.map((player) => (
              <PlayerSeasonAverageListItem
                key={player.playerId}
                playerId={player.playerId}
                globalRank={globalRankById.get(player.playerId) ?? 0}
                clubSlug={clubSlug}
              />
            ))}
          </Stack>
        </Grid>

        {/* RIGHT COL: PODIUM (Web: Order 2, Mobile: Order 1) */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }} order={{ xs: 1, md: 2 }}>
          <Stack spacing={3} sx={{ position: { md: "sticky" }, top: 100 }}>
            <Paper elevation={0} sx={{ p: 2 }}>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  mb: 1.5,
                  color: "text.secondary",
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                Season leaders
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: { xs: 1, sm: 2 },
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
        {POSITION_FILTERS.map((pos) => (
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
