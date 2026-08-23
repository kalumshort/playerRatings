"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Avatar, Box, Paper, Stack, Typography, alpha, useTheme } from "@mui/material";
import { Trophy } from "lucide-react";

import { RootState } from "@/lib/redux/store";
import {
  selectMatchMotmById,
  selectMatchTeamAverage,
  selectMatchTopRated,
  selectMotmPercentages,
  type MatchTeamAverage,
} from "@/lib/redux/selectors/ratingsSelectors";
import { getRatingTextSx } from "@/lib/utils/football-logic";
import ShareFrame from "@/components/ui/ShareFrame";
import ShareFixtureLine, {
  fixtureSubtitle,
} from "@/components/ui/ShareFixtureLine";

interface RatingsShareCardProps {
  fixture: any;
  frameRef: React.Ref<HTMLDivElement>;
  /** Mirrors RatingLineup's `ratingSrc`, so the PNG matches the visible toggle. */
  source: "Group" | "Personal";
  /** Only meaningful when `source === "Personal"`. */
  personalAverage?: MatchTeamAverage | null;
  groupName?: string;
}

/**
 * The post-match ratings image.
 *
 * A dedicated card rather than a capture of the live RatingLineup, because that
 * view is built around a <Select> and two CSS keyframe animations — html2canvas
 * would rasterise the dropdown as a dead form control and freeze the MOTM medal
 * mid-bounce. This renders the same numbers in a shape meant to be a still.
 *
 * Every value comes from selectors that are already populated for the visible
 * view, so mounting this offscreen costs no extra Firestore reads.
 */
export default function RatingsShareCard({
  fixture,
  frameRef,
  source,
  personalAverage,
  groupName,
}: RatingsShareCardProps) {
  const theme = useTheme() as any;
  const mode = theme.palette.mode as "light" | "dark";

  const motm = useSelector((s: RootState) =>
    selectMotmPercentages(s, fixture.id),
  );
  const motmMeta = useSelector((s: RootState) =>
    selectMatchMotmById(s, fixture.id),
  );
  const teamAverage = useSelector((s: RootState) =>
    selectMatchTeamAverage(s, fixture.id),
  );
  const topRated = useSelector((s: RootState) =>
    selectMatchTopRated(s, fixture.id),
  );

  const winner = motm?.[0];
  const runnersUp = motm?.slice(1, 4) ?? [];
  const isPersonal = source === "Personal";
  const headline = isPersonal ? personalAverage : teamAverage;

  return (
    <ShareFrame
      frameRef={frameRef}
      eyebrow="Fan Ratings"
      subtitle={fixtureSubtitle(fixture)}
      footerNote={groupName}
      width={540}
    >
      <Box sx={{ mb: 2.5 }}>
        <ShareFixtureLine fixture={fixture} />
      </Box>

      {winner && (
        <Stack alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ position: "relative", mb: 1.25 }}>
            <Avatar
              src={winner.img}
              alt={winner.name}
              sx={{
                width: 96,
                height: 96,
                backgroundColor: "background.default",
                color: "text.secondary",
              }}
            />
            {/* Static, unlike FanMOTMHighlight's floatPulse medal — an
                animation frozen mid-bounce reads as a rendering bug in a still. */}
            <Box
              sx={{
                position: "absolute",
                bottom: -4,
                right: -4,
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(145deg, ${theme.palette.motm.goldStart} 0%, ${theme.palette.motm.goldEnd} 100%)`,
              }}
            >
              <Trophy size={17} color={theme.palette.motm.bronze} strokeWidth={2.5} />
            </Box>
          </Box>

          <Typography
            variant="overline"
            sx={{ color: "primary.main", letterSpacing: 2.5, lineHeight: 1.4 }}
          >
            Man of the Match
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: -0.4,
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            {winner.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
            {winner.percentage}% of {motmMeta?.motmTotalVotes ?? 0} votes
          </Typography>
        </Stack>
      )}

      <Stack direction="row" spacing={1}>
        <StatTile
          label={isPersonal ? "Your avg" : "Team avg"}
          value={headline ? headline.average.toFixed(1) : "—"}
          valueSx={headline ? getRatingTextSx(headline.average, mode) : undefined}
        />
        <StatTile
          label="Players rated"
          value={headline ? String(headline.rated) : "—"}
        />
        <StatTile
          label="Top rated"
          value={topRated ? topRated.average.toFixed(1) : "—"}
          caption={topRated ? surname(topRated.name) : undefined}
          valueSx={topRated ? getRatingTextSx(topRated.average, mode) : undefined}
        />
      </Stack>

      {runnersUp.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 900, letterSpacing: 1.5, opacity: 0.55 }}
          >
            Also in the running
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap", gap: 1 }}>
            {runnersUp.map((p) => (
              <Paper
                key={p.playerId}
                variant="flat"
                sx={(t: any) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1,
                  py: 0.4,
                  borderRadius: 999,
                  border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
                })}
              >
                <Avatar src={p.img} alt={p.name} sx={{ width: 22, height: 22 }} />
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  {surname(p.name)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 900, color: "text.secondary" }}
                >
                  {p.percentage}%
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </ShareFrame>
  );
}

const surname = (name: string) => name?.split(" ").pop() || name;

const StatTile = ({
  label,
  value,
  caption,
  valueSx,
}: {
  label: string;
  value: string;
  caption?: string;
  valueSx?: object;
}) => (
  <Box
    sx={(t: any) => ({
      ...(t.clay?.box ?? {}),
      flex: 1,
      px: 1,
      py: 1.25,
      textAlign: "center",
      minWidth: 0,
    })}
  >
    <Typography
      variant="caption"
      sx={{
        display: "block",
        fontWeight: 900,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "text.secondary",
        fontSize: 9.5,
      }}
    >
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 900, fontSize: 26, lineHeight: 1.2, ...valueSx }}>
      {value}
    </Typography>
    {caption && (
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 700,
          color: "text.secondary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {caption}
      </Typography>
    )}
  </Box>
);
