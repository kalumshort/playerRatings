import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { Paper, Typography, Box, Avatar, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

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
  RatingBadge,
  useAppPaths,
} from "../../Hooks/Helper_Functions";
import { EventBadge } from "../Widgets/EventBadge";

// --- STYLED COMPONENTS ---

const PageContainer = styled("div")(({ theme }) => ({
  maxWidth: "800px",
  margin: "0 auto",
  padding: "20px",
  paddingBottom: "80px",
  [theme.breakpoints.down("sm")]: {
    padding: "10px", // Tighter page padding on mobile
  },
}));

// 1. HERO PROFILE - OPTIMIZED FOR MOBILE
const HeroSection = styled(Paper)(({ theme }) => ({
  padding: "24px",
  borderRadius: "12px",
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: "20px",
  display: "flex",
  alignItems: "center",
  gap: "24px",

  // Mobile Adjustments
  [theme.breakpoints.down("sm")]: {
    padding: "16px", // Less padding
    gap: "16px", // Less gap
    // Keep it ROW (horizontal) to save vertical space
    flexDirection: "row",
    alignItems: "flex-start", // Align top
    marginBottom: "16px",
  },
}));

const HeroAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  border: "2px solid #fff",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  [theme.breakpoints.down("sm")]: {
    width: 60, // Smaller avatar on mobile
    height: 60,
  },
}));

// 2. GRAPH CONTAINER
const GraphSection = styled(Paper)(({ theme }) => ({
  padding: "20px",
  borderRadius: "12px",
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: "24px",
  [theme.breakpoints.down("sm")]: {
    padding: "10px",
    marginBottom: "16px",
  },
}));

// 3. MATCH ROW - OPTIMIZED FOR MOBILE CROWDING
const MatchItem = styled(Paper)(({ theme, result }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px",
  marginBottom: "10px",
  borderRadius: "10px",
  border: `1px solid ${theme.palette.divider}`,
  borderLeft: `6px solid ${
    result === "W"
      ? theme.palette.success.main
      : result === "D"
      ? theme.palette.warning.main
      : theme.palette.error.main
  }`,
  transition: "transform 0.2s ease",
  cursor: "pointer",
  "&:hover": {
    transform: "translateX(4px)",
    backgroundColor: theme.palette.action.hover,
  },
  [theme.breakpoints.down("sm")]: {
    padding: "12px", // Compact padding
    marginBottom: "8px",
  },
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 900,
  fontSize: "1.2rem",
  marginBottom: "12px",
  color: theme.palette.text.primary,
}));

// --- MAIN COMPONENT ---

export default function PlayerPage() {
  const { activeGroup } = useGroupData();

  const globalData = useGlobalData();
  const dispatch = useDispatch();

  const { clubSlug, playerId } = useParams();
  const playerData = useSelector((state) =>
    selectSquadPlayerById(playerId, clubSlug)(state)
  );

  const groupId = activeGroup?.groupId;
  const allPlayerRatings = useSelector(selectPlayerRatingsById(playerId));
  const previousFixtures = useSelector(selectPreviousFixtures);
  const { playerAllMatchesRatingLoaded, playerSeasonOverallRatingsLoaded } =
    useSelector(selectPlayerRatingsLoad);

  useEffect(() => {
    dispatch(
      fetchPlayerRatingsAllMatches({
        playerId,
        groupId: groupId,
        currentYear: globalData.currentYear,
      })
    );
  }, [dispatch, playerId, groupId, globalData.currentYear]);

  useEffect(() => {
    if (!playerSeasonOverallRatingsLoaded) {
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: groupId,
          currentYear: globalData.currentYear,
        })
      );
    }
  }, [
    dispatch,
    playerSeasonOverallRatingsLoaded,
    groupId,
    globalData.currentYear,
  ]);

  if (!playerSeasonOverallRatingsLoaded && !playerAllMatchesRatingLoaded)
    return <div className="spinner"></div>;

  const seasonAverageRating =
    allPlayerRatings?.seasonOverall?.totalRating /
      allPlayerRatings?.seasonOverall?.totalSubmits || 0;

  return (
    <PageContainer>
      {/* 1. HERO PROFILE */}
      <HeroSection elevation={0}>
        <HeroAvatar src={playerData?.photo} />

        <Box flexGrow={1}>
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            {playerData?.name}
          </Typography>

          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mt={0.5}
            flexWrap="wrap"
          >
            <Chip
              label={playerData?.position}
              size="small"
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              #{playerData?.number}
            </Typography>
          </Box>
        </Box>

        {/* Rating Box - Keeps fixed width to prevent squashing */}
        <Box textAlign="center" minWidth="70px">
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{ fontSize: "0.65rem" }}
          >
            SEASON AVG
          </Typography>
          <Box display="flex" justifyContent="center">
            <RatingBadge
              score={seasonAverageRating}
              style={{ width: "60px", padding: "8px 0", fontSize: "1.2rem" }}
            >
              {seasonAverageRating.toFixed(1)}
            </RatingBadge>
          </Box>
        </Box>
      </HeroSection>

      {/* 2. GRAPH */}
      {allPlayerRatings?.matches && (
        <Box mb={4}>
          <SectionHeader>Performance History</SectionHeader>
          <GraphSection elevation={0}>
            <div style={{ width: "100%", height: "250px" }}>
              <PlayerRatingsLineGraph
                allPlayerRatings={allPlayerRatings}
                clubId={activeGroup?.groupClubId || groupId}
              />
            </div>
          </GraphSection>
        </Box>
      )}

      {/* 3. MATCH LIST */}
      {previousFixtures && allPlayerRatings?.matches && (
        <Box>
          <SectionHeader>Matches</SectionHeader>
          {previousFixtures.map((fixture, index) => {
            const matchStats = Object.values(allPlayerRatings.matches).find(
              (m) => m.id === fixture.id
            );
            if (!matchStats) return null;

            const matchTime = new Date(
              fixture.fixture.timestamp * 1000
            ).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });

            return (
              <PlayerMatchRow
                key={fixture.id || index}
                fixture={fixture}
                matchTime={matchTime}
                matchStats={matchStats}
                groupClubId={activeGroup?.groupClubId || groupId}
                playerId={playerId}
              />
            );
          })}
        </Box>
      )}
    </PageContainer>
  );
}

