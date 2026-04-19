"use client";

import React, { useMemo, useState } from "react";
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
import { selectMatchRatingsById } from "@/lib/redux/selectors/ratingsSelectors";
import RatingLineupPlayer from "@/components/client/PlayerRatings/RatingLineupPlayer";
import FanMOTMHighlight from "./FanMOTMHighlight";

type RatingSource = "Group" | "Personal";

interface RatingLineupProps {
  fixture: any;
  usersMatchPlayerRatings?: Record<string, number>;
  groupClubId: number;
}

const ShellCard = styled(Paper)(({ theme }: any) => ({
  ...theme.clay?.card,
  padding: 0,
  overflow: "hidden",
  borderRadius: 28,
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
}: RatingLineupProps) {
  const theme = useTheme() as any;
  const [ratingSrc, setRatingSrc] = useState<RatingSource>("Group");

  const matchRatings = useSelector((state: RootState) =>
    selectMatchRatingsById(fixture.id)(state),
  );

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
  }, [fixture, groupClubId]);

  const getRating = (playerId: string | number) => {
    const pId = String(playerId);
    if (ratingSrc === "Personal") return usersMatchPlayerRatings?.[pId] ?? null;

    const stats = matchRatings?.find((r: any) => r.id === pId);
    return stats ? stats.totalRating / stats.totalSubmits : null;
  };

  if (formationRows.length === 0) return null;

  return (
    <ShellCard elevation={0}>
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
      </Box>
    </ShellCard>
  );
}
