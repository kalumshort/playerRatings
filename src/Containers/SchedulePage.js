import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Paper,
  Typography,
  Box,
  Grid,
  Tooltip,
  Zoom,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { tooltipClasses } from "@mui/material/Tooltip";
import ScheduleContainer from "./ScheduleContainer";

import { selectActiveClubFixtures } from "../Selectors/fixturesSelectors";
import useGroupData from "../Hooks/useGroupsData";

// --- STYLED COMPONENTS ---

const PageLayout = styled("div")({
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

const FixedHeader = styled("div")({
  flexShrink: 0,
  zIndex: 10,
  paddingBottom: "16px", // Space for shadow
});

const ContentArea = styled("div")({
  flexGrow: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

// --- CUSTOM TOOLTIP ---
const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "12px",
    padding: "12px",
    boxShadow: theme.shadows[4],
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.paper,
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
      ["FT", "AET", "PEN"].includes(f.fixture.status.short),
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
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: 3,
            mb: 0, // Margin handled by parent padding
            borderRadius: "0 0 32px 32px", // Only round bottom corners for header feel
            borderTop: "none",
          })}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              fontSize: "1.2rem",
              mb: 3,
              textAlign: "center",
              letterSpacing: -0.5,
            }}
          >
            SEASON OVERVIEW
          </Typography>

          {/* STATS GRID */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <StatBox
                value={seasonData.stats.w}
                label="WON"
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={4}>
              <StatBox
                value={seasonData.stats.d}
                label="DRAWN"
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={4}>
              <StatBox
                value={seasonData.stats.l}
                label="LOST"
                color={theme.palette.error.main}
              />
            </Grid>
          </Grid>

          {/* FORM STRIP */}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              color: "text.secondary",
              ml: 1,
              opacity: 0.6,
            }}
          >
            FORM GUIDE
          </Typography>

          <Box
            sx={(theme) => ({
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              py: 2,
              px: 1,
              mx: -1, // Negative margin to allow full-width scroll feel
              "&::-webkit-scrollbar": { display: "none" },
              "-ms-overflow-style": "none",
              scrollbarWidth: "none",
            })}
          >
            {seasonData.played.map((game) => (
              <HtmlTooltip
                key={game.id}
                TransitionComponent={Zoom}
                enterTouchDelay={0}
                leaveTouchDelay={3000}
                arrow
                title={
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      color="text.primary"
                    >
                      {game.teams.home.name} vs {game.teams.away.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Result:{" "}
                      <Box
                        component="span"
                        sx={{ fontWeight: 900, color: "primary.main" }}
                      >
                        {game.goals.home} - {game.goals.away}
                      </Box>
                    </Typography>
                  </Box>
                }
              >
                <Box
                  sx={(theme) => ({
                    minWidth: "16px",
                    width: "16px",
                    height:
                      game.result === "W"
                        ? "48px"
                        : game.result === "D"
                          ? "32px"
                          : "20px",
                    borderRadius: "20px",
                    bgcolor:
                      game.result === "W"
                        ? "success.main"
                        : game.result === "D"
                          ? "warning.main"
                          : "error.main",

                    // Floating Pill Style
                    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                    transition:
                      "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    cursor: "pointer",
                    alignSelf: "flex-end", // Align bars to bottom

                    "&:hover": {
                      transform: "scaleY(1.2) translateY(-4px)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    },
                  })}
                />
              </HtmlTooltip>
            ))}

            {seasonData.played.length === 0 && (
              <Box
                sx={{
                  width: "100%",
                  textAlign: "center",
                  py: 1,
                  opacity: 0.5,
                }}
              >
                <Typography variant="caption" fontWeight={600}>
                  Matches will appear here as they are played.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </FixedHeader>

      <ContentArea>
        {/* Pass extra props if needed to ScheduleContainer to ensure it fills height */}
        <ScheduleContainer scroll={true} />
      </ContentArea>
    </PageLayout>
  );
}

// --- SUB-COMPONENT: STAT BOX (Pressed Well) ---
const StatBox = ({ value, label, color }) => (
  <Box
    sx={(theme) => ({
      ...theme.clay.box, // Pressed Well
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 1.5,
      borderRadius: "16px",
      bgcolor: "background.default",
    })}
  >
    <Typography
      sx={{
        fontWeight: 900,
        fontSize: "1.8rem",
        lineHeight: 1,
        color: color,
      }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      sx={{
        fontSize: "0.65rem",
        fontWeight: 800,
        color: "text.secondary",
        mt: 0.5,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Typography>
  </Box>
);
