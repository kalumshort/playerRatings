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

// --- SELECTORS & HOOKS ---
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import { selectSeasonSquadDataObject } from "../../Selectors/squadDataSelectors";
import { allMatchRatings } from "../../Selectors/selectors";
import { useAppNavigate } from "../../Hooks/useAppNavigate";
import { useParams } from "react-router-dom";
import useGroupData from "../../Hooks/useGroupsData";
import useGlobalData from "../../Hooks/useGlobalData";

// IMPORTANT: Double check this path matches where your action is defined
import { fetchMatchPlayerRatings } from "../../Hooks/Fixtures_Hooks";

export default function PlayerFormWidgets() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const appNavigate = useAppNavigate();
  const { clubSlug } = useParams();
  const { activeGroup } = useGroupData();
  const globalData = useGlobalData();

  // 1. Get Base Data
  const previousFixtures = useSelector(selectPreviousFixtures);
  const squadData = useSelector((state) =>
    selectSeasonSquadDataObject(state, clubSlug),
  );
  const ratingsMap = useSelector(allMatchRatings);

  // --- 2. DATA FETCHING EFFECT ---
  useEffect(() => {
    if (
      previousFixtures?.length > 0 &&
      activeGroup?.groupId &&
      globalData?.currentYear
    ) {
      // Get last 3 matches (Newest -> Oldest)
      const last3Matches = [...previousFixtures]
        .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
        .slice(0, 3);

      last3Matches.forEach((match) => {
        const matchId = match.fixture.id;
        // Optimization: Only fetch if the match ID is missing from our ratings map
        if (!ratingsMap[matchId]) {
          dispatch(
            fetchMatchPlayerRatings({
              matchId: matchId,
              groupId: activeGroup.groupId,
              currentYear: globalData.currentYear,
            }),
          );
        }
      });
    }
  }, [previousFixtures, activeGroup, globalData, ratingsMap, dispatch]);

  // --- 3. LOGIC ENGINE ---
  const { hotPlayer, coldPlayer, isLoading } = useMemo(() => {
    // Basic Data Check
    if (!previousFixtures || !squadData) return { isLoading: true };

    const last3Matches = [...previousFixtures]
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
      .slice(0, 3);

    if (last3Matches.length === 0) return { isLoading: false };

    // Check if data is fully loaded for these 3 games
    const haveDataForRecentGames = last3Matches.every(
      (m) => ratingsMap[m.fixture.id],
    );

    // If we are waiting for the fetch to finish, show Skeletons
    if (!haveDataForRecentGames) return { isLoading: true };

    // --- CALCULATION LOGIC ---
    const formStats = {};

    last3Matches.forEach((match) => {
      const matchId = match.fixture.id;
      const matchData = ratingsMap[matchId];

      if (matchData && matchData.players) {
        Object.values(matchData.players).forEach((pStats) => {
          // Handle potential ID differences (api 'id' vs db 'player_id')
          const pId = pStats.id || pStats.player_id;

          // Safety Check: Only process if ID exists in Squad Data
          // This filters out Coaches (4720) or 'null' IDs
          if (!squadData[pId]) return;

          // Rating Formula: Total Rating / Total Submits
          const validSubmits = pStats.totalSubmits || 1;
          const calculatedRating = pStats.totalRating / validSubmits;

          if (calculatedRating > 0) {
            if (!formStats[pId]) {
              formStats[pId] = { total: 0, count: 0 };
            }
            formStats[pId].total += calculatedRating;
            formStats[pId].count += 1;
          }
        });
      }
    });

    const averages = Object.entries(formStats)
      .map(([id, stats]) => ({
        playerId: id,
        avgRating: stats.total / stats.count,
        matchesPlayed: stats.count,
      }))
      // Filter: Player must have played at least 1 of the last 3 games
      .filter((p) => p.matchesPlayed >= 1);

    if (averages.length < 2) return { isLoading: false };

    // Sort High -> Low
    averages.sort((a, b) => b.avgRating - a.avgRating);

    const hydrate = (item) => ({
      ...item,
      // We know squadData exists because of the safety check above
      name: squadData[item.playerId].name,
      photo: squadData[item.playerId].photo,
    });

    return {
      hotPlayer: hydrate(averages[0]),
      coldPlayer: hydrate(averages[averages.length - 1]),
      isLoading: false,
    };
  }, [previousFixtures, ratingsMap, squadData]);

  const handleNavigate = (id) => appNavigate(`/players/${id}`);

  // --- RENDER ---

  // 1. Loading State (Skeletons)
  if (isLoading) {
    return (
      <Paper elevation={0} sx={{ ...theme.clay.card, p: 2, mb: 3 }}>
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
            height={140}
            sx={{ flex: 1, borderRadius: 4 }}
          />
          <Skeleton
            variant="rounded"
            height={140}
            sx={{ flex: 1, borderRadius: 4 }}
          />
        </Stack>
      </Paper>
    );
  }

  // 2. Empty State
  if (!hotPlayer || !coldPlayer) return null;

  // 3. Success State
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        ...theme.clay.card,
        p: 2,
        mb: 3,
      })}
    >
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
          onClick={() => handleNavigate(hotPlayer.playerId)}
        />
        <WidgetCard
          type="cold"
          player={coldPlayer}
          onClick={() => handleNavigate(coldPlayer.playerId)}
        />
      </Stack>
    </Paper>
  );
}

// --- SUB-COMPONENT: TRADING CARD ---
const WidgetCard = ({ type, player, onClick }) => {
  const isHot = type === "hot";

  const mainColor = isHot ? "#ff5722" : "#29b6f6";
  const bgColor = isHot ? "#fbe9e7" : "#e1f5fe";
  const icon = isHot ? (
    <WhatshotRounded fontSize="small" />
  ) : (
    <AcUnitRounded fontSize="small" />
  );
  const label = isHot ? "ON FIRE" : "ICE COLD";

  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        borderRadius: "16px",
        bgcolor: bgColor,
        border: `1px solid ${alpha(mainColor, 0.3)}`,
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 16px ${alpha(mainColor, 0.2)}`,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: mainColor,
          mb: 1.5,
          bgcolor: "white",
          px: 1.5,
          py: 0.5,
          borderRadius: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
      >
        {icon}
        <Typography
          variant="caption"
          fontWeight={900}
          letterSpacing={1}
          sx={{ fontSize: "0.65rem" }}
        >
          {label}
        </Typography>
      </Box>

      <Avatar
        src={player.photo}
        sx={{
          width: 60,
          height: 60,
          border: `3px solid white`,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          mb: 1.5,
        }}
      />

      <Typography
        variant="subtitle2"
        fontWeight={800}
        noWrap
        sx={{ maxWidth: "100%" }}
      >
        {player.name.split(" ").pop()}
      </Typography>

      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        Avg:{" "}
        <Box
          component="span"
          sx={{ color: mainColor, fontSize: "0.9rem", fontWeight: 900 }}
        >
          {player.avgRating.toFixed(1)}
        </Box>
      </Typography>
    </Box>
  );
};
