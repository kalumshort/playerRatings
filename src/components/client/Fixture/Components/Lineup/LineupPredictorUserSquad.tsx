"use client";

import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  LinearProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from "@mui/material";

import { FORMATIONS, DEFAULT_FORMATION } from "./formations";
import LineupShell from "./LineupShell";
import {
  calculateCommunityXI,
  compareXI,
  getActualStartingXI,
} from "./lineupUtils";
import type { PitchPlayerStatus } from "./PitchPlayer";

type ViewMode = "mine" | "crowd";

interface ChosenLineupProps {
  squadData: Record<string, any>;
  userPrediction: {
    chosenTeam: Record<string, string | number>;
    formation: string;
  };
  /** Needed to read the official XI once lineups publish. */
  fixture?: any;
  groupData?: any;
  /** Aggregated group predictions, for the "vs crowd" diff. */
  matchPredictions?: any;
}

export default function ChosenLineup({
  squadData,
  userPrediction,
  fixture,
  groupData,
  matchPredictions,
}: ChosenLineupProps) {
  const [mode, setMode] = useState<ViewMode>("mine");

  const chosenTeam = userPrediction?.chosenTeam;

  // --- The official XI, once it exists ---
  const actualXI = useMemo(
    () => getActualStartingXI(fixture, groupData?.groupClubId),
    [fixture, groupData?.groupClubId],
  );
  const hasActual = actualXI.length > 0;

  const result = useMemo(
    () => compareXI(chosenTeam, actualXI),
    [chosenTeam, actualXI],
  );

  // --- The crowd's XI ---
  const crowdIds = useMemo(() => {
    const consensus = calculateCommunityXI(matchPredictions);
    if (!consensus) return [];
    return Object.values(consensus.lineup).map((l) => String(l.playerId));
  }, [matchPredictions]);

  const hasCrowd = crowdIds.length > 0;

  // Same presence semantics as the score above — two differently-computed
  // agreement numbers on one screen would contradict each other.
  const crowdResult = useMemo(
    () => compareXI(chosenTeam, crowdIds),
    [chosenTeam, crowdIds],
  );

  const showingCrowd = mode === "crowd" && hasCrowd;

  // --- Per-slot status on the pitch ---
  const statusForPlayer = (playerId: string): PitchPlayerStatus => {
    if (showingCrowd) {
      if (!hasCrowd) return "default";
      return crowdIds.includes(playerId) ? "agree" : "differ";
    }
    if (!hasActual) return "default";
    return actualXI.includes(playerId) ? "hit" : "miss";
  };

  const mappedTeam = useMemo(() => {
    if (!chosenTeam || !squadData) return {};

    return Object.entries(chosenTeam).reduce(
      (acc, [slotId, playerId]) => {
        const id = String(playerId);
        const player = squadData[id];

        if (player) {
          acc[slotId] = {
            name: player.name?.split(" ").pop() || player.name,
            photo: player.photo,
            fullName: player.name,
            status: statusForPlayer(id),
          };
        }
        return acc;
      },
      {} as Record<string, any>,
    );
    // statusForPlayer closes over mode/actualXI/crowdIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenTeam, squadData, showingCrowd, actualXI, crowdIds, hasActual]);

  // userPrediction is undefined for any logged-in user who hasn't predicted
  // yet, and this tab renders unconditionally.
  const activeFormation = useMemo(() => {
    const formation = userPrediction?.formation;
    return formation && FORMATIONS[formation] ? formation : DEFAULT_FORMATION;
  }, [userPrediction?.formation]);

  const nameOf = (id: string) =>
    squadData?.[id]?.name?.split(" ").pop() ||
    squadData?.[id]?.name ||
    "Unknown";
  const photoOf = (id: string) => squadData?.[id]?.photo;

  // Members can now reach this tab post-match (previously it was forced to the
  // consensus view), so someone who never submitted would otherwise land on a
  // blank pitch with no explanation.
  const hasPrediction = Object.keys(chosenTeam ?? {}).length > 0;

  if (!hasPrediction) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Typography variant="body2" fontWeight={800} sx={{ mb: 0.5 }}>
          You didn&apos;t pick an XI for this match
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {hasCrowd
            ? "Check the Group XI tab to see who the fans went with."
            : "Predictions open again before the next kick-off."}
        </Typography>
      </Box>
    );
  }

  const header = (
    <Box sx={{ mb: 2 }}>
      {hasCrowd && (
        <ToggleButtonGroup
          value={mode}
          exclusive
          fullWidth
          size="small"
          onChange={(_, v: ViewMode | null) => v && setMode(v)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="mine" sx={{ fontWeight: 900 }}>
            MY XI
          </ToggleButton>
          <ToggleButton value="crowd" sx={{ fontWeight: 900 }}>
            VS CROWD
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      {showingCrowd ? (
        <ScoreBanner
          eyebrow="AGREEMENT"
          score={crowdResult.score}
          total={11}
          caption={
            crowdResult.misses.length === 0
              ? "You picked exactly the crowd's XI."
              : `${crowdResult.misses.length} pick${
                  crowdResult.misses.length === 1 ? "" : "s"
                } where you back yourself.`
          }
          tone="info"
        />
      ) : hasActual ? (
        <ScoreBanner
          eyebrow="YOUR XI vs THE REAL XI"
          score={result.score}
          total={result.total}
          caption={
            result.score === result.total
              ? "Perfect call. You named the whole XI."
              : `You called ${result.score} of the ${result.total} starters.`
          }
          tone="good"
        />
      ) : null}
    </Box>
  );

  return (
    <Box>
      <LineupShell
        team={mappedTeam}
        formation={activeFormation}
        title="11Votes.com"
        header={header}
      />

      {/* Post-match: the starters you left out. */}
      {!showingCrowd && hasActual && result.missed.length > 0 && (
        <PlayerStrip
          title="STARTED — YOU LEFT THEM OUT"
          players={result.missed.map((id) => ({
            id,
            name: nameOf(id),
            photo: photoOf(id),
          }))}
          tone="poor"
        />
      )}

      {/* Pre-match: where you differ from the crowd, paired against their pick. */}
      {showingCrowd && crowdResult.misses.length > 0 && (
        <FaceOffStrip
          yours={crowdResult.misses.map((id) => ({
            id,
            name: nameOf(id),
            photo: photoOf(id),
          }))}
          theirs={crowdResult.missed.map((id) => ({
            id,
            name: nameOf(id),
            photo: photoOf(id),
          }))}
        />
      )}
    </Box>
  );
}

/* ---------------------------------- UI ---------------------------------- */

const ScoreBanner = ({
  eyebrow,
  score,
  total,
  caption,
  tone,
}: {
  eyebrow: string;
  score: number;
  total: number;
  caption: string;
  tone: "good" | "info";
}) => (
  <Paper
    sx={(t: any) => ({
      p: 2,
      borderRadius: "12px",
      background: `radial-gradient(circle at 50% 0%, ${alpha(
        tone === "good" ? t.palette.form.goodSolid : t.palette.info.main,
        0.16,
      )} 0%, ${t.palette.background.paper} 70%)`,
    })}
  >
    <Typography
      variant="overline"
      sx={{ fontWeight: 900, letterSpacing: 2, opacity: 0.6 }}
    >
      {eyebrow}
    </Typography>

    <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.5 }}>
      <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1 }}>
        {score}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 800, opacity: 0.5 }}>
        /{total}
      </Typography>
    </Stack>

    <LinearProgress
      variant="determinate"
      value={total > 0 ? (score / total) * 100 : 0}
      sx={(t: any) => ({
        my: 1.5,
        height: 6,
        borderRadius: 999,
        backgroundColor: alpha(t.palette.text.primary, 0.08),
        "& .MuiLinearProgress-bar": {
          backgroundColor:
            tone === "good" ? t.palette.form.goodSolid : t.palette.info.main,
        },
      })}
    />

    <Typography variant="body2" color="text.secondary">
      {caption}
    </Typography>
  </Paper>
);

