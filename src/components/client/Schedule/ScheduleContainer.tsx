"use client";

import React, {
  useEffect, // Changed from useLayoutEffect to avoid SSR warnings
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation"; // Import from next/navigation
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

// Selectors & Components
import {
  selectActiveClubFixtures,
  selectLatestFixture,
} from "@/lib/redux/selectors/fixturesSelectors";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FixtureListItem from "./FixtureListItem";

// --- STYLED COMPONENTS ---

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 24px",
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: "blur(12px)",
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: 10,
  position: "sticky",
  top: 0,
}));

const ScrollContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "scroll",
})<{ scroll?: boolean }>(({ scroll }) => ({
  height: scroll ? "70vh" : "auto",
  maxHeight: scroll ? "70vh" : "none",
  overflowY: scroll ? "auto" : "visible",
  overflowX: "hidden",
  scrollBehavior: "smooth",
  paddingBottom: "80px",
  position: "relative",
  width: "100%",
  "&::-webkit-scrollbar": { display: "none" },
  scrollbarWidth: "none",
}));

interface ScheduleContainerProps {
  limitAroundLatest?: number;
  showLink?: boolean;
  scroll?: boolean;
  scrollOnLoad?: boolean;
  initialFixtures?: any[]; // The "gift" from the Server Component
}

export default function ScheduleContainer({
  limitAroundLatest = 0,
  showLink = false,
  scroll = true,
  scrollOnLoad = true,
  initialFixtures = [], // Default to empty array
}: ScheduleContainerProps) {
  const theme = useTheme();
  const router = useRouter();

  const params = useParams();
  const clubSlug = params?.clubSlug;

  // 1. SELECT FROM STORE
  const reduxFixtures = useSelector(selectActiveClubFixtures);

  // 2. HYBRID DATA LOGIC
  // If Redux has fixtures, use them (Live data).
  // Otherwise, use initialFixtures (Instant server data).
  const allFixtures = useMemo(() => {
    return reduxFixtures && reduxFixtures.length > 0
      ? reduxFixtures
      : initialFixtures;
  }, [reduxFixtures, initialFixtures]);

  const latestFixture = useSelector(selectLatestFixture);
  const [selectedLeague, setSelectedLeague] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<string | number, HTMLDivElement>());

  // --- DATA PROCESSING ---
  const displayFixtures = useMemo(() => {
    if (!allFixtures) return [];

    let processed = selectedLeague
      ? allFixtures.filter((item: any) => item.league.name === selectedLeague)
      : [...allFixtures];

    processed.sort(
      (a: any, b: any) => b.fixture.timestamp - a.fixture.timestamp,
    );

    if (limitAroundLatest > 0 && latestFixture) {
      const targetIndex = processed.findIndex(
        (f: any) => f.fixture.id === latestFixture.fixture.id,
      );
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
    return [...new Set(allFixtures.map((item: any) => item.league.name))];
  }, [allFixtures]);

  const handleFixtureClick = useCallback(
    (matchId: number | string) => {
      router.push(`${clubSlug}/fixture/${matchId}`);
    },
    [router],
  );

  // --- SCROLL LOGIC ---
  useEffect(() => {
    if (latestFixture && scrollOnLoad && containerRef.current) {
      const node = itemsRef.current.get(latestFixture.fixture.id);
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
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 0,
        overflow: "hidden",
        bgcolor: "background.paper",
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        flexGrow: 1, // Ensure it fills vertical space in the Next.js layout
      }}
    >
      <HeaderContainer>
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarMonthRoundedIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Schedule
          </Typography>
        </Box>

        {!showLink ? (
          <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              displayEmpty
              disableUnderline
              sx={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "text.secondary",
                "& .MuiSelect-select": {
                  textAlign: "right",
                  pr: "24px !important",
                },
              }}
              renderValue={(selected) => (
                <span>{selected || "All Competitions"}</span>
              )}
            >
              <MenuItem value="">
                <em>All Competitions</em>
              </MenuItem>
              {leagueOptions.map((league: any) => (
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
            // If clubSlug exists, prepend it. If not, fallback to /schedule
            href={clubSlug ? `/${clubSlug}/schedule` : "/schedule"}
            size="small"
            endIcon={<ArrowForwardRoundedIcon />}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            View All
          </Button>
        )}
      </HeaderContainer>

      <ScrollContainer ref={containerRef} scroll={scroll}>
        {displayFixtures.length === 0 ? (
          <Box p={6} textAlign="center">
            <Typography variant="body1" color="text.secondary" fontWeight={600}>
              No fixtures found.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {displayFixtures.map((fixture: any, index: number) => {
              const isLatest = latestFixture?.fixture.id === fixture.fixture.id;

              return (
                <Fade
                  in
                  key={fixture.fixture.id}
                  timeout={300 + Math.min(index, 5) * 50}
                >
                  <Box
                    ref={(node: HTMLDivElement | null) => {
                      if (node) {
                        itemsRef.current.set(fixture.fixture.id, node);
                      } else {
                        itemsRef.current.delete(fixture.fixture.id);
                      }
                    }}
                    sx={{
                      position: "relative",
                      px: 2,
                      py: 0.5,
                      transition: "all 0.3s ease",
                      ...(isLatest && {
                        zIndex: 2,
                        "& > div": {
                          transform: "scale(1.01)",
                          borderColor: "primary.main",
                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                      }),
                    }}
                  >
                    <FixtureListItem
                      fixture={fixture}
                      handleFixtureClick={handleFixtureClick}
                      highlight={isLatest}
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
