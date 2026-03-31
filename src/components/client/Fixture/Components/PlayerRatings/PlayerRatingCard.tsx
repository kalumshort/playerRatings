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
} from "@mui/material";
import {
  StarRounded,
  StarOutlineRounded,
  AddRounded,
  RemoveRounded,
  CheckCircleRounded,
} from "@mui/icons-material";
import { handlePlayerRatingSubmit } from "@/lib/firebase/client-actions";
import EventBadge from "./EventBadge";
import { getInitialSurname, getRatingColor } from "@/lib/utils/football-logic";
import useUserData from "@/Hooks/useUserData";

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
  const theme = useTheme() as any;
  const matchId = String(fixture.id);

  const ratingsArray = useMemo(
    () => (Array.isArray(matchRatings) ? matchRatings : []),
    [matchRatings],
  );
  const isDataLoading = matchRatings === undefined || matchRatings === null;

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
        if (ev.type === "subst")
          return {
            type: ev.player.id === player.id ? "subOut" : "subIn",
            label: "Sub",
            time,
          };
        return null;
      })
      .filter(Boolean);
  }, [fixture.events, player.id]);

  const avgRating = useMemo(() => {
    const stats = ratingsArray.find((r: any) => r.id === String(player.id));
    return stats
      ? (stats.totalRating / (stats.totalSubmits || 1)).toFixed(1)
      : null;
  }, [ratingsArray, player.id]);

  const isMOTM = storedMotmId === player.id;

  return (
    <Paper
      elevation={0}
      sx={{
        ...theme.clay?.box,
        borderRadius: "28px",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        minHeight: isMobile ? 480 : 520,
        p: isMobile ? 2.5 : 3.5,
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <IconButton
          size="large"
          onClick={() => setStoredMotmId(isMOTM ? null : player.id)}
        >
          {isMOTM ? (
            <StarRounded color="secondary" fontSize="large" />
          ) : (
            <StarOutlineRounded fontSize="large" />
          )}
        </IconButton>
      </Box>

      <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar
          src={
            player.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
          sx={{ width: 100, height: 100 }}
        />
        <Typography variant="h5" fontWeight={800}>
          {getInitialSurname(player.name).toUpperCase()}
        </Typography>
        <Stack
          direction="row"
          spacing={1.2}
          flexWrap="wrap"
          justifyContent="center"
        >
          {playerEvents.map((ev: any, i: number) => (
            <EventBadge key={i} {...ev} />
          ))}
        </Stack>
      </Stack>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 1,
        }}
      >
        {isDataLoading ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height={100}
            sx={{ borderRadius: "20px" }}
          />
        ) : usersMatchPlayerRating ? (
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            sx={{ width: "100%", maxWidth: 360 }}
          >
            <ClayScoreDisplay label="TEAM AVG" score={avgRating} />
            <ClayScoreDisplay
              label="YOUR VOTE"
              score={usersMatchPlayerRating}
            />
          </Stack>
        ) : (
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

const ClayScoreDisplay = ({ label, score }: any) => {
  const ratingColor = score ? getRatingColor(Number(score)) : "#ccc";
  return (
    <Box
      sx={{
        flex: 1,
        textAlign: "center",
        p: 2.5,
        borderRadius: "20px",
        bgcolor: alpha(ratingColor, 0.07),
        border: `1px solid ${alpha(ratingColor, 0.5)}`,
      }}
    >
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h4"
        fontWeight={900}
        sx={{ color: ratingColor, mt: 0.5 }}
      >
        {score ? Number(score).toFixed(1) : "–"}
      </Typography>
    </Box>
  );
};

const ClayRatingInput = ({ onSubmit, userId }: any) => {
  const [val, setVal] = useState(6.0);
  const dynamicColor = getRatingColor(val);

  const v = userId === "4hPrbr7QlZSVqm8VB4F8kRXUtDf2" ? 0.1 : 0.5;

  return (
    <Stack
      spacing={4}
      alignItems="center"
      sx={{ width: "100%", maxWidth: 320 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        <IconButton
          size="large"
          onClick={() => setVal((p) => Math.max(0.5, p - v))}
        >
          <RemoveRounded />
        </IconButton>

        <Box
          sx={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <CircularProgress
            variant="determinate"
            value={100}
            size={140}
            thickness={4}
            sx={{ position: "absolute", color: alpha("#000", 0.05) }}
          />
          <CircularProgress
            variant="determinate"
            value={val * 10}
            size={160}
            thickness={1}
            sx={{
              position: "absolute",
              color: dynamicColor,
              transition: "color 0.3s ease",
              "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
            }}
          />
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{ color: dynamicColor, transition: "color 0.3s ease" }}
          >
            {val.toFixed(1)}
          </Typography>
        </Box>

        <IconButton
          size="large"
          onClick={() => setVal((p) => Math.min(10, p + v))}
        >
          <AddRounded />
        </IconButton>
      </Stack>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={() => onSubmit(val)}
      >
        CONFIRM RATING
      </Button>
    </Stack>
  );
};
