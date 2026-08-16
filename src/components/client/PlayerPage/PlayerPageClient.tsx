"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Grid,
  useTheme,
  Paper,
} from "@mui/material";
import { AnimatePresence } from "framer-motion";

// CUSTOM IMPORTS
import { RootState, AppDispatch } from "@/lib/redux/store";

import {
  fetchPlayerRatingsAllMatches,
  fetchAllPlayersSeasonOverallRating,
} from "@/lib/redux/actions/ratingsActions";

import PlayerMatchRow from "./PlayerMatchRow";
import PlayerPageSkeleton from "./PlayerPageSkeleton";
import PlayerCompareControl from "./PlayerCompareControl";
import PlayerNavigationControl from "./PlayerNavigationControl";
import useGroupData from "@/Hooks/useGroupData";
import { useClubView } from "@/context/ClubViewProvider";
import SeasonSwitcher from "../Widgets/SeasonSwitcher";
import { formatSeason } from "@/lib/config/season";
import { selectPreviousFixtures } from "@/lib/redux/selectors/fixturesSelectors";
import { selectPlayerRatingsById } from "@/lib/redux/selectors/ratingsSelectors";
import { selectSeasonSquadData } from "@/lib/redux/selectors/squadSelectors";
import PlayerRatingsLineGraph from "./PlayerPageRatingsGraph";
import { getRatingColor } from "@/lib/utils/football-logic";

