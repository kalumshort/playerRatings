import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Paper, Typography, Box, Grid, Tooltip, Zoom } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { tooltipClasses } from "@mui/material/Tooltip";
import ScheduleContainer from "./ScheduleContainer";

import { selectActiveClubFixtures } from "../Selectors/fixturesSelectors";
import useGroupData from "../Hooks/useGroupsData";

// --- LAYOUT COMPONENTS ---

const PageLayout = styled("div")({
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

const FixedHeader = styled("div")({
  flexShrink: 0,

  zIndex: 10,
});

const ContentArea = styled("div")({
  flexGrow: 1,
  minHeight: 0,
});

// --- HEADER STYLES ---

const SeasonHeader = styled(Paper)(({ theme }) => ({
  padding: "16px 0 10px 0",
  marginBottom: "16px",
}));

const StatBox = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: "8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const StatValue = styled(Typography)(({ theme, color }) => ({
  fontWeight: 800,
  fontSize: "1.6rem",
  lineHeight: 1,
  color: color || theme.palette.text.primary,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.7rem",
  textTransform: "uppercase",
  color: theme.palette.text.secondary,
  fontWeight: 700,
  marginTop: "4px",
}));

const FormStrip = styled("div")({
  display: "flex",
  gap: "6px",
  overflowX: "auto",
  padding: "16px 16px 8px 16px",
  marginTop: "8px",
  "&::-webkit-scrollbar": { display: "none" },
  "-ms-overflow-style": "none",
  scrollbarWidth: "none",
  scrollBehavior: "smooth",
});

const MatchBar = styled("div")(({ theme, result, height }) => ({
  minWidth: "14px",
  width: "14px",
  height: height,
  borderRadius: "20px",
  backgroundColor:
    result === "W"
      ? theme.palette.success.main
      : result === "D"
      ? theme.palette.warning.main
      : theme.palette.error.main,
  opacity: 0.85,
  position: "relative",
  flexShrink: 0,
  cursor: "pointer",
  transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",

  "&:hover": {
    transform: "scaleY(1.3)",
    opacity: 1,
  },
  "&:active": {
    transform: "scale(0.9)",
  },
}));

const HeaderTitle = styled(Typography)(({ theme }) => ({
  padding: "0 16px",
  fontWeight: 900,
  fontSize: "1.2rem",
  marginBottom: "10px",
  color: theme.palette.text.primary,
}));

// --- CUSTOM TOOLTIP STYLE ---
// This makes the popup look like a sleek black bubble
const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "8px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#1a1a1a",
  },
}));

export default function SchedulePage() {
  const theme = useTheme();
  const { activeGroup } = useGroupData();

  const groupClubId = Number(activeGroup.groupClubId);
  const allFixtures = useSelector(selectActiveClubFixtures);
  // --- STATS CALCULATION ---
  const seasonData = useMemo(() => {
    if (!allFixtures) return { played: [], stats: { w: 0, d: 0, l: 0 } };

    const playedGames = allFixtures.filter((f) =>
      ["FT", "AET", "PEN"].includes(f.fixture.status.short)
    );
    // Sort Oldest -> Newest
    playedGames.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);

    const stats = { w: 0, d: 0, l: 0 };
    const processedGames = playedGames.map((game) => {
      const isHome = game.teams.home.id === groupClubId;
      const homeWin = game.teams.home.winner;
      const awayWin = game.teams.away.winner;
      let result = "D";
      if ((isHome && homeWin) || (!isHome && awayWin)) result = "W";
      else if ((isHome && awayWin) || (!isHome && homeWin)) result = "L";

      if (result === "W") stats.w++;
      if (result === "D") stats.d++;
      if (result === "L") stats.l++;
      return { ...game, result };
    });

    return { played: processedGames, stats };
  }, [allFixtures, groupClubId]);

  return (
    <PageLayout className="containerMargin">
      <FixedHeader>
        <SeasonHeader elevation={0}>
          <HeaderTitle>Season Overview</HeaderTitle>

          <Grid container spacing={0} sx={{ padding: "0 8px" }}>
            <Grid item xs={4}>
              <StatBox>
                <StatValue color={theme.palette.success.main}>
                  {seasonData.stats.w}
                </StatValue>
                <StatLabel>Won</StatLabel>
              </StatBox>
            </Grid>
            <Grid item xs={4}>
              <StatBox>
                <StatValue color={theme.palette.warning.main}>
                  {seasonData.stats.d}
                </StatValue>
                <StatLabel>Drawn</StatLabel>
              </StatBox>
            </Grid>
            <Grid item xs={4}>
              <StatBox>
                <StatValue color={theme.palette.error.main}>
                  {seasonData.stats.l}
                </StatValue>
                <StatLabel>Lost</StatLabel>
              </StatBox>
            </Grid>
          </Grid>

          <FormStrip>
            {seasonData.played.map((game) => (
              <HtmlTooltip
                key={game.id}
                TransitionComponent={Zoom}
                enterTouchDelay={0} // Makes it work instantly on tap for mobile
                leaveTouchDelay={3000} // Hides after 3s or when tapping elsewhere
                arrow
                title={
                  <React.Fragment>
                    <Typography
                      color="inherit"
                      sx={{ fontSize: "0.85rem", fontWeight: 700 }}
                    >
                      {game.teams.home.name} vs {game.teams.away.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", marginTop: "4px" }}>
                      Result:{" "}
                      <span style={{ fontWeight: 800, color: "#4fc3f7" }}>
                        {game.goals.home} - {game.goals.away}
                      </span>
                    </Typography>
                  </React.Fragment>
                }
              >
                <MatchBar
                  result={game.result}
                  height={
                    game.result === "W"
                      ? "45px"
                      : game.result === "D"
                      ? "30px"
                      : "15px"
                  }
                />
              </HtmlTooltip>
            ))}
            {seasonData.played.length === 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: "100%", textAlign: "center", p: 2 }}
              >
                Matches will appear here as they are played.
              </Typography>
            )}
          </FormStrip>
        </SeasonHeader>
      </FixedHeader>

      <ContentArea>
        <ScheduleContainer scroll={true} />
      </ContentArea>
    </PageLayout>
  );
}
