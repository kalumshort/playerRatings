"use client";

import { useState } from "react";
import { Box, Paper, Stack, Tab, Tabs, Typography, alpha, useTheme } from "@mui/material";
import Leaderboard from "./Leaderboard";
import UserProgressPanel from "./UserProgressPanel";
import type { LeaderboardEntry } from "@/lib/gamification/progressQueries";

/**
 * The fan progress page: your standing, then the boards.
 *
 * Two ladders, kept apart on purpose. Fan XP is earned purely by taking part
 * and is what the club and global boards rank. Prediction points score
 * accuracy and sit on their own board, so a fan who never predicts can still
 * top the one that matters — the app runs on opinion, and opinion has no
 * correct answer to reward.
 */
export default function FansPageClient({
  clubName,
  clubEntries,
  globalEntries,
  currentUid,
  rank,
}: {
  clubName: string;
  clubEntries: LeaderboardEntry[];
  globalEntries: LeaderboardEntry[];
  currentUid: string | null;
  rank: { rank: number; total: number } | null;
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
          <Tab label="All clubs" sx={{ fontWeight: 800 }} />
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
          <Leaderboard
            entries={globalEntries}
            currentUid={currentUid}
            title="Most involved fans, every club"
            emptyMessage="Nobody has taken part yet this season."
          />
        )}

        {tab === 2 && (
          // Honest placeholder rather than an empty board: prediction points
          // are not scored yet, and a board of zeroes would imply they were.
          <Paper sx={{ ...theme.clay?.card, p: { xs: 3, md: 5 }, textAlign: "center" }}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.1rem", mb: 1 }}>
              Prediction points aren&apos;t scored yet
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 420, mx: "auto" }}>
              This is the one place being right will count — correct results,
              exact scorelines, and how many of the real XI you called. It
              won&apos;t affect the boards above: those stay about turning up.
            </Typography>
            <Box
              sx={{
                mt: 3,
                display: "inline-flex",
                gap: 1,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                "Correct result",
                "Exact scoreline",
                "XI hits",
                "Player to watch",
              ].map((label) => (
                <Box
                  key={label}
                  sx={{
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
                </Box>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}
