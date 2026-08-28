"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { useClubView } from "@/context/ClubViewProvider";
import { withSeasonParam } from "@/lib/config/season";
import { selectUserMatchStatuses } from "@/lib/redux/selectors/userSelectors";

import FixtureRow from "./FixtureRow";
import { getMatchId } from "./fixtureDisplay";
import useScheduleFixtures from "./useScheduleFixtures";

interface UpcomingFixturesCardProps {
  /** How many fixtures to preview. */
  count?: number;
}

/**
 * The club-home preview of the schedule.
 *
 * This used to be ScheduleContainer driven by four extra props
 * (limitAroundLatest / showLink / scroll / scrollOnLoad) that existed purely to
 * turn the full-page component into a preview. Separating them means neither
 * has to carry the other's behaviour.
 */
export default function UpcomingFixturesCard({
  count = 3,
}: UpcomingFixturesCardProps) {
  const router = useRouter();
  const params = useParams();
  const clubSlug = params?.clubSlug;
  const { season } = useClubView();

  const { activeTab, clubId, loaded, fixtures } = useScheduleFixtures({
    tab: null,
    competition: "",
    venue: "all",
  });

  const matchStatuses = useSelector(selectUserMatchStatuses);

  const handleSelect = useCallback(
    (matchId: string) => {
      if (clubSlug) {
        router.push(withSeasonParam(`/${clubSlug}/fixture/${matchId}`, season));
      }
    },
    [router, clubSlug, season],
  );

  const preview = fixtures.slice(0, count);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: "text.secondary",
            opacity: 0.5,
            letterSpacing: 1,
          }}
        >
          {activeTab === "upcoming" ? "NEXT UP" : "RECENT RESULTS"}
        </Typography>

        <Button
          component={Link}
          href={withSeasonParam(
            clubSlug ? `/${clubSlug}/schedule` : "/schedule",
            season,
          )}
          size="small"
          endIcon={<ArrowForwardRoundedIcon />}
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          View All
        </Button>
      </Box>

      {!loaded ? (
        <Stack spacing={1.5}>
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={112}
              sx={{ borderRadius: "12px" }}
            />
          ))}
        </Stack>
      ) : preview.length === 0 ? (
        <Box sx={(t) => ({ ...t.clay.card, p: 4, textAlign: "center" })}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            No fixtures for this season yet.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {preview.map((fixture) => {
            const matchId = getMatchId(fixture);
            return (
              <FixtureRow
                key={matchId}
                fixture={fixture}
                clubId={clubId}
                onSelect={handleSelect}
                status={matchStatuses[matchId]}
              />
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