// --- SUB COMPONENT ---
const PlayerMatchRow = ({
  fixture,
  matchTime,
  matchStats,
  groupClubId,
  playerId,
}) => {
  const { getPath } = useAppPaths();

  const clubIdNum = Number(groupClubId);
  const pIdNum = Number(playerId);

  // 1. Determine Result
  const isHome = fixture.teams.home.id === clubIdNum;
  const homeWin = fixture.teams.home.winner;
  const awayWin = fixture.teams.away.winner;
  let result = "D";
  if ((isHome && homeWin) || (!isHome && awayWin)) result = "W";
  else if ((isHome && awayWin) || (!isHome && homeWin)) result = "L";

  // 2. Find Opponent & Score
  const opponent = isHome ? fixture.teams.away : fixture.teams.home;
  const scoreStr = `${fixture.score.fulltime.home} - ${fixture.score.fulltime.away}`;
  const rating = matchStats
    ? matchStats.totalRating / matchStats.totalSubmits
    : 0;

  // 3. Get Player Events
  const events = useMemo(
    () => getPlayersFixtureEvents(fixture, pIdNum),
    [fixture, pIdNum]
  );

  return (
    <Link
      to={getPath(`/fixture/${fixture.id}`)}
      style={{ textDecoration: "none" }}
    >
      <MatchItem elevation={0} result={result}>
        {/* LEFT: DATE */}
        {/* On mobile, we reduce width to save space */}
        <Box
          display="flex"
          flexDirection="column"
          sx={{ width: { xs: "50px", sm: "80px" } }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            color="text.primary"
            sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}
          >
            {matchTime.split(",")[1] || matchTime}{" "}
            {/* Fallback: shows just date part on mobile if formatted as "Mon, 12 Oct" */}
          </Typography>
          {/* Hide League Name on Mobile to reduce clutter */}
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {fixture.league.name}
          </Typography>
        </Box>

        {/* CENTER: OPPONENT & EVENTS */}
        <Box
          display="flex"
          alignItems="center"
          flex={1}
          gap={2}
          ml={1}
          sx={{ overflow: "hidden" }}
        >
          <img
            src={opponent.logo}
            alt={opponent.name}
            style={{ width: 32, height: 32, objectFit: "contain" }}
          />
          <Box sx={{ minWidth: 0, width: "100%" }}>
            {/* Name & Events Container */}
            <Box
              display="flex"
              alignItems={{ xs: "flex-start", sm: "center" }}
              flexDirection={{ xs: "column", sm: "row" }} // Stack on mobile
              gap={{ xs: 0.5, sm: 1 }}
            >
              <Typography variant="body2" fontWeight={800} noWrap>
                vs {opponent.name}
              </Typography>

              {/* Event Badges */}
              {/* On mobile this sits BELOW the name due to column flex */}
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {events.map((event, index) => (
                  <EventBadge
                    key={index}
                    type={event.type}
                    label={event.label}
                    time={event.time}
                  />
                ))}
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" noWrap>
              Result: {scoreStr}
            </Typography>
          </Box>
        </Box>

        {/* RIGHT: RATING */}
        <Box display="flex" alignItems="center" gap={1} ml={1}>
          <RatingBadge score={rating}>
            {rating > 0 ? rating.toFixed(1) : "-"}
          </RatingBadge>
          <ArrowForwardIosIcon
            sx={{
              fontSize: "12px",
              color: "text.disabled",
              display: { xs: "none", sm: "block" },
            }}
          />
        </Box>
      </MatchItem>
    </Link>
  );
};
