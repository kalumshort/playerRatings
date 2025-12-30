import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";

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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import AcUnitIcon from "@mui/icons-material/AcUnit";

import { selectAllPlayersSeasonOverallRating } from "../../Selectors/selectors";
import { selectSeasonSquadDataObject } from "../../Selectors/squadDataSelectors";
import { selectPreviousFixtures } from "../../Selectors/fixturesSelectors";

import useGroupData from "../../Hooks/useGroupsData";
import { useAppNavigate } from "../../Hooks/useAppNavigate";
import { useParams } from "react-router-dom";

// --- STYLED COMPONENTS ---

const PageContainer = styled("div")(({ theme }) => ({
  padding: "20px",
  maxWidth: "1200px",
  margin: "0 auto",
  paddingBottom: "80px",
  [theme.breakpoints.down("sm")]: {
    padding: "10px",
  },
}));

const WidgetCard = styled(Paper)(({ theme }) => ({
  padding: "20px",
  marginBottom: "20px",
  borderRadius: "16px",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: `1px solid ${theme.palette.divider}`,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  fontSize: "1.1rem",
  marginBottom: "4px",
}));

// PODIUM STYLES
const PodiumRow = styled(Box)({
  display: "flex",
  justifyContent: "space-around",
  alignItems: "flex-end",
  height: "140px",
  marginTop: "10px",
});

const PodiumSpot = styled(Box)(({ rank }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  position: "relative",
  transform: rank === 1 ? "scale(1.1) translateY(-10px)" : "none",
  zIndex: rank === 1 ? 2 : 1,
  cursor: "pointer",
}));

const PodiumAvatar = styled(Avatar)(({ rank }) => ({
  width: rank === 1 ? 70 : 50,
  height: rank === 1 ? 70 : 50,

  marginBottom: "8px",
}));

// LIST STYLES
const StickyHeader = styled(Paper)(({ theme }) => ({
  position: "sticky",
  top: "10px",
  zIndex: 10,
  padding: "12px 16px",
  marginBottom: "16px",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: theme.shadows[2],
}));

const PlayerListItem = styled(Paper)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  marginBottom: "10px",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.2s",
  border: `1px solid ${theme.palette.divider}`,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.light,
  },
}));

// --- NEW COLORED PILL COMPONENT ---
// This uses "Soft" colors for readability
const RatingPill = styled("div")(({ theme, score }) => {
  // Determine color based on score directly
  // Adjust these thresholds to match your app's logic
  let bg;

  if (score >= 7.0) {
    // High (Green)
    bg = "rgba(46, 125, 50, 0.12)"; // Soft Green
  } else if (score >= 6.0) {
    // Average (Orange/Yellow)
    bg = "rgba(237, 108, 2, 0.12)"; // Soft Orange
  } else {
    // Low (Red)
    bg = "rgba(211, 47, 47, 0.12)"; // Soft Red
  }

  return {
    backgroundColor: bg,
    padding: "6px 12px",
    borderRadius: "8px",
    fontWeight: 400,
    fontSize: "1rem",
    minWidth: "50px",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
});
// Container for the two cards (Side-by-Side)
const FormRow = styled(Box)({
  display: "flex",
  gap: "16px", // Gap between the two cards
  marginTop: "16px",
});

// The Individual Vertical Card
const FormCard = styled(Box)(({ theme, type }) => {
  const isHot = type === "hot";
  const colorMain = isHot ? theme.palette.error.main : theme.palette.info.main;
  const bgFade = isHot ? "rgba(211, 47, 47, 0.04)" : "rgba(2, 136, 209, 0.04)";

  return {
    flex: 1, // Takes up 50% width
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 12px",
    borderRadius: "16px",
    cursor: "pointer",
    backgroundColor: bgFade, // Very subtle tint
    border: `1px solid ${
      isHot ? theme.palette.error.light : theme.palette.info.light
    }`,
    transition: "all 0.2s ease",

    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: `0 8px 16px ${
        isHot ? "rgba(211, 47, 47, 0.1)" : "rgba(2, 136, 209, 0.1)"
      }`,
      backgroundColor: theme.palette.background.paper,
      borderColor: colorMain,
    },
  };
});

