import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import {
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  Stack,
  Grid,
  useTheme,
  alpha,
  Skeleton,
  Fade,
  Divider,
} from "@mui/material";
import {
  ArrowForwardRounded,
  TrendingUpRounded,
  HistoryRounded,
  SportsSoccerRounded,
} from "@mui/icons-material";

// Selectors & Hooks
import { selectSquadPlayerById } from "../../Selectors/squadDataSelectors";
import {
  selectPlayerRatingsById,
  selectPlayerRatingsLoad,
} from "../../Selectors/selectors";
import {
  fetchPlayerRatingsAllMatches,
  fetchAllPlayersSeasonOverallRating,
} from "../../Hooks/Fixtures_Hooks";
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";
import useGroupData from "../../Hooks/useGroupsData";
import useGlobalData from "../../Hooks/useGlobalData";
import PlayerRatingsLineGraph from "./PlayerRatingsLineGraph";
import {
  getPlayersFixtureEvents,
  useAppPaths,
} from "../../Hooks/Helper_Functions";
import { EventBadge } from "../Widgets/EventBadge";

// --- HELPERS ---
const getResultColor = (result, theme) => {
  if (result === "W") return theme.palette.success.main;
  if (result === "D") return theme.palette.warning.main;
  return theme.palette.error.main;
};

const getResultBg = (result, theme) => {
  if (result === "W") return alpha(theme.palette.success.main, 0.1);
  if (result === "D") return alpha(theme.palette.warning.main, 0.1);
  return alpha(theme.palette.error.main, 0.1);
};

