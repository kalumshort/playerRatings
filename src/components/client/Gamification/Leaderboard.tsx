"use client";

import {
  Avatar,
  Box,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import type { LeaderboardEntry } from "@/lib/gamification/progressQueries";

/**
 * Fans ranked by participation, not by being right.
 *
 * `displayName` arrives already redacted — an opted-out fan's row carries null
 * and renders as "Anonymous", because the leaderboard collection is
 * world-readable and their real name is never written into it.
 */
export default function Leaderboard({
  entries,
  currentUid,
  title = "Most involved fans",
  emptyMessage = "No one has taken part yet this season. Be the first.",
}: {
  entries: LeaderboardEntry[];
  /** Highlights the signed-in fan's own row. */
  currentUid?: string | null;
  title?: string;
  emptyMessage?: string;
}) {
  const theme = useTheme() as any;

  return (
    <Paper sx={{ ...theme.clay?.card, p: { xs: 2, md: 3 } }}>
      <Typography
        variant="caption"
        sx={{ display: "block", fontWeight: 900, letterSpacing: 1.5, opacity: 0.6, mb: 2 }}
      >
        {title.toUpperCase()}
      </Typography>

      {entries.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 4, textAlign: "center" }}
        >
          {emptyMessage}
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {entries.map((entry) => {
            const isMe = Boolean(currentUid) && entry.uid === currentUid;

            return (
              <Stack
                key={entry.uid}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  px: 1.25,
                  py: 1,
                  borderRadius: "10px",
                  bgcolor: isMe
                    ? alpha(theme.palette.primary.main, 0.12)
                    : "transparent",
                  border: isMe
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
                    : "1px solid transparent",
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    // Gold, silver, bronze for the top three, reusing the same
                    // tokens the Man of the Match crown uses.
                    color:
                      entry.rank === 1
                        ? theme.palette.motm?.goldEnd
                        : entry.rank <= 3
                          ? "text.primary"
                          : "text.secondary",
                  }}
                >
                  {entry.rank}
                </Box>

                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    bgcolor: alpha(theme.palette.primary.main, 0.18),
                    color: "primary.main",
                  }}
                >
                  {entry.displayName?.charAt(0)?.toUpperCase() ?? "?"}
                </Avatar>

                <Typography
                  noWrap
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontWeight: isMe ? 900 : 700,
                    fontSize: "0.9rem",
                    fontStyle: entry.displayName ? "normal" : "italic",
                    opacity: entry.displayName ? 1 : 0.65,
                  }}
                >
                  {entry.displayName ?? "Anonymous"}
                  {isMe && " (you)"}
                </Typography>

                <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: "0.9rem" }}>
                    {entry.xp.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.55, fontSize: "0.6rem", lineHeight: 1 }}
                  >
                    {entry.matchesParticipated} match
                    {entry.matchesParticipated === 1 ? "" : "es"}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
