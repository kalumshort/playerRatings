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
  setStoredMotmId,
  storedMotmId,
}: any) {
  const theme = useTheme() as any;
  const matchId = String(fixture.id);
  console.log(matchRatings, "matchRatings in PlayerRatingCard");
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
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[8],
        },
        minHeight: isMobile ? 480 : 520,
        p: isMobile ? 2.5 : 3.5,
      }}
    >
      {/* MOTM STAR – bigger hit area, premium feel */}
      <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        <IconButton
          size="large"
          sx={{
            bgcolor: isMOTM
              ? alpha(theme.palette.secondary.main, 0.9)
              : alpha(theme.palette.background.default, 0.7),
            backdropFilter: "blur(8px)",
            color: isMOTM ? "#fff" : theme.palette.text.secondary,
            borderRadius: "50%",
            border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            width: 56,
            height: 56,
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.12)",
              bgcolor: isMOTM
                ? theme.palette.secondary.dark
                : alpha(theme.palette.primary.main, 0.12),
            },
          }}
          onClick={() => setStoredMotmId(isMOTM ? null : player.id)}
          aria-label={
            isMOTM ? "Remove Man of the Match" : "Set as Man of the Match"
          }
        >
          {isMOTM ? (
            <StarRounded fontSize="large" />
          ) : (
            <StarOutlineRounded fontSize="large" />
          )}
        </IconButton>
      </Box>

      {/* HEADER */}
      <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar
          src={
            player.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
          sx={{
            width: isMobile ? 100 : 120,
            height: isMobile ? 100 : 120,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.18)}`,
            border: `3px solid ${theme.palette.background.paper}`,
          }}
        />

        <Typography
          variant="h5"
          component="h3"
          fontWeight={800}
          letterSpacing={0.5}
          color="text.primary"
          textAlign="center"
          sx={{ textShadow: `0 1px 2px ${alpha("#000", 0.08)}` }}
        >
          {getInitialSurname(player.name).toUpperCase()}
        </Typography>

        {/* Events – nicer spacing */}
        <Stack
          direction="row"
          spacing={1.2}
          flexWrap="wrap"
          justifyContent="center"
          sx={{ minHeight: 36, mt: 0.5 }}
        >
          {playerEvents.map((ev: any, i: number) => (
            <EventBadge key={i} {...ev} />
          ))}
        </Stack>
      </Stack>

      {/* RATING AREA – main focal point */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 1,
        }}
      >
        {usersMatchPlayerRating ? (
          <Stack
            direction="row"
            spacing={3}
            justifyContent="center"
            sx={{ width: "100%", maxWidth: 360 }}
          >
            <ClayScoreDisplay
              label="TEAM AVG"
              score={avgRating}
              color={theme.palette.primary.main}
            />
            <ClayScoreDisplay
              label="YOUR VOTE"
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

// ──────────────────────────────────────────────
//   Modernized sub-components
// ──────────────────────────────────────────────

const ClayScoreDisplay = ({ label, score, color }: any) => {
  const theme = useTheme() as any;

  return (
    <Box
      sx={{
        flex: 1,
        textAlign: "center",
        p: 2.5,
        borderRadius: "20px",
        bgcolor: alpha(color, 0.07),
        border: `1px solid ${alpha(color, 0.18)}`,
      }}
    >
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        sx={{ letterSpacing: 0.8, textTransform: "uppercase" }}
      >
        {label}
      </Typography>

      <Typography
        variant="h4"
        fontWeight={900}
        sx={{
          color,
          mt: 0.5,
          lineHeight: 1,
          textShadow: `0 2px 8px ${alpha(color, 0.3)}`,
        }}
      >
        {score ? Number(score).toFixed(1) : "–"}
      </Typography>
    </Box>
  );
};

const ClayRatingInput = ({ onSubmit }: any) => {
  const [val, setVal] = useState(6.0);
  const theme = useTheme() as any;

  const increment = () => setVal((prev) => Math.min(10, prev + 0.5));
  const decrement = () => setVal((prev) => Math.max(1, prev - 0.5));

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
          onClick={decrement}
          sx={{
            ...theme.clay?.button,
            bgcolor: alpha(theme.palette.background.default, 0.6),
            backdropFilter: "blur(8px)",
          }}
        >
          <RemoveRounded fontSize="large" />
        </IconButton>

        {/* Big circular rating display */}
        <Box
          sx={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(16px)",
            border: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            boxShadow: `inset 0 4px 12px ${alpha("#000", 0.1)},
                        0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            position: "relative",
          }}
        >
          <Typography
            variant="h2"
            component="div"
            fontWeight={900}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}
          >
            {val.toFixed(1)}
          </Typography>
        </Box>

        <IconButton
          size="large"
          onClick={increment}
          sx={{
            ...theme.clay?.button,
            bgcolor: alpha(theme.palette.background.default, 0.6),
            backdropFilter: "blur(8px)",
          }}
        >
          <AddRounded fontSize="large" />
        </IconButton>
      </Stack>

      <Button
        fullWidth
        variant="contained"
        size="large"
        startIcon={<CheckCircleRounded />}
        onClick={() => onSubmit(val)}
        sx={{
          py: 1.8,
          borderRadius: "20px",
          fontWeight: 700,
          letterSpacing: 0.6,
          boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        CONFIRM RATING
      </Button>
    </Stack>
  );
};