export default function PlayerPage() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { clubSlug, playerId } = useParams();
  const { activeGroup } = useGroupData();
  const globalData = useGlobalData();

  // Data Selectors
  const playerData = useSelector((state) =>
    selectSquadPlayerById(playerId, clubSlug)(state),
  );
  const groupId = activeGroup?.groupId;
  const allPlayerRatings = useSelector(selectPlayerRatingsById(playerId));
  const previousFixtures = useSelector(selectPreviousFixtures);
  const { playerSeasonOverallRatingsLoaded } = useSelector(
    selectPlayerRatingsLoad,
  );

  // --- DATA FETCHING ---
  useEffect(() => {
    if (playerId && groupId && globalData.currentYear) {
      dispatch(
        fetchPlayerRatingsAllMatches({
          playerId,
          groupId: groupId,
          currentYear: globalData.currentYear,
        }),
      );
    }
  }, [dispatch, playerId, groupId, globalData.currentYear]);

  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded && groupId) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: groupId,
          currentYear: globalData.currentYear,
        }),
      );
    }
  }, [
    dispatch,
    playerSeasonOverallRatingsLoaded,
    groupId,
    globalData.currentYear,
  ]);

  // Loading & Calc
  const isLoading = !playerData || !allPlayerRatings?.matches;
  const seasonAverageRating =
    allPlayerRatings?.seasonOverall?.totalRating /
      allPlayerRatings?.seasonOverall?.totalSubmits || 0;

  if (isLoading) return <PlayerPageSkeleton />;

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        pb: 10,
        px: { xs: 2, md: 4 },
        pt: 2,
      }}
    >
      <Grid container spacing={3}>
        {/* --- LEFT COLUMN: STICKY PROFILE CARD --- */}
        <Grid item xs={12} md={4} lg={3}>
          <Box
            sx={{
              position: { md: "sticky" },
              top: { md: 100 }, // Stick to top on web
            }}
          >
            <Paper
              elevation={0}
              sx={{
                ...theme.clay.card,
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                background: theme.palette.background.paper, // Clean White
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Background Decor (Optional) */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "80px",
                  bgcolor: alpha(theme.palette.text.primary, 0.03),
                }}
              />

              <Avatar
                src={playerData?.photo}
                sx={{
                  width: 120,
                  height: 120,
                  border: `6px solid ${theme.palette.background.paper}`,
                  boxShadow: theme.shadows[3],
                  mt: 2,
                  mb: 2,
                  bgcolor: "grey.200",
                }}
              />

              <Typography variant="h5" fontWeight={900} gutterBottom>
                {playerData?.name}
              </Typography>

              <Stack direction="row" spacing={1} mb={3}>
                <Chip
                  icon={<SportsSoccerRounded sx={{ fontSize: 16 }} />}
                  label={playerData?.position}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`#${playerData?.number}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Divider flexItem sx={{ mb: 3 }} />

              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  letterSpacing={1}
                >
                  SEASON RATING
                </Typography>
                <Typography
                  variant="h2"
                  fontWeight={900}
                  sx={{ color: "text.primary", letterSpacing: -1 }}
                >
                  {seasonAverageRating.toFixed(1)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* --- RIGHT COLUMN: CONTENT STREAM --- */}
        <Grid item xs={12} md={8} lg={9}>
          <Stack spacing={3}>
            {/* 1. PERFORMANCE GRAPH */}
            {allPlayerRatings?.matches && (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  mb={2}
                  pl={1}
                >
                  <TrendingUpRounded color="action" />
                  <Typography variant="h6" fontWeight={800}>
                    Form Trajectory
                  </Typography>
                </Stack>

                <Paper
                  elevation={0}
                  sx={{
                    ...theme.clay.card,
                    p: 2,
                    height: "300px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box width="100%" height="100%">
                    <PlayerRatingsLineGraph
                      allPlayerRatings={allPlayerRatings}
                      clubId={activeGroup?.groupClubId || groupId}
                    />
                  </Box>
                </Paper>
              </Box>
            )}

            {/* 2. MATCH HISTORY */}
            {previousFixtures && allPlayerRatings?.matches && (
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  mb={2}
                  pl={1}
                >
                  <HistoryRounded color="action" />
                  <Typography variant="h6" fontWeight={800}>
                    Match History
                  </Typography>
                </Stack>

                <Stack spacing={1.5}>
                  {previousFixtures.map((fixture, index) => {
                    const matchStats = Object.values(
                      allPlayerRatings.matches,
                    ).find((m) => m.id === fixture.id);

                    if (!matchStats) return null;

                    return (
                      <Fade in key={fixture.id} timeout={300 + index * 50}>
                        <div>
                          <PlayerMatchRow
                            fixture={fixture}
                            matchStats={matchStats}
                            groupClubId={activeGroup?.groupClubId || groupId}
                            playerId={playerId}
                          />
                        </div>
                      </Fade>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

// --- SUB COMPONENT: MATCH ROW ---
const PlayerMatchRow = ({ fixture, matchStats, groupClubId, playerId }) => {
  const theme = useTheme();
  const { getPath } = useAppPaths();

  const clubIdNum = Number(groupClubId);
  const pIdNum = Number(playerId);

  // 1. Result Logic
  const isHome = fixture.teams.home.id === clubIdNum;
  const homeWin = fixture.teams.home.winner;
  const awayWin = fixture.teams.away.winner;

  let result = "D";
  if ((isHome && homeWin) || (!isHome && awayWin)) result = "W";
  else if ((isHome && awayWin) || (!isHome && homeWin)) result = "L";

  // 2. Data Prep
  const opponent = isHome ? fixture.teams.away : fixture.teams.home;
  const scoreStr = `${fixture.score.fulltime.home} - ${fixture.score.fulltime.away}`;
  const rating = matchStats
    ? matchStats.totalRating / matchStats.totalSubmits
    : 0;

  const events = useMemo(
    () => getPlayersFixtureEvents(fixture, pIdNum),
    [fixture, pIdNum],
  );

  const dateObj = new Date(fixture.fixture.timestamp * 1000);
  const dayName = dateObj.toLocaleDateString("en-GB", { weekday: "short" });
  const dayNum = dateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  // Color Logic
  const statusColor = getResultColor(result, theme);

  return (
    <Link
      to={getPath(`/fixture/${fixture.id}`)}
      style={{ textDecoration: "none" }}
    >
      <Paper
        sx={{
          // 1. Base Clay Style

          p: 0, // Reset padding to handle border correctly
          overflow: "hidden", // Ensure border radius clips content
          display: "flex",
          alignItems: "center",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",

          // 2. The "Classic" Left Border Strip
          borderLeft: `6px solid ${statusColor}`,

          "&:hover": {
            transform: "translateY(-2px) translateX(4px)",
          },
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", width: "100%", p: 2 }}
        >
          {/* DATE (Left Aligned) */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "55px",
              mr: 2,
              opacity: 0.8,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              lineHeight={1}
              sx={{ fontSize: "0.7rem", textTransform: "uppercase" }}
            >
              {dayName}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={900}
              color="text.primary"
              lineHeight={1.2}
            >
              {dayNum}
            </Typography>
          </Box>

          {/* OPPONENT & SCORE (Center) */}
          <Box
            display="flex"
            alignItems="center"
            flexGrow={1}
            overflow="hidden"
          >
            <Avatar
              src={opponent.logo}
              variant="rounded" // Rounded square looks more modern for clubs
              sx={{
                width: 36,
                height: 36,
                mr: 2,
                bgcolor: "transparent",
                "& img": { objectFit: "contain" },
              }}
            />

            <Box
              overflow="hidden"
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="body2"
                fontWeight={800}
                noWrap
                sx={{ fontSize: "0.95rem" }}
              >
                vs {opponent.name}
              </Typography>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: statusColor }}
                >
                  {scoreStr}
                </Typography>

                {/* Events (Goals/Cards) */}
                {events.length > 0 && (
                  <Stack direction="row" spacing={0.5}>
                    {events.map((e, i) => (
                      <EventBadge key={i} type={e.type} />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>
          </Box>

          {/* RATING (Right) */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                minWidth: "45px",
                textAlign: "center",
                py: 0.5,
                px: 1,
                borderRadius: "8px",
                bgcolor: getResultBg(result, theme), // Subtle colored background
                color: statusColor, // Text matches result
                border: `1px solid ${alpha(statusColor, 0.2)}`,
              }}
            >
              <Typography variant="subtitle2" fontWeight={900}>
                {rating.toFixed(1)}
              </Typography>
            </Box>

            <ArrowForwardRounded
              sx={{
                fontSize: 18,
                color: "text.disabled",
                display: { xs: "none", sm: "block" },
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Link>
  );
};

// --- LOADING SKELETON ---
const PlayerPageSkeleton = () => (
  <Box sx={{ maxWidth: "1200px", mx: "auto", pb: 10, px: 3, pt: 2 }}>
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      </Grid>
      <Grid item xs={12} md={8}>
        <Skeleton
          variant="rounded"
          height={300}
          sx={{ mb: 3, borderRadius: 3 }}
        />
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={70}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Stack>
      </Grid>
    </Grid>
  </Box>
);
