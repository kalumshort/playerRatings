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
import { getInitialSurname } from "@/lib/utils/football-logic";

export function PlayerRatingCard({
  player,
  fixture,
  isMobile,
  matchRatings,
  userId,
  groupId,
  currentYear,
  usersMatchPlayerRating,
}: any) {
  const theme = useTheme() as any;
  const matchId = String(fixture.id);

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
    const stats = matchRatings?.find((r: any) => r.id === String(player.id));
    return stats ? (stats.totalRating / stats.totalSubmits).toFixed(1) : null;
  }, [matchRatings, player.id]);

  const isMOTM = usersMatchPlayerRating?.isMOTM;

  return (
    <Paper
      elevation={0}
      sx={{
        ...theme.clay?.box, // Base claymorphism style
        borderRadius: "32px",
        display: "flex",
        flexDirection: "column",
        minHeight: 520,
        bgcolor: theme.palette.background.paper,
        p: 3,
        position: "relative",
      }}
    >
      {/* MOTM TOGGLE - Absolute Positioned */}
      <Box sx={{ position: "absolute", top: 20, right: 20, zIndex: 2 }}>
        <IconButton
          sx={{
            ...theme.clay?.button,
            bgcolor: isMOTM
              ? theme.palette.secondary.main
              : theme.palette.background.default,
            color: isMOTM ? "#fff" : theme.palette.text.secondary,
            width: 45,
            height: 45,
          }}
        >
          {isMOTM ? <StarRounded /> : <StarOutlineRounded />}
        </IconButton>
      </Box>

      {/* PLAYER INFO HEADER */}
      <Stack alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Avatar
          src={
            player.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
          sx={{
            width: isMobile ? 110 : 130,
            height: isMobile ? 110 : 130,

            mb: 1,
          }}
        />
        <Typography variant="h4" color="text.primary" textAlign="center">
          {getInitialSurname(player.name).toUpperCase()}
        </Typography>

        {/* EVENTS ROW */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent="center"
          sx={{ minHeight: 32 }}
        >
          {playerEvents.map((ev: any, i: number) => (
            <EventBadge key={i} {...ev} />
          ))}
        </Stack>
      </Stack>

      {/* RATING SECTION */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {usersMatchPlayerRating ? (
          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            <ClayScoreDisplay
              label="AVG"
              score={avgRating}
              color={theme.palette.primary.main}
            />
            <ClayScoreDisplay
              label="YOU"
              score={usersMatchPlayerRating}
              color={theme.palette.secondary.main}
            />
          </Stack>
        ) : (
          <ClayRatingInput
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

// --- CLAY SUB-COMPONENTS ---

const ClayScoreDisplay = ({ label, score, color }: any) => {
  const theme = useTheme() as any;
  return (
    <Box sx={{ flex: 1, textAlign: "center" }}>
      <Typography variant="caption" fontWeight={900} color="text.secondary">
        {label}
      </Typography>
      <Box>
        <Typography variant="h4" fontWeight={900} sx={{ color: color }}>
          {score ? Number(score).toFixed(1) : "—"}
        </Typography>
      </Box>
    </Box>
  );
};

const ClayRatingInput = ({ onSubmit }: any) => {
  const [val, setVal] = useState(6.0);
  const theme = useTheme() as any;

  return (
    <Stack spacing={4} sx={{ width: "60%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <IconButton onClick={() => setVal(Math.max(1, val - 0.1))}>
          <RemoveRounded />
        </IconButton>

        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.background.paper,
            ...theme.clay?.box, // Circular clay well
          }}
        >
          <Typography variant="h3" fontWeight={900}>
            {val.toFixed(1)}
          </Typography>
        </Box>

        <IconButton onClick={() => setVal(Math.min(10, val + 0.1))}>
          <AddRounded />
        </IconButton>
      </Stack>

      <Button
        fullWidth
        variant="contained"
        startIcon={<CheckCircleRounded />}
        onClick={() => onSubmit(val)}
      >
        CONFIRM
      </Button>
    </Stack>
  );
};