export default function PlayerPageClient({
  playerId,
  season,
}: {
  playerId: string;
  /** Server-resolved season, so the rating fetches below start on the right one. */
  season?: string;
}) {
  const theme = useTheme() as any;
  const dispatch = useDispatch<AppDispatch>();

  const [comparePlayerId, setComparePlayerId] = useState<string | null>(null);

  const compareColor = theme.palette.secondary?.main ?? "#ff9800";

  // 1. DATA SELECTORS
  const squadData = useSelector((state: RootState) =>
    selectSeasonSquadData(state),
  );
  const playerData = squadData?.[playerId];
  const allPlayerRatings = useSelector((state: RootState) =>
    selectPlayerRatingsById(state, playerId),
  );
  const comparePlayerRatings = useSelector((state: RootState) =>
    comparePlayerId ? selectPlayerRatingsById(state, comparePlayerId) : null,
  );
  const comparePlayerData = comparePlayerId
    ? squadData?.[comparePlayerId]
    : null;
  const previousFixtures = useSelector(selectPreviousFixtures);

  const { activeGroup } = useGroupData();
  // Depend on the id, not the group object: the object's identity changes on
  // every group-doc snapshot, which re-fired these fetches for no reason.
  const activeGroupId = activeGroup?.groupId;

  // Prefer the server-resolved season: the context mirror lags a render, which
  // would fire a wasted current-season fetch on archived pages.
  const { season: contextSeason } = useClubView();
  const currentYear = season ?? contextSeason;

  // 2. FETCHING
  useEffect(() => {
    if (playerId && activeGroupId) {
      dispatch(
        fetchPlayerRatingsAllMatches({
          playerId,
          groupId: activeGroupId,
          currentYear,
        }),
      );
      dispatch(
        fetchAllPlayersSeasonOverallRating({
          groupId: activeGroupId,
          currentYear,
        }),
      );
    }
  }, [dispatch, playerId, activeGroupId, currentYear]);

  useEffect(() => {
    setComparePlayerId(null);
  }, [playerId]);

  useEffect(() => {
    if (comparePlayerId && activeGroupId) {
      dispatch(
        fetchPlayerRatingsAllMatches({
          playerId: comparePlayerId,
          groupId: activeGroupId,
          currentYear,
        }),
      );
    }
  }, [dispatch, comparePlayerId, activeGroupId, currentYear]);

  // 3. CALCS
  const seasonAverage = useMemo(() => {
    const overall = allPlayerRatings?.seasonOverall;
    if (!overall || !overall.totalSubmits) return 0;
    return overall.totalRating / overall.totalSubmits;
  }, [allPlayerRatings]);

  const compareSeasonAverage = useMemo(() => {
    const overall = comparePlayerRatings?.seasonOverall;
    if (!overall || !overall.totalSubmits) return 0;
    return overall.totalRating / overall.totalSubmits;
  }, [comparePlayerRatings]);

  // squadData is null only while the season's squad is still loading. Once it
  // resolves, a missing player means they aren't in that season's squad — show
  // the switcher rather than an endless skeleton with no way back.
  if (!squadData) return <PlayerPageSkeleton />;

  if (!playerData) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", px: 2, pt: 8, textAlign: "center" }}>
        <Paper sx={{ p: 4, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Not in this season&apos;s squad
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This player has no {formatSeason(currentYear)} record for this club.
            Pick another season to see their ratings.
          </Typography>
          <Stack direction="row" justifyContent="center">
            <SeasonSwitcher season={currentYear} />
          </Stack>
        </Paper>
      </Box>
    );
  }

  const ratingColor = getRatingColor(seasonAverage);
  const comparePlayerInfo = comparePlayerData
    ? {
        id: String(comparePlayerData.id),
        name: comparePlayerData.name,
        photo: comparePlayerData.photo,
      }
    : null;

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        pb: 10,
        px: { xs: 2, md: 4 },
        pt: 5,
      }}
    >
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* PROFILE SIDEBAR */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Box
            sx={{
              position: { md: "sticky" },
              top: { md: 100, lg: 120 },
            }}
          >
            <Paper

              sx={{
                p: { xs: 2.5, md: 3 },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <Avatar
                src={playerData.photo}
                alt={playerData.name}
                sx={{
                  width: { xs: 96, md: 112 },
                  height: { xs: 96, md: 112 },
                  mx: "auto",
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                component="h1"
                fontWeight={700}
                sx={{ mb: 0.5, lineHeight: 1.2 }}
              >
                {playerData.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                {playerData.position} · #{playerData.number}
              </Typography>

              <Box
                sx={{
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      color: "text.secondary",
                      letterSpacing: 1,
                      fontWeight: 700,
                    }}
                  >
                    Season rating
                  </Typography>
                  <SeasonSwitcher season={currentYear} />
                </Stack>

                {comparePlayerInfo ? (
                  <Stack
                    direction="row"
                    spacing={1.5}
                    justifyContent="center"
                    alignItems="flex-end"
                  >
                    <SeasonRatingValue
                      value={seasonAverage}
                      accent={theme.palette.primary.main}
                      useRatingColor
                    />
                    <SeasonRatingValue
                      value={compareSeasonAverage}
                      accent={compareColor}
                      label={comparePlayerInfo.name}
                      smaller
                    />
                  </Stack>
                ) : (
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: seasonAverage > 0 ? ratingColor : "text.disabled",
                      lineHeight: 1,
                    }}
                  >
                    {seasonAverage > 0 ? seasonAverage.toFixed(1) : "-.-"}
                  </Typography>
                )}
              </Box>
            </Paper>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 2.5 }}
            >
              <PlayerNavigationControl
                squadData={squadData}
                currentPlayerId={playerId}
                season={currentYear}
              />
              <PlayerCompareControl
                squadData={squadData}
                excludePlayerId={playerId}
                comparePlayer={comparePlayerInfo}
                compareColor={compareColor}
                onSelect={(p) => setComparePlayerId(String(p.id))}
                onClear={() => setComparePlayerId(null)}
              />
            </Stack>
          </Box>
        </Grid>

        {/* STATS STREAM */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Stack spacing={3}>
            <Box>
              <Paper

                sx={{
                  p: 2,
                  height: 320,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <PlayerRatingsLineGraph
                  allPlayerRatings={allPlayerRatings}
                  clubId={activeGroup?.groupClubId}
                  comparePlayerRatings={comparePlayerRatings}
                  comparePlayer={comparePlayerInfo}
                  playerName={playerData.name}
                />
              </Paper>
            </Box>

            <Box>
              <SectionHeader title="Match history" />
              <Stack spacing={1}>
                <AnimatePresence>
                  {previousFixtures.map((fixture, index) => {
                    const matchRating = allPlayerRatings?.matches?.[fixture.id];
                    const compareMatchRating = comparePlayerInfo
                      ? comparePlayerRatings?.matches?.[fixture.id]
                      : null;

                    if (!matchRating && !compareMatchRating) return null;

                    return (
                      <PlayerMatchRow
                        key={fixture.id}
                        fixture={fixture}
                        ratingData={matchRating}
                        index={index}
                        playerId={playerId}
                        player={playerData}
                        clubId={activeGroup?.groupClubId}
                        compareRatingData={compareMatchRating}
                        comparePlayer={comparePlayerInfo}
                        compareColor={compareColor}
                        season={currentYear}
                      />
                    );
                  })}
                </AnimatePresence>
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: "block",
        mb: 1.5,
        pl: 0.5,
        color: "text.secondary",
        letterSpacing: 1,
        fontWeight: 700,
      }}
    >
      {title}
    </Typography>
  );
}

function SeasonRatingValue({
  value,
  accent,
  useRatingColor,
  smaller,
  label,
}: {
  value: number;
  accent: string;
  useRatingColor?: boolean;
  smaller?: boolean;
  label?: string;
}) {
  const color =
    value <= 0
      ? "text.disabled"
      : useRatingColor
        ? getRatingColor(value)
        : accent;

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: accent,
          mx: "auto",
          mb: 0.5,
        }}
      />
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: smaller ? "2rem" : "3rem",
          color,
          lineHeight: 1,
        }}
      >
        {value > 0 ? value.toFixed(1) : "-.-"}
      </Typography>
      {label && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            fontSize: "0.6rem",
            fontWeight: 700,
            color: "text.secondary",
            letterSpacing: 0.5,
            maxWidth: 80,
            mx: "auto",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}
