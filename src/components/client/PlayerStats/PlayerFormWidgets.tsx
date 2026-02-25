"use client";

import React, { useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Paper,
  useTheme,
  alpha,
  Skeleton,
} from "@mui/material";
import { WhatshotRounded, AcUnitRounded } from "@mui/icons-material";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

// --- TYPES & INTERFACES ---
import { RootState, AppDispatch } from "@/lib/redux/store";

interface PlayerForm {
  playerId: string;
  avgRating: number;
  matchesPlayed: number;
  name: string;
  photo: string;
}

// --- SELECTORS & ACTIONS ---
// Replace these with your actual Next.js Redux paths

import { selectPreviousFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import useGlobalData from "@/Hooks/useGlobalData";
import useGroupData from "@/Hooks/useGroupData";
import { selectSeasonSquadData } from "@/lib/redux/selectors/squadSelectors";
import { selectAllMatchRatings } from "@/lib/redux/selectors/ratingsSelectors";
import { fetchMatchPlayerRatings } from "@/lib/redux/actions/ratingsActions";
import { useRouter } from "next/navigation";

export default function PlayerFormWidgets() {
  const router = useRouter();
  const theme = useTheme() as any;
  const dispatch = useDispatch<AppDispatch>();

  const { currentYear } = useGlobalData();
  const { activeGroupId } = useGroupData();

  const { clubSlug } = useParams();

  // Extracting from params safely

  // 1. Get Base Data
  const previousFixtures = useSelector(selectPreviousFixtures);
  // Using the Mapped Squad selector we created earlier for O(1) lookups
  const squadData = useSelector((state: RootState) =>
    selectSeasonSquadData(state),
  );
  const ratingsMap = useSelector(selectAllMatchRatings);

  // Hardcoded or from a global state

  // --- 2. DATA FETCHING EFFECT ---
  useEffect(() => {
    if (previousFixtures?.length > 0 && activeGroupId) {
      const last3Matches = [...previousFixtures]
        .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
        .slice(0, 3);

      last3Matches.forEach((match) => {
        const mId = String(match.fixture.id);
        if (!ratingsMap[mId]) {
          dispatch(
            fetchMatchPlayerRatings({
              matchId: mId,
              groupId: activeGroupId,
              currentYear: currentYear,
            }),
          );
        }
      });
    }
  }, [previousFixtures, activeGroupId, currentYear, ratingsMap, dispatch]);

  // --- 3. LOGIC ENGINE ---
  const { hotPlayer, coldPlayer, isLoading } = useMemo(() => {
    // 1. Basic Guards
    if (
      !previousFixtures ||
      !squadData ||
      Object.keys(squadData).length === 0
    ) {
      return { isLoading: true };
    }

    const last3Matches = [...previousFixtures]
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
      .slice(0, 3);

    if (last3Matches.length === 0) return { isLoading: false };

    // 2. CHECK: Do we have the data?
    // We use .some() instead of .every() so one empty match doesn't break it
    const hasSomeData = last3Matches.some(
      (m) => ratingsMap[String(m.fixture.id)],
    );
    if (!hasSomeData) return { isLoading: true };

    const formStats: Record<string, { total: number; count: number }> = {};

    last3Matches.forEach((match) => {
      const mId = String(match.fixture.id);
      const matchData = ratingsMap[mId];

      if (matchData?.players) {
        // 1. Use Object.entries to get [ID, DATA]
        Object.entries(matchData.players).forEach(
          ([playerId, pStats]: [string, any]) => {
            // 2. The ID is the key from the object
            const pId = String(playerId);

            // 3. Safety check against your squad data
            if (!squadData[pId]) return;

            const totalRating = Number(pStats.totalRating || 0);
            const totalSubmits = Number(pStats.totalSubmits || 1);
            const calculatedRating = totalRating / totalSubmits;

            if (calculatedRating > 0) {
              if (!formStats[pId]) {
                formStats[pId] = { total: 0, count: 0 };
              }
              formStats[pId].total += calculatedRating;
              formStats[pId].count += 1;
            }
          },
        );
      }
    });

    // 3. Convert to averages
    const averages = Object.entries(formStats)
      .map(([id, stats]) => ({
        playerId: id,
        avgRating: stats.total / stats.count,
        matchesPlayed: stats.count,
      }))
      .filter((p) => p.matchesPlayed >= 1);

    // 4. Final Verification
    if (averages.length < 2) {
      // If we have data in Redux but 0 eligible players, stop loading
      return { isLoading: false };
    }

    averages.sort((a, b) => b.avgRating - a.avgRating);

    const hydrate = (item: any) => ({
      ...item,
      name: squadData[item.playerId]?.name || "Unknown",
      photo: squadData[item.playerId]?.photo || "",
    });

    return {
      hotPlayer: hydrate(averages[0]),
      coldPlayer: hydrate(averages[averages.length - 1]),
      isLoading: false,
    };
  }, [previousFixtures, ratingsMap, squadData]);

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ ...theme.clay?.card, p: 2, mb: 3 }}>
        <Typography
          variant="caption"
          sx={{
            mb: 2,
            display: "block",
            fontWeight: 700,
            color: "text.secondary",
          }}
        >
          CHECKING RECENT FORM...
        </Typography>
        <Stack direction="row" spacing={2}>
          <Skeleton
            variant="rounded"
            height={180}
            sx={{ flex: 1, borderRadius: 4 }}
          />
          <Skeleton
            variant="rounded"
            height={180}
            sx={{ flex: 1, borderRadius: 4 }}
          />
        </Stack>
      </Paper>
    );
  }

  if (!hotPlayer || !coldPlayer) return null;

  return (
    <Paper elevation={0} sx={{ ...theme.clay?.card, p: 2, mb: 3 }}>
      <Typography
        variant="caption"
        fontWeight={800}
        sx={{
          ml: 1,
          mb: 2,
          display: "block",
          color: "text.secondary",
          letterSpacing: 0.5,
        }}
      >
        FORM GUIDE (LAST 3 MATCHES)
      </Typography>

      <Stack direction="row" spacing={2}>
        <WidgetCard
          type="hot"
          player={hotPlayer}
          onClick={() =>
            router.push(`/${clubSlug}/players/${hotPlayer.playerId}`)
          }
        />
        <WidgetCard
          type="cold"
          player={coldPlayer}
          onClick={() =>
            router.push(`/${clubSlug}/players/${coldPlayer.playerId}`)
          }
        />
      </Stack>
    </Paper>
  );
}

