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
      const last3Matches = [...previousFixtures]
        .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
        .slice(0, 3);

      last3Matches.forEach((match) => {
        const matchId = match.fixture.id;
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
    if (!previousFixtures || !squadData) return { isLoading: true };

    const last3Matches = [...previousFixtures]
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
      .slice(0, 3);

    if (last3Matches.length === 0) return { isLoading: false };

    const haveDataForRecentGames = last3Matches.every(
      (m) => ratingsMap[m.fixture.id],
    );

    if (!haveDataForRecentGames) return { isLoading: true };

    const formStats = {};

    last3Matches.forEach((match) => {
      const matchId = match.fixture.id;
      const matchData = ratingsMap[matchId];

      if (matchData && matchData.players) {
        Object.values(matchData.players).forEach((pStats) => {
          const pId = pStats.id || pStats.player_id;
          if (!squadData[pId]) return;

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
      .filter((p) => p.matchesPlayed >= 1);

    if (averages.length < 2) return { isLoading: false };

    averages.sort((a, b) => b.avgRating - a.avgRating);

    const hydrate = (item) => ({
      ...item,
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

  // 1. Loading State
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

// --- SUB-COMPONENT: REDESIGNED WIDGET CARD ---
const WidgetCard = ({ type, player, onClick }) => {
  const theme = useTheme();
  const isHot = type === "hot";

  // Use vibrant colors
  const mainColor = isHot ? "#FF3D00" : "#00B0FF"; // Deep Orange vs Light Blue

  // Icon & Label
  const icon = isHot ? (
    <WhatshotRounded sx={{ fontSize: 18 }} />
  ) : (
    <AcUnitRounded sx={{ fontSize: 18 }} />
  );
  const label = isHot ? "ON FIRE" : "ICE COLD";

  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        borderRadius: "24px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${alpha(mainColor, 0.3)}`,

        // --- NEW BACKGROUND: Subtle Gradient Glass ---
        background: `linear-gradient(180deg, ${alpha(mainColor, 0.05)} 0%, ${alpha(mainColor, 0.15)} 100%)`,

        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px -10px ${alpha(mainColor, 0.4)}`,
          borderColor: mainColor,
        },
      }}
    >
      {/* HEADER PILL */}
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
        {icon}
        <Typography variant="caption" fontWeight={900} letterSpacing={1}>
          {label}
        </Typography>
      </Box>

      {/* AVATAR WITH GLOW */}
      <Avatar
        src={player.photo}
        sx={{
          width: 64,
          height: 64,
          border: `3px solid ${theme.palette.background.paper}`,
          // Glow effect matching the type color
          boxShadow: `0 0 20px ${alpha(mainColor, 0.4)}`,
          mb: 1,
        }}
      />

      {/* HUGE RATING */}
      <Typography
        variant="h3"
        sx={{
          fontWeight: 900,
          color: mainColor,
          lineHeight: 1,
          mt: 1,
          mb: 0.5,
          // Text Shadow to make it pop
          textShadow: `0 2px 10px ${alpha(mainColor, 0.3)}`,
        }}
      >
        {player.avgRating.toFixed(1)}
      </Typography>

      {/* PLAYER NAME */}
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
