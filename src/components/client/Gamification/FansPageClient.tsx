"use client";

import { useState } from "react";
import { Box, Paper, Stack, Tab, Tabs, Typography, alpha, useTheme } from "@mui/material";
import Leaderboard from "./Leaderboard";
import UserProgressPanel from "./UserProgressPanel";
import type { LeaderboardEntry } from "@/lib/gamification/progressQueries";
import { PREDICTION } from "@/lib/gamification/xpConfig";

/**
 * The fan progress page: your standing, then the boards.
 *
 * Two ladders, kept apart on purpose. Fan XP is earned purely by taking part;
 * prediction points score accuracy and sit on their own board, so a fan who
 * never predicts can still top the one that matters — the app runs on opinion,
 * and opinion has no correct answer to reward.
 *
 * Both boards are scoped to this club. A cross-club board was tried and
 * dropped: the app is one-club-at-a-time and the rivalry that matters is with
 * the people in your own stand, not a global table the biggest fanbases would
 * always own.
 */
export default function FansPageClient({
  clubName,
  clubEntries,
  predictorEntries,
  currentUid,
  rank,
  predictionPoints,
  predictionsResolved,
}: {
  clubName: string;
  clubEntries: LeaderboardEntry[];
  predictorEntries: LeaderboardEntry[];
  currentUid: string | null;
  rank: { rank: number; total: number } | null;
  predictionPoints: number;
  predictionsResolved: number;
}) {
  const theme = useTheme() as any;
  const [tab, setTab] = useState(0);

  return (
    <Stack spacing={3}>
      {/* Your standing. Only for signed-in fans — UserProgressPanel renders
          nothing without a user, so a guest goes straight to the boards. */}
      {currentUid && (
        <Box>
          <Typography
            variant="caption"
            sx={{ display: "block", fontWeight: 900, letterSpacing: 1.5, opacity: 0.6, mb: 1 }}
          >
            YOUR SEASON
          </Typography>
          <UserProgressPanel />

          {/* The second ladder, shown next to the first but never added to
              it. A fan who never predicts sees a zero here and still tops the
              board above, which is the point. */}
          <Paper
            sx={{
              ...theme.clay?.card,
              mt: 1.5,
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 900, letterSpacing: 1.5, opacity: 0.6 }}
              >
                PREDICTION POINTS
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {predictionsResolved > 0
                  ? `From ${predictionsResolved} scored match${predictionsResolved === 1 ? "" : "es"}`
                  : "Scored after full time"}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: "1.4rem", flexShrink: 0 }}>
              {predictionPoints.toLocaleString()}
            </Typography>
          </Paper>

          {rank && (
            <Typography
              variant="body2"
              sx={{ mt: 1.5, textAlign: "center", color: "text.secondary" }}
            >
              You&apos;re{" "}
              <Box component="span" sx={{ fontWeight: 900, color: "text.primary" }}>
                #{rank.rank}
              </Box>{" "}
              of {rank.total} {clubName} fan{rank.total === 1 ? "" : "s"} this season
            </Typography>
          )}
        </Box>
      )}

      <Box>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label={clubName} sx={{ fontWeight: 800 }} />
          <Tab label="Predictors" sx={{ fontWeight: 800 }} />
        </Tabs>

        {tab === 0 && (
          <Leaderboard
            entries={clubEntries}
            currentUid={currentUid}
            title="Most involved fans"
            emptyMessage={`No ${clubName} fan has taken part yet this season. Be the first.`}
          />
        )}


        {tab === 1 && (
          <Stack spacing={2}>
            {/* What earns points, stated up front. Accuracy is the one place
                being right counts, so the rules should be visible rather than
                discovered. */}
            <Paper sx={{ ...theme.clay?.card, p: { xs: 2, md: 2.5 } }}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 900, letterSpacing: 1.5, opacity: 0.6, mb: 1.5 }}
              >
                HOW POINTS ARE SCORED
              </Typography>
              <Stack
                direction="row"
                sx={{ flexWrap: "wrap", gap: 1 }}
              >
                {[
                  ["Correct result", PREDICTION.correctResult],
                  ["Exact scoreline", PREDICTION.exactScore],
                  ["Each XI hit", PREDICTION.xiHit],
                  ["Perfect XI", PREDICTION.perfectXi],
                  ["Player to watch scores or assists", PREDICTION.playerToWatchInvolved],
                ].map(([label, value]) => (
                  <Box
                    key={String(label)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 999,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "text.secondary",
                      border: `1px solid ${theme.palette.divider}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    }}
                  >
                    {label}
                    <Box component="span" sx={{ fontWeight: 900, color: "text.primary" }}>
                      +{value}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>

            <Leaderboard
              entries={predictorEntries}
              currentUid={currentUid}
              metric="predictionPoints"
              title="Sharpest predictors"
              emptyMessage={`No ${clubName} prediction has been scored yet. Points land after full time.`}
            />
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