// --- SUB-COMPONENT: WIDGET CARD ---
const WidgetCard = ({
  type,
  player,
  onClick,
}: {
  type: "hot" | "cold";
  player: PlayerForm;
  onClick: () => void;
}) => {
  const theme = useTheme();
  const isHot = type === "hot";
  const mainColor = isHot ? "#FF3D00" : "#00B0FF";

  return (
    <Box
      onClick={onClick}
      component={motion.div}
      whileHover={{ y: -4 }}
      sx={{
        flex: 1,
        borderRadius: "24px",
        cursor: "pointer",
        position: "relative",
        border: `1px solid ${alpha(mainColor, 0.3)}`,
        background: `linear-gradient(180deg, ${alpha(mainColor, 0.05)} 0%, ${alpha(mainColor, 0.15)} 100%)`,
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          boxShadow: `0 12px 24px -10px ${alpha(mainColor, 0.4)}`,
          borderColor: mainColor,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: "white",
          bgcolor: mainColor,
          px: 1.5,
          py: 0.5,
          borderRadius: "20px",
          boxShadow: `0 4px 12px ${alpha(mainColor, 0.4)}`,
          mb: 2,
        }}
      >
        {isHot ? (
          <WhatshotRounded sx={{ fontSize: 18 }} />
        ) : (
          <AcUnitRounded sx={{ fontSize: 18 }} />
        )}
        <Typography variant="caption" fontWeight={900} letterSpacing={1}>
          {isHot ? "ON FIRE" : "ICE COLD"}
        </Typography>
      </Box>

      <Avatar
        src={player.photo}
        sx={{
          width: 64,
          height: 64,
          border: `3px solid ${theme.palette.background.paper}`,
          boxShadow: `0 0 20px ${alpha(mainColor, 0.4)}`,
          mb: 1,
        }}
      />

      <Typography
        variant="h3"
        sx={{
          fontWeight: 900,
          color: mainColor,
          lineHeight: 1,
          mt: 1,
          mb: 0.5,
          textShadow: `0 2px 10px ${alpha(mainColor, 0.3)}`,
        }}
      >
        {player.avgRating.toFixed(1)}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={700}
        color="text.secondary"
        noWrap
        sx={{ maxWidth: "100%", opacity: 0.8 }}
      >
        {player.name.split(" ").pop()}
      </Typography>
    </Box>
  );
};
