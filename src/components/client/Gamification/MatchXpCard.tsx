"use client";

import { useSelector } from "react-redux";
import { Box, Paper, Stack, Typography, alpha, useTheme } from "@mui/material";
import type { RootState } from "@/lib/redux/store";
import { computeMatchXp, type XpLine } from "@/lib/gamification/computeMatchXp";
import {
  computePredictionPoints,
  type PointsLine,
} from "@/lib/gamification/computePredictionPoints";
import { MAX_MATCH_XP } from "@/lib/gamification/xpConfig";
import { isFinished } from "@/lib/utils/football-logic";

/**
 * What this match earned you, and what is still on the table.
 *
 * The unclaimed half is the point. 164 of 168 fans have never earned any XP,
 * and nothing in the app has ever told them what taking part is worth — a card
 * that listed only what you earned would show those fans a zero and nothing
 * else. Every earnable line renders whether or not it has been claimed.
 *
 * Computed client-side from the match doc already in Redux, so it moves as you
 * rate players rather than waiting on the Firestore trigger. The authoritative
 * numbers still come from the server; `npm run test:mirrors` keeps the two in
 * agreement.
 */
export default function MatchXpCard({
  fixture,
  groupData,
}: {
  fixture: any;
  groupData: any;
}) {
  const theme = useTheme() as any;
  const matchId = String(fixture?.fixture?.id ?? "");

  // A fan who did nothing has no document at all — UsersMatchDataListener only
  // dispatches when the snapshot exists. Undefined therefore means "took no
  // part", never "still loading", so the card renders zeros rather than a
  // spinner that would never resolve.
  const matchDoc = useSelector(
    (state: RootState) => (state.userData.matches as any)?.[matchId],
  );

  const { xp, lines } = computeMatchXp(matchDoc);
  const finished = isFinished(fixture);

  const prediction = finished
    ? computePredictionPoints(matchDoc, fixture, groupData?.groupClubId)
    : null;

  return (
    <Paper sx={{ ...theme.clay?.card, p: { xs: 2.5, md: 3 } }}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        sx={{ gap: 1, mb: 1 }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 900, letterSpacing: 1.5, opacity: 0.6 }}
        >
          YOUR MATCHDAY
        </Typography>
        <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", lineHeight: 1 }}>
          {xp}
          <Box component="span" sx={{ fontSize: "0.8rem", opacity: 0.6, ml: 0.5 }}>
            / {MAX_MATCH_XP} XP
          </Box>
        </Typography>
      </Stack>

      <Box
        sx={{
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          mb: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.12),
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${Math.min(100, (xp / MAX_MATCH_XP) * 100)}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(
              theme.palette.primary.light,
              0.9,
            )})`,
            transition: "width .4s ease",
          }}
        />
      </Box>

      <Stack spacing={0.5}>
        {lines.map((line) => (
          <LineRow key={line.key} line={line} unit="XP" />
        ))}
      </Stack>

      {prediction && (
        <Box
          sx={{
            mt: 2.5,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            sx={{ gap: 1, mb: 1.5 }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 900, letterSpacing: 1.5, opacity: 0.6 }}
            >
              PREDICTION POINTS
            </Typography>
            <Typography sx={{ fontWeight: 900, fontSize: "1.15rem" }}>
              {prediction.points}
            </Typography>
          </Stack>

          <Stack spacing={0.5}>
            {prediction.lines.map((line) => (
              <LineRow key={line.key} line={line} unit="pts" />
            ))}
          </Stack>

          {/* Scored overnight, so a fan checking at full time sees zeros that
              are not yet final. Say so rather than let it read as a loss. */}
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 1.5, opacity: 0.55 }}
          >
            Points are confirmed after the nightly update.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

/** One earnable line — dimmed until claimed, so the gap is legible. */
function LineRow({ line, unit }: { line: XpLine | PointsLine; unit: string }) {
  const earned = line.earned > 0;

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ gap: 1, opacity: earned ? 1 : 0.45 }}
    >
      <Box
        sx={(t) => ({
          width: 16,
          flexShrink: 0,
          textAlign: "center",
          fontWeight: 900,
          fontSize: "0.8rem",
          color: earned ? t.palette.form.goodSolid : "text.disabled",
        })}
      >
        {earned ? "✓" : "·"}
      </Box>

      <Typography
        sx={{ flex: 1, minWidth: 0, fontSize: "0.85rem", fontWeight: earned ? 700 : 500 }}
      >
        {line.label}
      </Typography>

      <Typography
        sx={{ flexShrink: 0, fontWeight: 900, fontSize: "0.85rem" }}
      >
        {earned ? `+${line.earned}` : `${line.available}`}
        <Box component="span" sx={{ fontSize: "0.65rem", opacity: 0.6, ml: 0.25 }}>
          {unit}
        </Box>
      </Typography>
    </Stack>
  );
}
