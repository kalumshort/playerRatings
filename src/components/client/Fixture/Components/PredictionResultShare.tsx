"use client";

import React, { useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { Box, LinearProgress, Stack, Typography, alpha } from "@mui/material";

import { RootState } from "@/lib/redux/store";
import { computePredictionPoints } from "@/lib/gamification/computePredictionPoints";
import {
  MAX_MATCH_PREDICTION_POINTS,
  PREDICTION,
} from "@/lib/gamification/xpConfig";
import { isFinished } from "@/lib/utils/football-logic";
import ShareStage from "@/components/ui/ShareStage";
import ShareFrame from "@/components/ui/ShareFrame";
import ShareActions from "@/components/ui/ShareActions";
import ShareFixtureLine, {
  fixtureSubtitle,
} from "@/components/ui/ShareFixtureLine";

interface PredictionResultShareProps {
  fixture: any;
  groupData: any;
  isGuestView: boolean;
}

/**
 * "Here's how my predictions went" — the post-match scorecard, as an image.
 *
 * Scoring is NOT reimplemented here. `computePredictionPoints` is a byte-mirror
 * of functions/gamification/predictionPoints.js, guarded by `npm run
 * test:mirrors`, so a second copy of the rules in this file would be a third
 * thing to keep in sync and the one the guard doesn't check. Everything the
 * card shows is derived from its return value.
 */
export default function PredictionResultShare({
  fixture,
  groupData,
  isGuestView,
}: PredictionResultShareProps) {
  const shareRef = useRef<HTMLDivElement>(null);

  // Siblings in this folder key userData off String(fixture.id); MatchXpSummary
  // uses String(fixture.fixture.id). For API-Football payloads these are the
  // same number — the fallback keeps this file honest either way.
  const matchId = String(fixture?.id ?? fixture?.fixture?.id ?? "");
  const matchDoc = useSelector(
    (s: RootState) => (s.userData.matches as any)?.[matchId],
  );

  const result = useMemo(
    () => computePredictionPoints(matchDoc, fixture, groupData?.groupClubId),
    [matchDoc, fixture, groupData?.groupClubId],
  );

  const hasAnyPrediction = Boolean(
    matchDoc?.result ||
      matchDoc?.ScorePrediction ||
      matchDoc?.chosenTeam ||
      matchDoc?.preMatchMotm,
  );

  // It is the user's own scorecard, so a guest has none.
  if (isGuestView) return null;
  if (!isFinished(fixture)) return null;
  if (!result.resolved) return null;
  // Without this, every member who ignored the match is offered a shiny
  // "share your 0 points" button.
  if (!hasAnyPrediction) return null;

  const byKey = Object.fromEntries(result.lines.map((l) => [l.key, l]));
  // Lossless: earned === hits * PREDICTION.xiHit exactly. Parsing the label's
  // "(n/11)" would couple this to display text.
  const xiHits = Math.round((byKey.xiHits?.earned ?? 0) / PREDICTION.xiHit);

  const verdict = byKey.perfectXi?.earned
    ? "Perfect XI."
    : byKey.exactScore?.earned
      ? "Exact scoreline."
      : byKey.correctResult?.earned
        ? "Called the result."
        : xiHits > 0
          ? `${xiHits} of 11 starters.`
          : "Better luck next week.";

  return (
    <Box>
      <ShareStage width={540}>
        <ShareFrame
          frameRef={shareRef}
          eyebrow="My Predictions"
          subtitle={fixtureSubtitle(fixture)}
          footerNote={groupData?.name}
          width={540}
        >
          <Box sx={{ mb: 2.5 }}>
            <ShareFixtureLine fixture={fixture} />
          </Box>

          <Stack alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="baseline" spacing={0.75}>
              <Typography
                sx={{ fontWeight: 900, fontSize: 58, lineHeight: 1, color: "primary.main" }}
              >
                {result.points}
              </Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 17, opacity: 0.5 }}>
                / {MAX_MATCH_PREDICTION_POINTS} PTS
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={Math.min(
                100,
                (result.points / MAX_MATCH_PREDICTION_POINTS) * 100,
              )}
              sx={(t: any) => ({
                width: "100%",
                maxWidth: 300,
                mt: 1.5,
                height: 7,
                borderRadius: 999,
                backgroundColor: alpha(t.palette.text.primary, 0.08),
                "& .MuiLinearProgress-bar": {
                  backgroundColor: t.palette.primary.main,
                },
              })}
            />

            <Typography sx={{ mt: 1.25, fontWeight: 900, letterSpacing: 0.3 }}>
              {verdict}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <CallTile
              label="Your call"
              value={matchDoc?.ScorePrediction || "—"}
            />
            <CallTile
              label="Actual"
              value={`${fixture?.goals?.home ?? "—"}-${fixture?.goals?.away ?? "—"}`}
            />
          </Stack>

          <Stack spacing={0.5}>
            {result.lines.map((line) => (
              <ShareLine
                key={line.key}
                label={line.label}
                earned={line.earned}
                available={line.available}
              />
            ))}
          </Stack>
        </ShareFrame>
      </ShareStage>

      <ShareActions
        targetRef={shareRef}
        align="center"
        filename={`11Votes-${slug(fixture?.teams?.home?.name)}-${slug(
          fixture?.teams?.away?.name,
        )}-Predictions.png`}
        shareText={`${verdict} ${result.points}/${MAX_MATCH_PREDICTION_POINTS} prediction points.`}
        sx={{ mt: 0 }}
      />

      <Typography
        data-nosnap="true"
        variant="caption"
        align="center"
        display="block"
        sx={{ mt: 0.75, color: "text.secondary", opacity: 0.7 }}
      >
        Points are confirmed after the nightly update.
      </Typography>
    </Box>
  );
}

const slug = (name?: string) => (name || "Team").replace(/\s+/g, "-");

const CallTile = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={(t: any) => ({
      ...(t.clay?.box ?? {}),
      flex: 1,
      py: 1.25,
      textAlign: "center",
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
    <Typography sx={{ fontWeight: 900, fontSize: 24, lineHeight: 1.2 }}>
      {value}
    </Typography>
  </Box>
);

/**
 * Deliberately not MatchXpSummary's LineRow: that one dims unearned lines to
 * opacity 0.45, which reads as a half-rendered image once it is flattened into
 * a PNG. Here an unearned line is legible and simply unticked.
 */
const ShareLine = ({
  label,
  earned,
  available,
}: {
  label: string;
  earned: number;
  available: number;
}) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <Typography
      sx={(t: any) => ({
        width: 16,
        textAlign: "center",
        fontWeight: 900,
        lineHeight: 1,
        color: earned > 0 ? t.palette.form.goodSolid : t.palette.text.disabled,
      })}
    >
      {earned > 0 ? "✓" : "·"}
    </Typography>

    <Typography
      variant="body2"
      sx={{ flex: 1, fontWeight: earned > 0 ? 800 : 600, minWidth: 0 }}
    >
      {label}
    </Typography>

    <Typography
      variant="caption"
      sx={(t: any) => ({
        fontWeight: 900,
        whiteSpace: "nowrap",
        color: earned > 0 ? t.palette.form.goodSolid : "text.secondary",
      })}
    >
      {earned > 0 ? `+${earned} pts` : `${available}`}
    </Typography>
  </Stack>
);
