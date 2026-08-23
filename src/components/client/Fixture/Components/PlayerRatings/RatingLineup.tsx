"use client";

import React, { useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { RootState } from "@/lib/redux/store";
import {
  selectMatchRatingsById,
  selectMatchTeamAverage,
  selectMotmPercentages,
} from "@/lib/redux/selectors/ratingsSelectors";
import RatingLineupPlayer from "@/components/client/PlayerRatings/RatingLineupPlayer";
import ShareStage from "@/components/ui/ShareStage";
import ShareActions from "@/components/ui/ShareActions";
import FanMOTMHighlight from "./FanMOTMHighlight";
import RatingsShareCard from "./RatingsShareCard";

type RatingSource = "Group" | "Personal";

interface RatingLineupProps {
  fixture: any;
  usersMatchPlayerRatings?: Record<string, number>;
  groupClubId: number;
  groupName?: string;
}

const ShellCard = styled(Paper)(({ theme }: any) => ({
  ...theme.clay?.card,
  padding: 0,
  overflow: "hidden",
  borderRadius: 12,
  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(
    theme.palette.primary.main,
    0.05,
  )} 100%)`,
}));

const SourcePill = styled(Box)(({ theme }: any) => ({
  ...theme.clay?.box,
  position: "absolute",
  top: 16,
  right: 16,
  zIndex: 10,
  padding: theme.spacing(0.25, 1.25),
  borderRadius: 999,
  backgroundColor: theme.palette.background.paper,
}));

const SubsDivider = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  borderTop: `1px dashed ${alpha(theme.palette.divider, 0.8)}`,
}));

const groupByFormation = (starters: any[]) => {
  const rows = starters.reduce<Record<number, any[]>>((acc, { player }) => {
    const row = Number(player.grid?.split(":")[0] ?? 0);
    (acc[row] ||= []).push(player);
    return acc;
  }, {});

  return Object.keys(rows)
    .sort((a, b) => Number(b) - Number(a))
    .map((key) => rows[Number(key)]);
};

export default function RatingLineup({
  fixture,
  usersMatchPlayerRatings,
  groupClubId,
  groupName,
}: RatingLineupProps) {
  const theme = useTheme() as any;
  const [ratingSrc, setRatingSrc] = useState<RatingSource>("Group");
  const shareRef = useRef<HTMLDivElement>(null);

  const matchRatings = useSelector((state: RootState) =>
    selectMatchRatingsById(state, fixture.id),
  );
  const motm = useSelector((state: RootState) =>
    selectMotmPercentages(state, fixture.id),
  );
  const teamAverage = useSelector((state: RootState) =>
    selectMatchTeamAverage(state, fixture.id),
  );

  // The user's own numbers are a plain object on the prop, so this needs no
  // selector — but it does need the same "skip what isn't rated" treatment the
  // group average gets, or an unrated slot would drag the mean down.
  const personalAverage = useMemo(() => {
    const values = Object.values(usersMatchPlayerRatings ?? {})
      .map(Number)
      .filter(Number.isFinite);
    return values.length
      ? {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          rated: values.length,
        }
      : null;
  }, [usersMatchPlayerRatings]);

  // Nothing worth sharing yet: no MOTM winner and no aggregate ratings. The
  // button is absent rather than disabled — a disabled control invites a tap
  // and explains nothing.
  const canShare = Boolean(motm?.[0]) || Boolean(teamAverage);

  const { formationRows, subs } = useMemo(() => {
    const team = fixture?.lineups?.find((t: any) => t.team.id === groupClubId);
    if (!team) return { formationRows: [], subs: [] };

    const playedSubs = (fixture?.events ?? [])
      .filter((e: any) => e.type === "subst" && e.team.id === groupClubId)
      .map((e: any) => e.assist);

    return {
      formationRows: groupByFormation(team.startXI ?? []),
      subs: playedSubs,
    };
    // Narrowed from [fixture] so a live clock tick doesn't rebuild the pitch.
  }, [fixture?.lineups, fixture?.events, groupClubId]);

  const getRating = (playerId: string | number): number | null => {
    const pId = String(playerId);
    if (ratingSrc === "Personal") return usersMatchPlayerRatings?.[pId] ?? null;

    // Keyed lookup, not .find() — this threw outright when the slot held the
    // object shape. The totalSubmits guard avoids NaN/Infinity on a zero-submit row.
    const stats = matchRatings?.[pId];
    return stats?.totalSubmits ? stats.totalRating / stats.totalSubmits : null;
  };

  if (formationRows.length === 0) return null;

  return (
    <ShellCard data-share-flatten>
      <FanMOTMHighlight fixtureId={fixture.id} />

      <Box sx={{ position: "relative", p: 2 }}>
        <SourcePill>
          <Select
            value={ratingSrc}
            onChange={(e) => setRatingSrc(e.target.value as RatingSource)}
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              fontSize: "0.72rem",
              fontWeight: 900,
              color: "primary.main",
              letterSpacing: 0.5,
            }}
          >
            <MenuItem value="Group" sx={{ fontWeight: 700 }}>
              STADIUM AVG
            </MenuItem>
            <MenuItem value="Personal" sx={{ fontWeight: 700 }}>
              MY RATINGS
            </MenuItem>
          </Select>
        </SourcePill>

        <Stack spacing={1} sx={{ py: 4 }}>
          {formationRows.map((rowPlayers, idx) => (
            <Stack
              key={`row-${idx}`}
              direction="row"
              justifyContent="space-around"
              alignItems="center"
            >
              {rowPlayers.map((p: any) => (
                <RatingLineupPlayer
                  key={p.id}
                  player={p}
                  playerRating={getRating(p.id)}
                />
              ))}
            </Stack>
          ))}
        </Stack>

        {subs.length > 0 && (
          <SubsDivider>
            <Typography
              variant="overline"
              align="center"
              display="block"
              sx={{ fontWeight: 900, opacity: 0.55, letterSpacing: 2, mb: 2.5 }}
            >
              Impact Substitutes
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {subs.map((p: any) => (
                <RatingLineupPlayer
                  key={p.id}
                  player={p}
                  playerRating={getRating(p.id)}
                />
              ))}
            </Box>
          </SubsDivider>
        )}

        {canShare && (
          <>
            {/* Offscreen. The card takes `ratingSrc` so the PNG always matches
                the toggle the user is looking at. */}
            <ShareStage width={540}>
              <RatingsShareCard
                fixture={fixture}
                frameRef={shareRef}
                source={ratingSrc}
                personalAverage={personalAverage}
                groupName={groupName}
              />
            </ShareStage>

            <ShareActions
              targetRef={shareRef}
              align="center"
              filename={`11Votes-${slug(fixture?.teams?.home?.name)}-${slug(
                fixture?.teams?.away?.name,
              )}-Ratings.png`}
              shareText={
                motm?.[0]
                  ? `${motm[0].name} is our Man of the Match — ${motm[0].percentage}% of the vote.`
                  : "Our player ratings are in."
              }
            />
          </>
        )}
      </Box>
    </ShellCard>
  );
}

const slug = (name?: string) => (name || "Team").replace(/\s+/g, "-");