const PlayerStrip = ({
  title,
  players,
  tone,
}: {
  title: string;
  players: { id: string; name: string; photo?: string }[];
  tone: "poor" | "info";
}) => (
  <Box sx={{ mt: 2 }}>
    <Typography
      variant="overline"
      sx={{ fontWeight: 900, letterSpacing: 1.5, opacity: 0.6 }}
    >
      {title}
    </Typography>
    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
      {players.map((p) => (
        <Paper
          key={p.id}
          variant="flat"
          sx={(t: any) => ({
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 0.5,
            borderRadius: 999,
            border: `1px solid ${alpha(
              tone === "poor" ? t.palette.form.poorSolid : t.palette.info.main,
              0.4,
            )}`,
          })}
        >
          <Avatar src={p.photo} alt={p.name} sx={{ width: 24, height: 24 }} />
          <Typography variant="caption" sx={{ fontWeight: 800 }}>
            {p.name}
          </Typography>
        </Paper>
      ))}
    </Stack>
  </Box>
);

const FaceOffStrip = ({
  yours,
  theirs,
}: {
  yours: { id: string; name: string; photo?: string }[];
  theirs: { id: string; name: string; photo?: string }[];
}) => (
  <Box sx={{ mt: 2 }}>
    <Typography
      variant="overline"
      sx={{ fontWeight: 900, letterSpacing: 1.5, opacity: 0.6 }}
    >
      YOUR DIFFERENTIALS
    </Typography>

    <Stack spacing={1} sx={{ mt: 1 }}>
      {yours.map((mine, i) => {
        const rival = theirs[i];
        return (
          <Paper
            key={mine.id}
            variant="flat"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              p: 1,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flex={1}>
              <Avatar
                src={mine.photo}
                alt={mine.name}
                sx={{ width: 28, height: 28 }}
              />
              <Typography variant="caption" sx={{ fontWeight: 900 }}>
                {mine.name}
              </Typography>
            </Stack>

            <Typography
              variant="caption"
              sx={{ fontWeight: 900, opacity: 0.4, px: 1 }}
            >
              VS
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flex={1}
              justifyContent="flex-end"
            >
              {rival ? (
                <>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, opacity: 0.75 }}
                  >
                    {rival.name}
                  </Typography>
                  <Avatar
                    src={rival.photo}
                    alt={rival.name}
                    sx={{ width: 28, height: 28 }}
                  />
                </>
              ) : (
                <Typography variant="caption" sx={{ opacity: 0.5 }}>
                  no crowd pick
                </Typography>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  </Box>
);
