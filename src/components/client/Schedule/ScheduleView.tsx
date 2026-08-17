"use client";

import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

import { Fixture } from "@/types/football";
import { useClubView } from "@/context/ClubViewProvider";
import { withSeasonParam } from "@/lib/config/season";
import { selectUserMatchStatuses } from "@/lib/redux/selectors/userSelectors";
import PageSkeleton from "@/components/ui/PageSkeleton";

import FixtureRow from "./FixtureRow";
import NextMatchCard from "./NextMatchCard";
import ScheduleToolbar from "./ScheduleToolbar";
import { getMatchId } from "./fixtureDisplay";
import useScheduleFixtures, {
  ScheduleTab,
  VenueFilter,
} from "./useScheduleFixtures";

// Seeds the sticky month-header offset before the toolbar has been measured, so
// the first paint is already close instead of starting at zero. The header
// spacer it sits under is 64px (xs) / 80px (md) — see Header/index.tsx.
const TOOLBAR_HEIGHT_ESTIMATE = 112;

interface ScheduleViewProps {
  initialFixtures?: Fixture[];
  /** Server-resolved season. Falls back to context where no page supplies it. */
  season?: string;
  /**
   * The club whose perspective W/D/L and home/away are computed from. Passed
   * down rather than read from Redux in each row, so rows render correctly
   * during SSR where the store is still empty.
   */
  clubId?: string | number;
}

export default function ScheduleView({
  initialFixtures,
  season: seasonProp,
  clubId,
}: ScheduleViewProps) {
  const router = useRouter();
  const params = useParams();
  const clubSlug = params?.clubSlug;
  const { season: contextSeason } = useClubView();
  const season = seasonProp ?? contextSeason;

  // null = "not chosen yet"; the hook opens on Upcoming, or Results once the
  // season is done. Picking the right tab is what replaced the old effect that
  // silently scrolled the list to its middle on mount.
  const [tab, setTab] = useState<ScheduleTab | null>(null);
  const [competition, setCompetition] = useState("");
  const [venue, setVenue] = useState<VenueFilter>("all");
  const [toolbarHeight, setToolbarHeight] = useState(TOOLBAR_HEIGHT_ESTIMATE);

  const {
    activeTab,
    clubId: resolvedClubId,
    loaded,
    competitions,
    fixtures,
    groups,
    nextFixture,
    todayDividerId,
    counts,
  } = useScheduleFixtures({
    initialFixtures,
    clubId,
    tab,
    competition,
    venue,
    excludeNextFromList: true,
  });

  // Empty for guests, so no badge renders and the SSR output is unchanged.
  const matchStatuses = useSelector(selectUserMatchStatuses);

  const handleSelect = useCallback(
    (matchId: string) => {
      if (clubSlug) {
        // Preserve the archive season, or the fixture page 404s against 2026
        router.push(withSeasonParam(`/${clubSlug}/fixture/${matchId}`, season));
      }
    },
    [router, clubSlug, season],
  );

  if (!loaded) return <PageSkeleton rows={4} hero={false} />;

  const showHero = activeTab === "upcoming" && nextFixture;

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <ScheduleToolbar
        tab={activeTab}
        onTabChange={setTab}
        competition={competition}
        competitions={competitions}
        onCompetitionChange={setCompetition}
        venue={venue}
        onVenueChange={setVenue}
        counts={counts}
        shown={fixtures.length}
        onHeightChange={setToolbarHeight}
      />

      {showHero && (
        <NextMatchCard
          fixture={nextFixture}
          clubId={resolvedClubId}
          onSelect={handleSelect}
        />
      )}

      {fixtures.length === 0 ? (
        <EmptyState tab={activeTab} filtered={!!competition || venue !== "all"} />
      ) : (
        groups.map(({ label, fixtures: monthFixtures }) => (
          <Box key={label}>
            <Box
              sx={{
                // Parks directly under the sticky toolbar. The toolbar's height
                // is measured, not assumed, because its filter row wraps on
                // narrow screens.
                position: "sticky",
                top: {
                  xs: 64 + toolbarHeight,
                  md: 80 + toolbarHeight,
                },
                zIndex: 5,
                bgcolor: "background.default",
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

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pb: 1,
              }}
            >
              {monthFixtures.map((fixture, i) => {
                const matchId = getMatchId(fixture);
                return (
                  <React.Fragment key={matchId}>
                    {todayDividerId === matchId && <TodayDivider />}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      // Capped, or a 50-fixture season animates for two seconds.
                      transition={{
                        delay: Math.min(i, 8) * 0.04,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                    >
                      <FixtureRow
                        fixture={fixture}
                        clubId={resolvedClubId}
                        onSelect={handleSelect}
                        status={matchStatuses[matchId]}
                      />
                    </motion.div>
                  </React.Fragment>
                );
              })}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

/** Marks where the season stops looking forward and starts looking back. */
function TodayDivider() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        my: 1,
        "&::before, &::after": {
          content: '""',
          flex: 1,
          height: "1px",
          bgcolor: "divider",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 900,
          letterSpacing: 1.5,
          color: "text.secondary",
          opacity: 0.5,
        }}
      >
        TODAY
      </Typography>
    </Box>
  );
}

function EmptyState({
  tab,
  filtered,
}: {
  tab: ScheduleTab;
  filtered: boolean;
}) {
  const message = filtered
    ? "No matches match these filters."
    : tab === "upcoming"
      ? "No upcoming fixtures — the season's schedule is complete."
      : tab === "results"
        ? "No results yet. Check back after the first match."
        : "No fixtures found for this season.";

  return (
    <Box sx={(t) => ({ ...t.clay.card, p: 6, textAlign: "center" })}>
      <Typography variant="body1" color="text.secondary" fontWeight={600}>
        {message}
      </Typography>
      {filtered && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ opacity: 0.6, display: "block", mt: 1 }}
        >
          Try clearing the competition or home/away filter.
        </Typography>
      )}
    </Box>
  );
}
