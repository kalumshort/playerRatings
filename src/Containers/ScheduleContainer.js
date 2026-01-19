import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  MenuItem,
  Select,
  FormControl,
  Typography,
  Box,
  Paper,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  selectActiveClubFixtures,
  selectLatestFixture,
} from "../Selectors/fixturesSelectors";
import FixtureListItem from "../Components/Fixtures/FixtureListItem";
import { useAppNavigate } from "../Hooks/useAppNavigate";
import { useAppPaths } from "../Hooks/Helper_Functions";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 16px",
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: "0px",
  background: "rgba(255,255,255,0.02)", // Subtle tint
}));

const ScrollContainer = styled("div")(({ scroll }) => ({
  // If scroll is false, we let the parent handle height (flex-grow)
  // If scroll is true, we cap it (e.g., for a widget)
  height: scroll ? "70vh" : "auto",
  maxHeight: scroll ? "70vh" : "none",
  overflowY: scroll ? "auto" : "visible",
  overflowX: "hidden", // Stops horizontal wobble
  scrollBehavior: "smooth",
  paddingBottom: "80px", // Extra padding at bottom for mobile nav clearance
  position: "relative",
  width: "100%",

  "&::-webkit-scrollbar": {
    display: "none",
  },
  "-ms-overflow-style": "none",
  scrollbarWidth: "none",
}));

export default function ScheduleContainer({
  limitAroundLatest = 0,
  showLink,
  scroll = true, // Default to true for standalone use
  scrollOnLoad = true,
}) {
  const appNavigate = useAppNavigate();
  const { getPath } = useAppPaths();

  const allFixtures = useSelector(selectActiveClubFixtures);
  const latestFixture = useSelector(selectLatestFixture);

  const [selectedLeague, setSelectedLeague] = useState("");

  const containerRef = useRef(null);
  const itemsRef = useRef(new Map());

  // --- DATA PROCESSING ---
  const displayFixtures = useMemo(() => {
    if (!allFixtures) return [];

    let processed = selectedLeague
      ? allFixtures.filter((item) => item.league.name === selectedLeague)
      : [...allFixtures];

    // Sort: Newest First (Desc)
    processed.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

    // Limit logic (optional)
    if (limitAroundLatest > 0 && latestFixture) {
      const targetIndex = processed.findIndex((f) => f.id === latestFixture.id);
      if (targetIndex !== -1) {
        const start = Math.max(0, targetIndex - limitAroundLatest);
        const end = Math.min(
          processed.length,
          targetIndex + limitAroundLatest + 1,
        );
        return processed.slice(start, end);
      }
    }

    return processed;
  }, [allFixtures, selectedLeague, latestFixture, limitAroundLatest]);

  const leagueOptions = useMemo(() => {
    if (!allFixtures) return [];
    return [...new Set(allFixtures.map((item) => item.league.name))];
  }, [allFixtures]);

  const handleChange = useCallback((event) => {
    setSelectedLeague(event.target.value);
  }, []);

  const handleFixtureClick = useCallback(
    (matchId) => {
      appNavigate(`/fixture/${matchId}`);
    },
    [appNavigate],
  );

  // --- SCROLL TO ACTIVE MATCH ---
  useLayoutEffect(() => {
    // Only scroll if internal scrolling is enabled OR if we can access the parent window
    // Ideally, for the 'scroll=false' mode (SchedulePage), the parent handles scroll.
    // This logic specifically targets the Ref attached to THIS component's wrapper.
    if (latestFixture && scrollOnLoad && containerRef.current) {
      const node = itemsRef.current.get(latestFixture.id);
      const container = containerRef.current;

      // Check if we are in "Widget Mode" (scroll=true) or "Page Mode" (scroll=false)
      // If Page Mode, we might need to scroll the window or the parent 'ContentArea'
      // But for now, let's keep the logic safe for the container itself.
      if (node && container && scroll) {
        const itemTop = node.offsetTop;
        const itemHeight = node.clientHeight;
        const containerHeight = container.clientHeight;
        const scrollTo = itemTop - containerHeight / 2 + itemHeight / 2;
        container.scrollTop = scrollTo;
      } else if (node && !scroll) {
        // In Page Mode, scroll the node into view gently
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [latestFixture, displayFixtures.length, scrollOnLoad, scroll]);

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <HeaderContainer>
        <Typography variant="h6">Match Schedule</Typography>

        {!showLink ? (
          <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedLeague}
              onChange={handleChange}
              displayEmpty
              disableUnderline
              sx={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "text.secondary",
                "& .MuiSelect-select": {
                  paddingRight: "24px !important",
                },
              }}
              renderValue={(selected) => (
                <span>{selected || "All Competitions"}</span>
              )}
            >
              <MenuItem value="">
                <em>All Competitions</em>
              </MenuItem>
              {leagueOptions.map((league) => (
                <MenuItem key={league} value={league}>
                  {league}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Button
            component={Link}
            to={getPath(`/schedule`)}
            size="small"
            endIcon={<ArrowForwardIcon />}
            variant="contained"
          >
            View All
          </Button>
        )}
      </HeaderContainer>

      <ScrollContainer ref={containerRef} scroll={scroll}>
        {displayFixtures.length === 0 ? (
          <Box p={4} textAlign="center" color="text.secondary">
            <Typography variant="body1">No fixtures found.</Typography>
          </Box>
        ) : (
          displayFixtures.map((fixture) => {
            const isLatest = latestFixture?.id === fixture.id;
            const matchTime = new Date(
              fixture.fixture.timestamp * 1000,
            ).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });

            return (
              <Box
                key={fixture.id}
                ref={(node) => {
                  if (node) itemsRef.current.set(fixture.id, node);
                  else itemsRef.current.delete(fixture.id);
                }}
                sx={{
                  position: "relative",
                  marginBottom: "8px",
                  padding: "0 8px", // Prevent edge clipping
                  transition: "all 0.3s ease",
                  // The Highlight Logic
                  ...(isLatest && {
                    "& > div": {
                      // Target the inner FixtureListItem
                      borderColor: (theme) => theme.palette.primary.main,
                      boxShadow: (theme) =>
                        `0 0 15px ${theme.palette.primary.main}40`, // Soft glow
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.8)",
                    },
                  }),
                }}
              >
                {/* Render "Next Match" or "Last Result" label above the highlighted item 
                   for better context 
                */}
                {isLatest && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      marginBottom: "4px",
                      marginLeft: "4px",
                      color: "primary.main",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontSize: "0.7rem",
                    }}
                  >
                    {fixture.fixture.status.short === "NS"
                      ? "Up Next"
                      : "Latest Result"}
                  </Typography>
                )}

                <FixtureListItem
                  fixture={fixture}
                  matchTime={matchTime}
                  handleFixtureClick={handleFixtureClick}
                  // We handle highlight via the wrapper Box sx prop now for better control
                  highlight={false}
                />
              </Box>
            );
          })
        )}
      </ScrollContainer>
    </Paper>
  );
}
