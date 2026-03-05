"use client";

import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Collapse,
  IconButton,
  Typography,
  useTheme,
  alpha,
  Stack,
} from "@mui/material";
import { InfoOutlined, GroupsRounded } from "@mui/icons-material";

// --- HELPERS & CONFIG ---
import { FORMATIONS } from "./LineupPredictor";

import { RootState } from "@/lib/redux/store";
import LineupShell from "./LineupShell";

interface ConsensusLineupProps {
  matchPredictions: any;
  squadData: any;
  groupData: any;
}

/**
 * Logic to determine the Community's preferred formation and
 * the #1 player for every slot (1-11).
 */
const calculateCommunityXI = (matchPredictions: any) => {
  if (!matchPredictions?.formations || !matchPredictions?.positionConsensus) {
    return null;
  }

  // 1. Determine Winning Formation
  let winningFormation = "4-3-3 Holding";
  let maxFormationVotes = 0;
  const totalFormationVotes = Object.values(
    matchPredictions.formations as Record<string, number>,
  ).reduce((a, b) => a + b, 0);

  Object.entries(matchPredictions.formations as Record<string, number>).forEach(
    ([fmt, votes]) => {
      if (votes > maxFormationVotes) {
        maxFormationVotes = votes;
        winningFormation = fmt;
      }
    },
  );

  // 2. Determine Top Player per Slot
  const lineup: Record<string, { playerId: string; percentage: number }> = {};

  for (let i = 1; i <= 11; i++) {
    const slotId = i.toString();
    const bucket = matchPredictions.positionConsensus[slotId];

    if (bucket) {
      const sortedPlayers = Object.entries(
        bucket as Record<string, number>,
      ).sort(([, a], [, b]) => b - a);

      const [winnerId, winnerVotes] = sortedPlayers[0];
      const totalSlotVotes = sortedPlayers.reduce((acc, [, v]) => acc + v, 0);

      if (winnerId) {
        lineup[i] = {
          playerId: winnerId,
          percentage:
            totalSlotVotes > 0
              ? Math.round((winnerVotes / totalSlotVotes) * 100)
              : 0,
        };
      }
    }
  }

  return {
    formation: winningFormation,
    formationPercentage:
      totalFormationVotes > 0
        ? Math.round((maxFormationVotes / totalFormationVotes) * 100)
        : 0,
    lineup,
  };
};

export default function ConsensusLineup({
  matchPredictions,
  squadData,
  groupData,
}: ConsensusLineupProps) {
  const theme = useTheme() as any;
  const [showLogic, setShowLogic] = useState(false);

  // 1. Calculate Consensus (Memoized)
  const consensus = useMemo(
    () => calculateCommunityXI(matchPredictions),
    [matchPredictions],
  );

  // 2. Map Consensus to Shell Format
  const mappedTeam = useMemo(() => {
    if (!consensus || !squadData) return {};

    const teamObj: Record<string, any> = {};
    Object.entries(consensus.lineup).forEach(([slotId, stats]) => {
      const player = squadData[stats.playerId];
      if (player) {
        teamObj[slotId] = {
          name: player.name?.split(" ").pop() || player.name,
          photo: player.photo,
          subText: `${stats.percentage}%`,
        };
      }
    });
    return teamObj;
  }, [consensus, squadData]);

  if (!consensus) {
    return (
      <Box sx={{ p: 6, textAlign: "center", opacity: 0.5 }}>
        <GroupsRounded sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="body2" fontWeight={800}>
          NOT ENOUGH PREDICTIONS YET
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", mt: 2, mb: 4 }}>
      {/* HEADER SECTION */}
      <Box sx={{ mb: 2, px: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant="button"
              sx={{
                color: "text.secondary",
                fontWeight: 900,
                letterSpacing: 1.5,
              }}
            >
              Community Consensus
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: "block", fontWeight: 700 }}
            >
              Winning Formation:{" "}
              <span style={{ color: theme.palette.primary.main }}>
                {consensus.formation}
              </span>{" "}
              ({consensus.formationPercentage}%)
            </Typography>
          </Box>

          <IconButton
            onClick={() => setShowLogic(!showLogic)}
            size="small"
            sx={{
              color: showLogic ? "primary.main" : "text.secondary",
              bgcolor: showLogic
                ? alpha(theme.palette.primary.main, 0.1)
                : "transparent",
            }}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Stack>

        <Collapse in={showLogic}>
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: "16px",
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              display: "flex",
              gap: 1.5,
            }}
          >
            <InfoOutlined
              sx={{ fontSize: 18, color: "primary.main", mt: 0.2 }}
            />
            <Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 900, display: "block", mb: 0.5 }}
              >
                HOW THE STATS WORK:
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", lineHeight: 1.4 }}
              >
                The percentage on each player shows how many fans picked them{" "}
                <b>for that specific slot</b>. If a player has 90%, it means the
                community is nearly certain about that position.
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* RENDER THE SHELL */}
      <LineupShell
        team={mappedTeam}
        formation={consensus.formation}
        formationConfig={FORMATIONS}
        title={`${groupData.name}  Preferred XI`}
        enableSave={true}
      />
    </Box>
  );
}
