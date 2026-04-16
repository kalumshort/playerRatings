"use client";
import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Stack,
  Button,
  useTheme,
  alpha,
  CircularProgress,
  Skeleton,
  Zoom,
} from "@mui/material";
import {
  StarRounded,
  StarOutlineRounded,
  AddRounded,
  RemoveRounded,
  EmojiEventsRounded,
} from "@mui/icons-material";
import { handlePlayerRatingSubmit } from "@/lib/firebase/client-actions";
import EventBadge from "./EventBadge";
import { getInitialSurname, getRatingColor } from "@/lib/utils/football-logic";

export function PlayerRatingCard({
  player,
  fixture,
  isMobile,
  matchRatings,
  userId,
  groupId,
  currentYear,
  usersMatchPlayerRating,
  setStoredMotmId,
  storedMotmId,
}: any) {
  const theme = useTheme();
  const matchId = String(fixture.id);
  const isMOTM = storedMotmId === player.id;

  const ratingsArray = useMemo(
    () => (Array.isArray(matchRatings) ? matchRatings : []),
    [matchRatings],
  );
  const isDataLoading = matchRatings === undefined || matchRatings === null;

  const avgRating = useMemo(() => {
    const stats = ratingsArray.find((r: any) => r.id === String(player.id));
    return stats
      ? (stats.totalRating / (stats.totalSubmits || 1)).toFixed(1)
      : null;
  }, [ratingsArray, player.id]);

  const playerEvents = useMemo(() => {
    if (!fixture?.events) return [];
    return fixture.events
      .filter(
        (ev: any) => ev.player?.id === player.id || ev.assist?.id === player.id,
      )
      .map((ev: any) => {
        const time = `${ev.time.elapsed}${ev.time.extra ? `+${ev.time.extra}` : ""}'`;
        if (ev.type === "Goal" && ev.player.id === player.id)
          return { type: "goal", label: ev.detail, time };
        if (ev.type === "Goal" && ev.assist.id === player.id)
          return { type: "assist", label: "Assist", time };
        if (ev.type === "Card")
          return {
            type: ev.detail.includes("Yellow") ? "yellow" : "red",
            label: ev.detail,
            time,
          };
        return null;
      })
      .filter(Boolean);
  }, [fixture.events, player.id]);

  return (
    <Paper
      elevation={0}
      sx={{
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        minHeight: 480,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 1. MOTM SELECTION (NEW POSITION) */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <Zoom in={true}>
          <Button
            variant={isMOTM ? "contained" : "outlined"}
            color="secondary"
            size="small"
            onClick={() => setStoredMotmId(isMOTM ? null : player.id)}
            startIcon={isMOTM ? <StarRounded /> : <StarOutlineRounded />}
            sx={{
              px: 2,
              py: 0.5,
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.7rem",
              backdropFilter: "blur(4px)",
              boxShadow: isMOTM
                ? `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}`
                : "none",
              borderWidth: "2px",
              "&:hover": { borderWidth: "2px" },
            }}
          >
            {isMOTM ? "MAN OF THE MATCH" : "VOTE MOTM"}
          </Button>
        </Zoom>
      </Box>

      {/* Profile Header */}
      <Stack p={4} pt={8} spacing={2} alignItems="center">
        <Box sx={{ position: "relative" }}>
          <Avatar
            src={
              player.photo ||
              `https://media.api-sports.io/football/players/${player.id}.png`
            }
            sx={{
              width: 100,
              height: 100,
              border: `4px solid ${isMOTM ? theme.palette.secondary.main : theme.palette.background.paper}`,
              boxShadow: theme.shadows[4],
              transition: "border 0.3s ease",
            }}
          />
          {isMOTM && (
            <Box
              sx={{
                position: "absolute",
                bottom: -8,
                right: -8,
                bgcolor: "secondary.main",
                borderRadius: "50%",
                p: 0.5,
                display: "flex",
                border: `3px solid ${theme.palette.background.paper}`,
              }}
            >
              <EmojiEventsRounded sx={{ color: "white", fontSize: 20 }} />
            </Box>
          )}
        </Box>

        <Box textAlign="center">
          <Typography
            variant="h5"
            fontWeight={900}
            sx={{ letterSpacing: "-1px" }}
          >
            {getInitialSurname(player.name).toUpperCase()}
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" mt={1}>
            {playerEvents.map((ev: any, i: number) => (
              <EventBadge key={i} {...ev} />
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* Action/Display Area */}
      <Box
        sx={{
          flexGrow: 1,
          px: 3,
          pb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isDataLoading ? (
          <Skeleton
            variant="rounded"
            width="100%"
            height={100}
            sx={{ borderRadius: "24px" }}
          />
        ) : !usersMatchPlayerRating ? (
          /* 2. ONLY SHOW AVG AFTER SUBMISSION */
          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            <Box
              sx={{
                flex: 1,
                textAlign: "center",
                p: 2.5,
                borderRadius: "24px",
                bgcolor: alpha(theme.palette.divider, 0.05),
              }}
            >
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
                display="block"
              >
                YOUR VOTE
              </Typography>
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{ color: getRatingColor(usersMatchPlayerRating) }}
              >
                {usersMatchPlayerRating.toFixed(1)}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                textAlign: "center",
                p: 2.5,
                borderRadius: "24px",
                bgcolor: alpha(getRatingColor(Number(avgRating)), 0.1),
                border: `1px solid ${alpha(getRatingColor(Number(avgRating)), 0.2)}`,
              }}
            >
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
                display="block"
              >
                TEAM AVG
              </Typography>
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{ color: getRatingColor(Number(avgRating)) }}
              >
                {avgRating || "—"}
              </Typography>
            </Box>
          </Stack>
        ) : (
          /* Rating Input State */
          <ClayRatingInput
            userId={userId}
            onSubmit={(val: number) =>
              handlePlayerRatingSubmit({
                matchId,
                playerId: player.id,
                rating: val,
                userId,
                groupId,
                currentYear,
              })
            }
          />
        )}
      </Box>
    </Paper>
  );
}

const ClayRatingInput = ({ onSubmit, userId }: any) => {
  const theme = useTheme();
  const [val, setVal] = useState(6.0);
  const step = userId === "4hPrbr7QlZSVqm8VB4F8kRXUtDf2" ? 0.1 : 0.5;
  const activeColor = getRatingColor(val);

  return (
    <Stack spacing={3} alignItems="center" sx={{ width: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={3}>
        <IconButton
          onClick={() => setVal((p) => Math.max(1, p - step))}
          sx={{ bgcolor: alpha(theme.palette.divider, 0.05) }}
        >
          <RemoveRounded />
        </IconButton>

        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            variant="determinate"
            value={val * 10}
            size={110}
            thickness={5}
            sx={{ color: activeColor, transition: "color 0.3s ease" }}
          />
          <Typography
            variant="h4"
            fontWeight={950}
            sx={{ position: "absolute", color: activeColor }}
          >
            {val.toFixed(1)}
          </Typography>
        </Box>

        <IconButton
          onClick={() => setVal((p) => Math.min(10, p + step))}
          sx={{ bgcolor: alpha(theme.palette.divider, 0.05) }}
        >
          <AddRounded />
        </IconButton>
      </Stack>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={() => onSubmit(val)}
        sx={{
          borderRadius: "18px",
          py: 2,
          fontWeight: 900,
          background: `linear-gradient(45deg, ${activeColor}, ${alpha(activeColor, 0.8)})`,
          boxShadow: `0 8px 24px ${alpha(activeColor, 0.3)}`,
          "&:hover": { background: activeColor },
        }}
      >
        SUBMIT RATING
      </Button>
    </Stack>
  );
};
