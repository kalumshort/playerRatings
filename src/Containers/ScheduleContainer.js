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
  useTheme,
  alpha,
  Fade,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  selectActiveClubFixtures,
  selectLatestFixture,
} from "../Selectors/fixturesSelectors";
import FixtureListItem from "../Components/Fixtures/FixtureListItem";
import { useAppNavigate } from "../Hooks/useAppNavigate";
import { useAppPaths } from "../Hooks/Helper_Functions";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

// --- STYLED COMPONENTS ---

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 24px",
  // Glass Header
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: "blur(12px)",
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: 10,
  position: "sticky",
  top: 0,
}));

const ScrollContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "scroll",
})(({ scroll }) => ({
  height: scroll ? "70vh" : "auto",
  maxHeight: scroll ? "70vh" : "none",
  overflowY: scroll ? "auto" : "visible",
  overflowX: "hidden",
  scrollBehavior: "smooth",
  paddingBottom: "80px",
  position: "relative",
  width: "100%",

  // Hide Scrollbar but keep functionality
  "&::-webkit-scrollbar": { display: "none" },
  "-ms-overflow-style": "none",
  scrollbarWidth: "none",
}));

export default function ScheduleContainer({
  limitAroundLatest = 0,
  showLink,
  scroll = true,
  scrollOnLoad = true,
}) {
  const theme = useTheme();
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

    // Sort: Newest First (Descending Timestamp)
    processed.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

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

  // --- SCROLL LOGIC ---
  useLayoutEffect(() => {
    if (latestFixture && scrollOnLoad && containerRef.current) {
      const node = itemsRef.current.get(latestFixture.id);
      const container = containerRef.current;

      if (node && container && scroll) {
        // Center the latest match
        const itemTop = node.offsetTop;
        const itemHeight = node.clientHeight;
        const containerHeight = container.clientHeight;
        const scrollTo = itemTop - containerHeight / 2 + itemHeight / 2;
        container.scrollTop = scrollTo;
      } else if (node && !scroll) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [latestFixture, displayFixtures.length, scrollOnLoad, scroll]);

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        p: 0,
        overflow: "hidden",
        // Apply Global Clay Style Wrapper if desired, or keep it clean
      })}
    >
      <HeaderContainer>
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarMonthRoundedIcon color="primary" />
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px">
            Schedule
          </Typography>
        </Box>

        {!showLink ? (
          <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedLeague}
              onChange={handleChange}
              displayEmpty
              disableUnderline
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "text.secondary",
                "& .MuiSelect-select": {
                  paddingRight: "24px !important",
                  textAlign: "right",
                },
                "& :hover": { color: "primary.main" },
              }}
              renderValue={(selected) => (
                <span>{selected || "All Competitions"}</span>
              )}
            >
              <MenuItem value="" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                <em>All Competitions</em>
              </MenuItem>
              {leagueOptions.map((league) => (
                <MenuItem
                  key={league}
                  value={league}
                  sx={{ fontWeight: 600, fontSize: "0.85rem" }}
                >
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
            endIcon={<ArrowForwardRoundedIcon />}
            variant="contained"
          >
            View All
          </Button>
        )}
      </HeaderContainer>

      <ScrollContainer ref={containerRef} scroll={scroll}>
        {displayFixtures.length === 0 ? (
          <Box p={6} textAlign="center" color="text.secondary">
            <Typography variant="body1" fontWeight={600}>
              No fixtures found.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {" "}
            {/* Top padding for first item */}
            {displayFixtures.map((fixture, index) => {
              const isLatest = latestFixture?.id === fixture.id;

              return (
                <Fade
                  in
                  key={fixture.id}
                  timeout={300 + Math.min(index, 5) * 50}
                >
                  <Box
                    ref={(node) => {
                      if (node) itemsRef.current.set(fixture.id, node);
                      else itemsRef.current.delete(fixture.id);
                    }}
                    sx={{
                      position: "relative",
                      px: 2,
                      py: 0.5, // Gap between list items
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

                      // --- HIGHLIGHT THE CURRENT MATCH ---
                      ...(isLatest && {
                        "& > div": {
                          // Target the FixtureListItem
                          transform: "scale(1.02)", // Pop out
                          zIndex: 2,
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                          // Optional: Subtle glow background
                          background: `linear-gradient(135deg, ${theme.palette.background.paper} 60%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                        },
                      }),
                    }}
                  >
                    <FixtureListItem
                      fixture={fixture}
                      handleFixtureClick={handleFixtureClick}
                      highlight={isLatest} // Pass prop down if component needs it for logic
                    />
                  </Box>
                </Fade>
              );
            })}
          </Box>
        )}
      </ScrollContainer>
    </Paper>
  );
}
