"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";

import {
  clubProgress,
  tieInvolves,
  type CupBracket as CupBracketData,
} from "@/lib/league/bracket";

import TieCard from "./TieCard";

interface CupBracketProps {
  bracket: CupBracketData;
  clubId?: string;
}

/**
 * A cup's knockout rounds.
 *
 * One round at a time, chosen by a tab strip. A true side-by-side bracket is
 * the obvious shape, but an FA Cup round of 128 is sixty ties — laid out as
 * connected columns that is a diagram nobody can read on a phone, and the
 * question a club's fans actually have is "who did we get, and who's left".
 *
 * So it opens on the round this club last played, and the tab strip carries
 * the shape instead.
 */
export default function CupBracket({ bracket, clubId }: CupBracketProps) {
  const theme = useTheme() as any;

  const drawn = useMemo(
    () => bracket.rounds.filter((round) => round.drawn),
    [bracket.rounds],
  );

  const progress = useMemo(
    () => (clubId ? clubProgress(bracket, clubId) : null),
    [bracket, clubId],
  );

  // Open where this club's story ended, not at the start of a draw they left
  // in September. Falls back to the latest drawn round.
  const [active, setActive] = useState<string>(
    progress?.lastRoundKey ?? drawn[drawn.length - 1]?.key ?? "",
  );

  const round =
    bracket.rounds.find((candidate) => candidate.key === active) ??
    drawn[drawn.length - 1];

  if (bracket.rounds.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
        No rounds have been drawn yet.
      </Typography>
    );
  }

  return (
    <Box>
      <Tabs
        value={round?.key ?? false}
        onChange={(_, value) => setActive(value)}
        variant="scrollable"
        scrollButtons={false}
        allowScrollButtonsMobile
        TabIndicatorProps={{ style: { display: "none" } }}
        aria-label="Select round"
        sx={{ mb: 2 }}
      >
        {bracket.rounds.map((candidate) => (
          <Tab
            key={candidate.key}
            value={candidate.key}
            disableRipple
            label={candidate.label}
            // An undrawn round is shown, but dimmed and unselectable-looking,
            // so the shape of the competition is visible in January.
            disabled={!candidate.drawn}
            sx={{ minHeight: 38, opacity: candidate.drawn ? 1 : 0.4 }}
          />
        ))}
      </Tabs>

      {round && !round.drawn ? (
        <Typography
          color="text.secondary"
          sx={{ py: 6, textAlign: "center", fontSize: "0.9rem" }}
        >
          {round.label} has not been drawn yet.
        </Typography>
      ) : (
        <Paper sx={{ ...theme.clay?.card, p: { xs: 1.5, md: 2 } }}>
          {progress?.lastRoundKey === round?.key && clubId && (
            <Chip
              size="small"
              label={
                progress.won
                  ? "Won the competition"
                  : progress.exited
                    ? `Knocked out in the ${round?.label.toLowerCase()}`
                    : `In the ${round?.label.toLowerCase()}`
              }
              sx={{
                mb: 1.5,
                fontWeight: 800,
                fontSize: "0.62rem",
                height: 22,
                bgcolor: "background.default",
                color: "text.secondary",
              }}
            />
          )}

          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
            }}
          >
            {[...(round?.ties ?? [])]
              // The club's own ties first — on a 60-tie round it is otherwise
              // a hunt through clubs the reader has no interest in.
              .sort((a, b) => {
                if (!clubId) return 0;
                return (
                  Number(tieInvolves(b, clubId)) - Number(tieInvolves(a, clubId))
                );
              })
              .map((tie) => (
                <TieCard key={tie.tieId} tie={tie} clubId={clubId} />
              ))}
          </Box>
        </Paper>
      )}

      {bracket.unmatched.length > 0 && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1.5,
            color: "text.secondary",
            opacity: 0.5,
            fontSize: "0.65rem",
          }}
        >
          {bracket.unmatched.length} fixture
          {bracket.unmatched.length === 1 ? "" : "s"} could not be placed in a
          round.
        </Typography>
      )}
    </Box>
  );
}
