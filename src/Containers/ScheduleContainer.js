import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  MenuItem,
  Select,
  FormControl,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  selectFixturesState,
  selectLatestFixture,
} from "../Selectors/fixturesSelectors";
import FixtureListItem from "../Components/Fixtures/FixtureListItem";

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 8px",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  marginBottom: "8px",
}));

const ScrollContainer = styled("div")(({ scroll }) => ({
  maxHeight: "70vh",
  overflowY: scroll ? "auto" : "hidden",
  scrollBehavior: "smooth",
  paddingBottom: "20px",
  position: "relative", // <--- IMPORTANT: Needed for offsetTop calculation to work
  "&::-webkit-scrollbar": {
    display: "none",
  },
  "-ms-overflow-style": "none",
  "scrollbar-width": "none",
}));

const StyledLink = styled(Link)({
  fontSize: "0.875rem",
  textDecoration: "none",
  fontWeight: 600,
  color: "inherit",
});

export default function ScheduleContainer({
  limitAroundLatest = 0,
  showLink,
  scroll = true,
  scrollOnLoad = true,
}) {
  const navigate = useNavigate();

  const { fixtures: allFixtures } = useSelector(selectFixturesState);
  const latestFixture = useSelector(selectLatestFixture);

  const [selectedLeague, setSelectedLeague] = useState("");

  const containerRef = useRef(null);
  const itemsRef = useRef(new Map());

  const displayFixtures = useMemo(() => {
    if (!allFixtures) return [];

    let processed = selectedLeague
      ? allFixtures.filter((item) => item.league.name === selectedLeague)
      : [...allFixtures];

    processed.reverse();

    if (limitAroundLatest > 0 && latestFixture) {
      const targetIndex = processed.findIndex((f) => f.id === latestFixture.id);
      if (targetIndex !== -1) {
        const start = Math.max(0, targetIndex - limitAroundLatest);
        const end = Math.min(
          processed.length,
          targetIndex + limitAroundLatest + 1
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
      navigate(`/fixture/${matchId}`);
    },
    [navigate]
  );

  // --- UPDATED SCROLL LOGIC ---
  useLayoutEffect(() => {
    if (latestFixture && scrollOnLoad && containerRef.current) {
      const node = itemsRef.current.get(latestFixture.id);
      const container = containerRef.current;

      if (node && container) {
        // We calculate where the item is inside the container
        // offsetTop gives the distance from the top of the container (because container is relative)
        const itemTop = node.offsetTop;
        const itemHeight = node.clientHeight;
        const containerHeight = container.clientHeight;

        // Calculate the scroll position to center the item
        // Position - (Half Container) + (Half Item)
        const scrollTo = itemTop - containerHeight / 2 + itemHeight / 2;

        // Set the scroll position manually.
        // This ONLY affects the container, never the window.
        container.scrollTop = scrollTo;
      }
    }
  }, [latestFixture, displayFixtures, scrollOnLoad]);

  return (
    <Paper elevation={0} sx={{ bgcolor: "background.paper" }}>
      <HeaderContainer>
        <Typography variant="h6" fontWeight="bold" className="globalHeading">
          Match Schedule
        </Typography>

        {!showLink ? (
          <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedLeague}
              onChange={handleChange}
              displayEmpty
              disableUnderline
              renderValue={(selected) => (
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {selected || "All Competitions"}
                </span>
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
          <StyledLink to="/schedule">View All</StyledLink>
        )}
      </HeaderContainer>

      <ScrollContainer ref={containerRef} scroll={scroll}>
        {displayFixtures.length === 0 ? (
          <Box p={3} textAlign="center" color="text.secondary">
            <Typography variant="body2">No fixtures found.</Typography>
          </Box>
        ) : (
          displayFixtures.map((fixture) => {
            const isLatest = latestFixture?.id === fixture.id;
            const matchTime = new Date(
              fixture.fixture.timestamp * 1000
            ).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });

            return (
              <div
                key={fixture.id}
                ref={(node) => {
                  if (node) {
                    itemsRef.current.set(fixture.id, node);
                  } else {
                    itemsRef.current.delete(fixture.id);
                  }
                }}
                style={{
                  opacity: isLatest ? 1 : 0.8,
                  // Scale effect removed? Sometimes safer to remove
                  // scale during scroll calculations, but usually fine.
                  transform: isLatest ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.2s ease",
                  marginBottom: "8px",
                }}
              >
                <FixtureListItem
                  fixture={fixture}
                  matchTime={matchTime}
                  handleFixtureClick={handleFixtureClick}
                  highlight={isLatest}
                />
              </div>
            );
          })
        )}
      </ScrollContainer>
    </Paper>
  );
}
