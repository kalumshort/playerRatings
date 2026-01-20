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

// --- STYLED COMPONENTS ---

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 20px",
  // Clay Header Style
  backgroundColor:
    theme.palette.mode === "light"
      ? "rgba(255,255,255,0.6)"
      : "rgba(255,255,255,0.02)",
  backdropFilter: "blur(10px)",
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: 10,
}));

const ScrollContainer = styled("div")(({ scroll }) => ({
  height: scroll ? "70vh" : "auto",
  maxHeight: scroll ? "70vh" : "none",
  overflowY: scroll ? "auto" : "visible",
  overflowX: "hidden",
  scrollBehavior: "smooth",
  paddingBottom: "80px",
  position: "relative",
  width: "100%",
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

    // Sort: Newest First
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
      })}
    >
      <HeaderContainer>
        <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px">
          Schedule
        </Typography>

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
                "&:hover": {
                  color: "primary.main",
                },
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
            sx={(theme) => ({
              ...theme.clay.button,
              fontSize: "0.75rem",
              py: 0.5,
              height: 32,
              minWidth: "auto",
              px: 2,
            })}
          >
            View All
          </Button>
        )}
      </HeaderContainer>

      <ScrollContainer ref={containerRef} scroll={scroll}>
        {displayFixtures.length === 0 ? (
          <Box p={4} textAlign="center" color="text.secondary">
            <Typography variant="body2" fontWeight={600}>
              No fixtures found.
            </Typography>
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
                  px: 2,
                  py: "2px", // Vertical spacing between items
                  transition: "all 0.3s ease",

                  // HIGHLIGHT LOGIC
                  ...(isLatest && {
                    // Wrapper styles for the highlighted item
                    "& > div": {
                      // Using 'boxShadow' on the child (FixtureListItem)
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}, 0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                      transform: "scale(1.02)",
                      zIndex: 2,
                      position: "relative",
                    },
                  }),
                }}
              >
                <FixtureListItem
                  fixture={fixture}
                  matchTime={matchTime}
                  handleFixtureClick={handleFixtureClick}
                  // We handle highlight visually above, so pass false or custom prop
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