// A pill for the HOT/COLD text
const StatusBadge = styled(Box)(({ theme, type }) => ({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 12px",
  borderRadius: "20px",
  marginBottom: "12px",
  backgroundColor:
    type === "hot" ? theme.palette.error.main : theme.palette.info.main,
  color: "#fff",
  fontWeight: 800,
  fontSize: "0.75rem",
  letterSpacing: "0.5px",
}));

export default function AllPlayerStats() {
  const appNavigate = useAppNavigate();

  const { currentGroup } = useGroupData();

  const { clubSlug } = useParams(); // Now capturing clubSlug from URL

  const groupClubId = Number(currentGroup?.groupClubId);

  // Redux Data
  const squadData = useSelector(
    (state) => selectSeasonSquadDataObject(state, clubSlug) //
  );
  const playerStats = useSelector(selectAllPlayersSeasonOverallRating);
  const previousFixtures = useSelector(selectPreviousFixtures);

  // Local State
  const [sort, setSort] = useState("desc");
  const [positionFilter, setPositionFilter] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- 1. DATA PREPARATION ---
  const allPlayers = useMemo(() => {
    if (!playerStats || !squadData) return [];

    return Object.entries(playerStats)
      .filter(([playerId]) => squadData[playerId])
      .map(([playerId, stats]) => ({
        playerId,
        playerName: squadData[playerId]?.name,
        playerImg: squadData[playerId]?.photo,
        position: squadData[playerId]?.position,
        rating: stats.totalRating / stats.totalSubmits,
        votes: stats.totalSubmits,
      }))
      .filter((p) => p.playerId !== "4720");
  }, [playerStats, squadData]);

  // Top 3 for Leaderboard
  const top3Players = useMemo(() => {
    return [...allPlayers].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [allPlayers]);

  // Main List
  const listPlayers = useMemo(() => {
    let result = [...allPlayers];
    if (positionFilter) {
      result = result.filter((p) => p.position === positionFilter);
    }
    result.sort((a, b) =>
      sort === "asc" ? a.rating - b.rating : b.rating - a.rating
    );
    return result;
  }, [allPlayers, positionFilter, sort]);

  // --- 2. HOT & COLD LOGIC ---
  const { hotPlayer, coldPlayer } = useMemo(() => {
    if (!previousFixtures || !groupClubId || !squadData)
      return { hotPlayer: null, coldPlayer: null };

    // Get Last 3 Matches
    const recentMatches = [...previousFixtures]
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
      .slice(0, 3);

    if (recentMatches.length === 0)
      return { hotPlayer: null, coldPlayer: null };

    const recentForm = {};

    recentMatches.forEach((fixture) => {
      const teamStats = fixture.players?.find((t) => t.team.id === groupClubId);
      if (teamStats && teamStats.players) {
        teamStats.players.forEach((p) => {
          const rating = parseFloat(p.statistics[0]?.games?.rating);
          if (rating) {
            if (!recentForm[p.player.id]) {
              recentForm[p.player.id] = { total: 0, count: 0 };
            }
            recentForm[p.player.id].total += rating;
            recentForm[p.player.id].count += 1;
          }
        });
      }
    });

    const formArray = Object.entries(recentForm).map(([id, data]) => ({
      playerId: id,
      formRating: data.total / data.count,
      matchCount: data.count,
    }));

    const eligible = formArray.filter((p) => p.matchCount >= 1);

    if (eligible.length < 2) {
      const seasonSorted = [...allPlayers].sort((a, b) => b.rating - a.rating);
      return {
        hotPlayer: seasonSorted[0],
        coldPlayer: seasonSorted[seasonSorted.length - 1],
      };
    }

    eligible.sort((a, b) => b.formRating - a.formRating);

    const getDetails = (item) => ({
      ...item,
      playerName: squadData[item.playerId]?.name,
      playerImg: squadData[item.playerId]?.photo,
    });

    return {
      hotPlayer: getDetails(eligible[0]),
      coldPlayer: getDetails(eligible[eligible.length - 1]),
    };
  }, [previousFixtures, groupClubId, squadData, allPlayers]);

  // --- HANDLERS ---
  const handleNavigate = (id) => appNavigate(`/players/${id}`);
  const handleFilterClick = (e) => setAnchorEl(e.currentTarget);
  const handleFilterClose = (val) => {
    if (val !== undefined) setPositionFilter(val);
    setAnchorEl(null);
  };

  return (
    <PageContainer>
      <Grid container spacing={3}>
        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={5} lg={4} order={{ xs: 1, md: 2 }}>
          {/* Leaderboard */}
          <WidgetCard>
            <SectionTitle>Season Leaderboard</SectionTitle>
            <Typography variant="caption" color="text.secondary">
              Top 3 Highest Rated
            </Typography>

            {top3Players.length > 0 && (
              <PodiumRow>
                {/* 2nd */}
                {top3Players[1] && (
                  <PodiumSpot
                    rank={2}
                    onClick={() => handleNavigate(top3Players[1].playerId)}
                  >
                    <PodiumAvatar src={top3Players[1].playerImg} rank={2} />
                    <Typography variant="body2" fontWeight={700}>
                      {top3Players[1].playerName.split(" ").pop()}
                    </Typography>
                    <RatingPill
                      score={top3Players[1].rating}
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.8rem",
                        marginTop: "4px",
                      }}
                    >
                      {top3Players[1].rating.toFixed(2)}
                    </RatingPill>
                  </PodiumSpot>
                )}
                {/* 1st */}
                {top3Players[0] && (
                  <PodiumSpot
                    rank={1}
                    onClick={() => handleNavigate(top3Players[0].playerId)}
                  >
                    <span style={{ fontSize: "1.5rem" }}></span>
                    <PodiumAvatar src={top3Players[0].playerImg} rank={1} />
                    <Typography variant="body1" fontWeight={800}>
                      {top3Players[0].playerName.split(" ").pop()}
                    </Typography>
                    <RatingPill
                      score={top3Players[0].rating}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.9rem",
                        marginTop: "4px",
                      }}
                    >
                      {top3Players[0].rating.toFixed(2)}
                    </RatingPill>
                  </PodiumSpot>
                )}
                {/* 3rd */}
                {top3Players[2] && (
                  <PodiumSpot
                    rank={3}
                    onClick={() => handleNavigate(top3Players[2].playerId)}
                  >
                    <PodiumAvatar src={top3Players[2].playerImg} rank={3} />
                    <Typography variant="body2" fontWeight={700}>
                      {top3Players[2].playerName.split(" ").pop()}
                    </Typography>
                    <RatingPill
                      score={top3Players[2].rating}
                      style={{
                        padding: "2px 8px",
                        fontSize: "0.8rem",
                        marginTop: "4px",
                      }}
                    >
                      {top3Players[2].rating.toFixed(2)}
                    </RatingPill>
                  </PodiumSpot>
                )}
              </PodiumRow>
            )}
          </WidgetCard>

          {/* Hot & Cold */}
          {hotPlayer && coldPlayer && (
            <WidgetCard>
              <SectionTitle>Form Guide</SectionTitle>
              <Typography variant="caption" color="text.secondary">
                Last 3 Matches
              </Typography>

              <FormRow>
                {/* HOT CARD */}
                <FormCard
                  type="hot"
                  onClick={() => handleNavigate(hotPlayer.playerId)}
                >
                  <StatusBadge type="hot">
                    <WhatshotIcon style={{ fontSize: "1rem" }} />
                    HOT
                  </StatusBadge>

                  <Avatar
                    src={hotPlayer.playerImg}
                    sx={{
                      width: 64,
                      height: 64,
                      marginBottom: "12px",
                      border: "2px solid white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />

                  <Typography
                    variant="h6"
                    fontWeight={800}
                    align="center"
                    noWrap
                    sx={{ width: "100%", px: 1 }}
                  >
                    {hotPlayer.playerName.split(" ").pop()}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    Form Rating
                  </Typography>

                  <Typography variant="p" fontWeight={900} color="error">
                    {hotPlayer.formRating
                      ? hotPlayer.formRating.toFixed(1)
                      : hotPlayer.rating.toFixed(1)}
                  </Typography>
                </FormCard>

                {/* COLD CARD */}
                <FormCard
                  type="cold"
                  onClick={() => handleNavigate(coldPlayer.playerId)}
                >
                  <StatusBadge type="cold">
                    <AcUnitIcon style={{ fontSize: "1rem" }} />
                    COLD
                  </StatusBadge>

                  <Avatar
                    src={coldPlayer.playerImg}
                    sx={{
                      width: 64,
                      height: 64,
                      marginBottom: "12px",
                      border: "2px solid white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />

                  <Typography
                    variant="h6"
                    fontWeight={800}
                    align="center"
                    noWrap
                    sx={{ width: "100%", px: 1 }}
                  >
                    {coldPlayer.playerName.split(" ").pop()}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    gutterBottom
                  >
                    Form Rating
                  </Typography>

                  <Typography variant="p" fontWeight={900} color="info">
                    {coldPlayer.formRating
                      ? coldPlayer.formRating.toFixed(1)
                      : coldPlayer.rating.toFixed(1)}
                  </Typography>
                </FormCard>
              </FormRow>
            </WidgetCard>
          )}
        </Grid>

        {/* LEFT COLUMN: LIST */}
        <Grid item xs={12} md={7} lg={8} order={{ xs: 2, md: 1 }}>
          <StickyHeader elevation={0}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight={700}>
                {positionFilter ? `${positionFilter}s` : "All Players"}
              </Typography>
              <Chip label={listPlayers.length} size="small" />
            </Box>
            <Box>
              <IconButton
                onClick={() => setSort((s) => (s === "desc" ? "asc" : "desc"))}
              >
                <SortIcon color={sort === "desc" ? "primary" : "action"} />
              </IconButton>
              <IconButton onClick={handleFilterClick}>
                <FilterListIcon color={positionFilter ? "primary" : "action"} />
              </IconButton>
            </Box>
          </StickyHeader>

          {listPlayers.map((player) => {
            const globalRank =
              allPlayers
                .sort((a, b) => b.rating - a.rating)
                .findIndex((p) => p.playerId === player.playerId) + 1;

            return (
              <PlayerListItem
                key={player.playerId}
                elevation={0}
                onClick={() => handleNavigate(player.playerId)}
              >
                <Typography
                  variant="h6"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ width: 30 }}
                >
                  #{globalRank}
                </Typography>

                <Avatar
                  src={player.playerImg}
                  sx={{ width: 40, height: 40, mr: 2 }}
                />

                <Box flexGrow={1}>
                  <Typography variant="h6">{player.playerName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {player.position}
                  </Typography>
                </Box>

                {/* THE NEW COLORED PILL */}
                <RatingPill score={player.rating}>
                  {player.rating.toFixed(1)}
                </RatingPill>
              </PlayerListItem>
            );
          })}
        </Grid>
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleFilterClose()}
      >
        <MenuItem onClick={() => handleFilterClose("")}>All Positions</MenuItem>
        <MenuItem onClick={() => handleFilterClose("Attacker")}>
          Forwards
        </MenuItem>
        <MenuItem onClick={() => handleFilterClose("Midfielder")}>
          Midfielders
        </MenuItem>
        <MenuItem onClick={() => handleFilterClose("Defender")}>
          Defenders
        </MenuItem>
        <MenuItem onClick={() => handleFilterClose("Goalkeeper")}>
          Goalkeepers
        </MenuItem>
      </Menu>
    </PageContainer>
  );
}
