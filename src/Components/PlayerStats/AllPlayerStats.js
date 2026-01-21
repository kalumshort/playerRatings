import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";

// MUI
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
  Skeleton, // Import Skeleton
} from "@mui/material";
import {
  FilterListRounded,
  SortRounded,
  EmojiEventsRounded,
} from "@mui/icons-material";

// SELECTORS & HOOKS
import { selectAllPlayersSeasonOverallRating } from "../../Selectors/selectors";
import { selectSeasonSquadDataObject } from "../../Selectors/squadDataSelectors";

import { useAppNavigate } from "../../Hooks/useAppNavigate";
import PlayerFormWidgets from "./PlayerFormWidget";
import { motion } from "framer-motion";

// --- HELPERS ---
const getRatingColor = (score, theme) => {
  if (score >= 7.5) return theme.palette.success.main;
  if (score >= 6.0) return theme.palette.warning.main;
  return theme.palette.error.main;
};

const getRatingBg = (score, theme) => {
  if (score >= 7.5) return alpha(theme.palette.success.main, 0.1);
  if (score >= 6.0) return alpha(theme.palette.warning.main, 0.1);
  return alpha(theme.palette.error.main, 0.1);
};

export default function AllPlayerStats() {
  const theme = useTheme();
  const appNavigate = useAppNavigate();

  // Redux Data
  const squadData = useSelector((state) => selectSeasonSquadDataObject(state));
  const playerStats = useSelector(selectAllPlayersSeasonOverallRating);

  // Local State
  const [sort, setSort] = useState("desc");
  const [positionFilter, setPositionFilter] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- DATA PROCESSING ---
  const allPlayers = useMemo(() => {
    if (!playerStats || !squadData) return [];

    return Object.entries(playerStats)
      .filter(([playerId]) => squadData[playerId])
      .map(([playerId, stats]) => ({
        playerId,
        playerName: squadData[playerId]?.name,
        playerImg: squadData[playerId]?.photo,
        position: squadData[playerId]?.position,
        rating:
          stats.totalSubmits > 0 ? stats.totalRating / stats.totalSubmits : 0,
        votes: stats.totalSubmits,
      }))
      .filter((p) => p.playerId !== "4720" && p.rating > 0);
  }, [playerStats, squadData]);

  // Loading Check
  const isLoading = !allPlayers || allPlayers.length === 0;

  // Top 3
  const top3Players = useMemo(() => {
    return [...allPlayers].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [allPlayers]);

  // List (Filtered & Sorted)
  const listPlayers = useMemo(() => {
    let result = [...allPlayers];
    if (positionFilter) {
      result = result.filter((p) => p.position === positionFilter);
    }
    result.sort((a, b) =>
      sort === "asc" ? a.rating - b.rating : b.rating - a.rating,
    );
    return result;
  }, [allPlayers, positionFilter, sort]);

  const handleNavigate = (id) => appNavigate(`/players/${id}`);

  return (
    <Box
      className="containerMargin"
      sx={{ pb: 8, maxWidth: "1200px", mx: "auto" }}
    >
      <Grid container spacing={3} sx={{ p: { xs: 1, md: 3 } }}>
        {/* --- RIGHT COL: WIDGETS --- */}
        <Grid item xs={12} md={5} lg={4} order={{ xs: 1, md: 2 }}>
          <Stack spacing={3}>
            {/* 1. LEADERBOARD CARD */}
            <Paper
              elevation={0}
              sx={(theme) => ({
                ...theme.clay.card,
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(
                  theme.palette.background.default,
                  0.5,
                )} 100%)`,
                minHeight: 280, // Prevent collapse during loading
              })}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <EmojiEventsRounded color="primary" />
                <Typography
                  variant="h6"
                  fontWeight={800}
                  letterSpacing="-0.5px"
                >
                  TOP RATED
                </Typography>
              </Stack>

              {/* LOADING STATE: PODIUM SKELETON */}
              {isLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 2,
                    mt: 4,
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  {/* 2nd Place Skeleton */}
                  <Stack alignItems="center" spacing={1}>
                    <Skeleton variant="circular" width={60} height={60} />
                    <Skeleton
                      variant="rounded"
                      width={80}
                      height={110}
                      sx={{ borderRadius: "16px 16px 0 0" }}
                    />
                  </Stack>
                  {/* 1st Place Skeleton */}
                  <Stack alignItems="center" spacing={1}>
                    <Skeleton variant="circular" width={80} height={80} />
                    <Skeleton
                      variant="rounded"
                      width={100}
                      height={140}
                      sx={{ borderRadius: "16px 16px 0 0" }}
                    />
                  </Stack>
                  {/* 3rd Place Skeleton */}
                  <Stack alignItems="center" spacing={1}>
                    <Skeleton variant="circular" width={60} height={60} />
                    <Skeleton
                      variant="rounded"
                      width={80}
                      height={90}
                      sx={{ borderRadius: "16px 16px 0 0" }}
                    />
                  </Stack>
                </Box>
              ) : (
                top3Players.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 2,
                      mt: 3,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <PodiumStep
                      rank={2}
                      player={top3Players[1]}
                      onClick={() => handleNavigate(top3Players[1]?.playerId)}
                    />
                    <PodiumStep
                      rank={1}
                      player={top3Players[0]}
                      onClick={() => handleNavigate(top3Players[0]?.playerId)}
                    />
                    <PodiumStep
                      rank={3}
                      player={top3Players[2]}
                      onClick={() => handleNavigate(top3Players[2]?.playerId)}
                    />
                  </Box>
                )
              )}
            </Paper>

            {/* 2. HOT & COLD CARDS */}
            {/* The widget component handles its own loading internally */}
            <PlayerFormWidgets />
          </Stack>
        </Grid>

        {/* --- LEFT COL: LIST --- */}
        <Grid item xs={12} md={7} lg={8} order={{ xs: 2, md: 1 }}>
          {/* Sticky Controls */}
          <Box
            sx={(theme) => ({
              position: "sticky",
              top: 10,
              zIndex: 20,
              mb: 2,
              p: 1.5,
              borderRadius: "16px",
              ...theme.clay.card,
              backdropFilter: "blur(12px)",
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            })}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} pl={1}>
              <Typography variant="h6" fontWeight={800}>
                {positionFilter ? `${positionFilter}s` : "All Squad"}
              </Typography>
              {isLoading ? (
                <Skeleton variant="rounded" width={30} height={20} />
              ) : (
                <Chip
                  label={listPlayers.length}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                  }}
                />
              )}
            </Stack>

            <Stack direction="row">
              <IconButton
                onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
                disabled={isLoading}
              >
                <SortRounded color={sort === "desc" ? "primary" : "action"} />
              </IconButton>
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                disabled={isLoading}
              >
                <FilterListRounded
                  color={positionFilter ? "primary" : "action"}
                />
              </IconButton>
            </Stack>
          </Box>

          {/* LOADING STATE: LIST SKELETONS */}
          <Stack spacing={1.5}>
            {isLoading
              ? Array.from(new Array(6)).map((_, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <Skeleton
                      variant="text"
                      width={30}
                      height={30}
                      sx={{ mr: 2 }}
                    />
                    <Skeleton
                      variant="circular"
                      width={48}
                      height={48}
                      sx={{ mr: 2 }}
                    />
                    <Box flexGrow={1}>
                      <Skeleton variant="text" width="40%" height={24} />
                      <Skeleton variant="text" width="20%" height={16} />
                    </Box>
                    <Skeleton
                      variant="rounded"
                      width={50}
                      height={30}
                      sx={{ borderRadius: 2 }}
                    />
                  </Paper>
                ))
              : listPlayers.map((player, index) => {
                  const globalRank =
                    allPlayers
                      .sort((a, b) => b.rating - a.rating)
                      .findIndex((p) => p.playerId === player.playerId) + 1;

                  return (
                    <Fade in key={player.playerId} timeout={300 + index * 50}>
                      <Box
                        onClick={() => handleNavigate(player.playerId)}
                        sx={(theme) => ({
                          p: 2,
                          borderRadius: "16px",
                          bgcolor: "background.paper",
                          border: `1px solid ${theme.palette.divider}`,
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: theme.shadows[2],
                            borderColor: theme.palette.primary.main,
                          },
                        })}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            width: 40,
                            fontWeight: 900,
                            color: "text.disabled",
                            fontSize: "1.1rem",
                          }}
                        >
                          #{globalRank}
                        </Typography>

                        <Avatar
                          src={player.playerImg}
                          sx={{
                            width: 48,
                            height: 48,
                            mr: 2,
                            border: `2px solid ${theme.palette.background.default}`,
                            boxShadow: theme.shadows[1],
                          }}
                        />

                        <Box flexGrow={1}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            lineHeight={1.2}
                          >
                            {player.playerName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            {player.position}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: "8px",
                            bgcolor: getRatingBg(player.rating, theme),
                            color: getRatingColor(player.rating, theme),
                            border: `1px solid ${alpha(
                              getRatingColor(player.rating, theme),
                              0.2,
                            )}`,
                            minWidth: 50,
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={800}>
                            {player.rating.toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>
                    </Fade>
                  );
                })}
          </Stack>
        </Grid>
      </Grid>

      {/* Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 3, mt: 1, minWidth: 150 } }}
      >
        <MenuItem
          onClick={() => {
            setPositionFilter("");
            setAnchorEl(null);
          }}
        >
          All Positions
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPositionFilter("Attacker");
            setAnchorEl(null);
          }}
        >
          Forwards
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPositionFilter("Midfielder");
            setAnchorEl(null);
          }}
        >
          Midfielders
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPositionFilter("Defender");
            setAnchorEl(null);
          }}
        >
          Defenders
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPositionFilter("Goalkeeper");
            setAnchorEl(null);
          }}
        >
          Goalkeepers
        </MenuItem>
      </Menu>
    </Box>
  );
}

// --- SUB-COMPONENTS ---

const PodiumStep = ({ rank, player, onClick }) => {
  const theme = useTheme();
  const isFirst = rank === 1;

  // Taller heights for better separation
  const height = isFirst ? 160 : rank === 2 ? 130 : 110;
  const width = isFirst ? 110 : 90;

  if (!player) return <Box sx={{ width }} />;

  return (
    <Stack
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      alignItems="center"
      onClick={onClick}
      sx={{
        cursor: "pointer",
        position: "relative",
        width: width,
        mx: 0.5,
        "&:hover .podium-pillar": {
          transform: "translateY(-4px)",
          borderColor: theme.palette.primary.main,
          boxShadow: `0 10px 30px -10px ${alpha(theme.palette.primary.main, 0.4)}`,
        },
      }}
    >
      {/* 1. AVATAR (Floating Top) */}
      <Avatar
        src={player.playerImg}
        alt={player.playerName}
        sx={{
          width: isFirst ? 80 : 64,
          height: isFirst ? 80 : 64,
          mb: -3, // Pulls it down into the pillar slightly
          zIndex: 2,
          border: `4px solid ${theme.palette.background.default}`, // Matches page bg to create "cutout" look
          boxShadow: isFirst
            ? `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`
            : theme.shadows[3],
        }}
      />

      {/* 2. THE PILLAR (Glass + Border) */}
      <Box
        className="podium-pillar"
        sx={{
          width: "100%",
          height: height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          pt: 4.5, // Space for avatar overlap
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

          // Shape & Border Logic
          borderRadius: "24px 24px 0 0",
          border: isFirst
            ? `3px solid ${theme.palette.primary.main}`
            : `1px solid ${alpha(theme.palette.text.secondary, 0.1)}`,

          // Background Logic (Gradient for 1st, subtle glass for others)
          background: isFirst
            ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`
            : alpha(theme.palette.background.paper, 0.4),

          // Glow for 1st Place
          boxShadow: isFirst
            ? `0 0 20px -5px ${alpha(theme.palette.primary.main, 0.2)}`
            : "none",
        }}
      >
        {/* Player Name */}
        <Typography
          variant="body2"
          noWrap
          sx={{
            maxWidth: "90%",
            fontWeight: 700,
            color: isFirst ? "primary.main" : "text.secondary",
            letterSpacing: 0.5,
            mb: 0.5,
          }}
        >
          {player.playerName.split(" ").pop()}
        </Typography>

        {/* Rank Number (Large Watermark style) */}
        <Typography
          variant="h1"
          sx={{
            fontSize: isFirst ? "4rem" : "3rem",
            fontWeight: 900,
            lineHeight: 1,
            opacity: 0.1, // Very subtle background number
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            color: "text.primary",
          }}
        >
          {rank}
        </Typography>

        {/* RATING PILL (Larger & Bolder) */}
        <Box
          sx={{
            mt: "auto", // Pushes to bottom
            mb: 2,
            px: 2,
            py: 0.5,
            borderRadius: "20px",
            bgcolor: isFirst
              ? "primary.main"
              : alpha(theme.palette.text.primary, 0.1),
            color: isFirst
              ? theme.palette.primary.contrastText
              : "text.primary",
            boxShadow: isFirst
              ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
              : "none",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Typography
            variant={isFirst ? "h5" : "h6"}
            sx={{ fontWeight: 800, lineHeight: 1 }}
          >
            {player.rating.toFixed(1)}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
};
