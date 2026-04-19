"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  MenuItem,
  Select,
  FormControl,
  Typography,
  Box,
  Button,
  useTheme,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import {
  selectActiveClubFixtures,
  selectLatestFixture,
} from "@/lib/redux/selectors/fixturesSelectors";
import FixtureListItem from "./FixtureListItem";

interface ScheduleContainerProps {
  limitAroundLatest?: number;
  showLink?: boolean;
  scroll?: boolean;
  scrollOnLoad?: boolean;
  initialFixtures?: any[];
}

export default function ScheduleContainer({
  limitAroundLatest = 0,
  showLink = false,
  scroll = true,
  scrollOnLoad = true,
  initialFixtures = [],
}: ScheduleContainerProps) {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const clubSlug = params?.clubSlug;

  const reduxFixtures = useSelector(selectActiveClubFixtures);
  const latestFixture = useSelector(selectLatestFixture);

  const allFixtures = useMemo(
    () => (reduxFixtures && reduxFixtures.length > 0 ? reduxFixtures : initialFixtures),
    [reduxFixtures, initialFixtures],
  );

  const [selectedLeague, setSelectedLeague] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(new Map<string | number, HTMLDivElement>());

  const displayFixtures = useMemo(() => {
    if (!allFixtures) return [];
    let processed = selectedLeague
      ? allFixtures.filter((f: any) => f.league.name === selectedLeague)
      : [...allFixtures];

    processed.sort((a: any, b: any) => b.fixture.timestamp - a.fixture.timestamp);

    if (limitAroundLatest > 0 && latestFixture) {
      const idx = processed.findIndex((f: any) => f.fixture.id === latestFixture.fixture.id);
      if (idx !== -1) {
        const start = Math.max(0, idx - limitAroundLatest);
        const end = Math.min(processed.length, idx + limitAroundLatest + 1);
        return processed.slice(start, end);
      }
    }
    return processed;
  }, [allFixtures, selectedLeague, latestFixture, limitAroundLatest]);

  const leagueOptions = useMemo(
    () => (!allFixtures ? [] : [...new Set(allFixtures.map((f: any) => f.league.name))]),
    [allFixtures],
  );

  // Group fixtures by "Month YYYY" (newest-first order preserved)
  const groupedFixtures = useMemo(() => {
    const map = new Map<string, any[]>();
    displayFixtures.forEach((f: any) => {
      const key = format(new Date(f.fixture.timestamp * 1000), "MMMM yyyy");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    });
    return Array.from(map.entries()).map(([label, fixtures]) => ({ label, fixtures }));
  }, [displayFixtures]);

  const handleFixtureClick = useCallback(
    (matchId: number | string) => {
      if (clubSlug) {
        router.push(`/${clubSlug}/fixture/${matchId}`);
      }
    },
    [router, clubSlug],
  );

  useEffect(() => {
    if (latestFixture && scrollOnLoad && containerRef.current) {
      const node = itemsRef.current.get(latestFixture.fixture.id);
      const container = containerRef.current;
      if (node && container && scroll) {
        const scrollTo =
          node.offsetTop - container.clientHeight / 2 + node.clientHeight / 2;
        container.scrollTop = scrollTo;
      } else if (node && !scroll) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [latestFixture, displayFixtures.length, scrollOnLoad, scroll]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", opacity: 0.5, letterSpacing: 1 }}>
          FIXTURES & RESULTS
        </Typography>

        {!showLink ? (
          <FormControl variant="standard" size="small">
            <Select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              displayEmpty
              disableUnderline
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "text.secondary",
                "& .MuiSelect-select": { pr: "24px !important" },
              }}
              renderValue={(selected) => (
                <span>{selected || "All Competitions"}</span>
              )}
            >
              <MenuItem value=""><em>All Competitions</em></MenuItem>
              {leagueOptions.map((league: any) => (
                <MenuItem key={league} value={league} sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {league}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Button
            component={Link}
            href={clubSlug ? `/${clubSlug}/schedule` : "/schedule"}
            size="small"
            endIcon={<ArrowForwardRoundedIcon />}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            View All
          </Button>
        )}
      </Box>

      {/* Scrollable fixture list */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowY: scroll ? "auto" : "visible",
          overflowX: "hidden",
          scrollBehavior: "smooth",
          pb: 10,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {displayFixtures.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary" fontWeight={600}>
              No fixtures found.
            </Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {groupedFixtures.map(({ label, fixtures }) => (
              <Box key={label}>
                {/* Sticky month header */}
                <Box
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 5,
                    bgcolor: "background.default",
                    px: 3,
                    py: 1.25,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 900,
                      color: "text.secondary",
                      opacity: 0.45,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>

                {/* Fixtures for this month */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, px: 2, pb: 1 }}>
                  {fixtures.map((fixture: any, i: number) => {
                    const isLatest = latestFixture?.fixture.id === fixture.fixture.id;
                    return (
                      <motion.div
                        key={fixture.fixture.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                        ref={(node: HTMLDivElement | null) => {
                          if (node) itemsRef.current.set(fixture.fixture.id, node);
                          else itemsRef.current.delete(fixture.fixture.id);
                        }}
                      >
                        <FixtureListItem
                          fixture={fixture}
                          handleFixtureClick={handleFixtureClick}
                          highlight={isLatest}
                        />
                      </motion.div>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </AnimatePresence>
        )}
      </Box>
    </Box>
  );
}
