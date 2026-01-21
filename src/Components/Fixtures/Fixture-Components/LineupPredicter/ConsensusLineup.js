import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Collapse, IconButton, Typography } from "@mui/material";

import { FORMATIONS } from "./LineupPredictor"; // Adjust path to your formations config

import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import LineupShell from "./lineupShell";
import { InfoOutlined } from "@mui/icons-material";

// --- HELPER: CALCULATE CONSENSUS ---
// (Logic to find the winning formation and players)
const calculateCommunityXI = (matchPredictions) => {
  if (
    !matchPredictions ||
    !matchPredictions.formations ||
    !matchPredictions.positionConsensus
  ) {
    return null;
  }

  // 1. Find Winning Formation
  let winningFormation = "4-3-3"; // Default fallback
  let maxFormationVotes = 0;
  let totalFormationVotes = 0;

  Object.entries(matchPredictions.formations).forEach(([fmt, votes]) => {
    totalFormationVotes += votes;
    if (votes > maxFormationVotes) {
      maxFormationVotes = votes;
      winningFormation = fmt;
    }
  });

  // 2. Find Winning Player for Each Position Bucket (1-11)
  const lineup = {};

  // Iterate standard slots 1-11
  for (let i = 1; i <= 11; i++) {
    const bucket = matchPredictions.positionConsensus[i.toString()];

    if (bucket) {
      let winnerId = null;
      let maxPlayerVotes = 0;
      let totalSlotVotes = 0;

      Object.entries(bucket).forEach(([pid, votes]) => {
        totalSlotVotes += votes;
        if (votes > maxPlayerVotes) {
          maxPlayerVotes = votes;
          winnerId = pid;
        }
      });

      if (winnerId) {
        lineup[i] = {
          playerId: winnerId,
          percentage:
            totalSlotVotes > 0
              ? Math.round((maxPlayerVotes / totalSlotVotes) * 100)
              : 0,
        };
      }
    }
  }

  return {
    formation: winningFormation,
    formationStats: {
      percentage:
        totalFormationVotes > 0
          ? Math.round((maxFormationVotes / totalFormationVotes) * 100)
          : 0,
    },
    lineup,
  };
};

export default function ConsensusLineup({ matchPredictions }) {
  // 1. Get Squad Data from Redux to map IDs -> Names/Photos

  const squadData = useSelector((state) => selectSquadDataObject(state));

  const [showLogic, setShowLogic] = useState(false);

  // 2. Calculate the Consensus (Memoized)
  const consensus = useMemo(
    () => calculateCommunityXI(matchPredictions),
    [matchPredictions],
  );

  // 3. Prepare Data for LineupShell
  // Convert { 1: { playerId, percentage } } -> { 1: { name, photo, subText } }
  const mappedTeam = useMemo(() => {
    if (!consensus || !squadData) return {};

    const teamObj = {};
    Object.entries(consensus.lineup).forEach(([slotId, stats]) => {
      // Find player details in Redux state (handle IDs as strings or numbers)

      const player = squadData[stats.playerId];

      if (player) {
        teamObj[slotId] = {
          name: player.name,
          photo: player.photo,
          subText: `${stats.percentage}%`, // Pass the vote % as the badge text
        };
      }
    });

    return teamObj;
  }, [consensus, squadData]);

  if (!consensus) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        <Typography variant="h6">Not enough data yet.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", mt: 2, mb: 4 }}>
      {/* HEADER SECTION */}
      <Box sx={{ mb: 2, px: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: 1,
                fontWeight: "bold",
              }}
            >
              Community Consensus
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              Winning Formation:{" "}
              <span style={{ color: "#00FF87" }}>{consensus.formation}</span> (
              {consensus.formationStats.percentage}%)
            </Typography>
          </Box>

          {/* TOGGLE BUTTON */}
          <IconButton
            onClick={() => setShowLogic(!showLogic)}
            size="small"
            sx={{
              color: showLogic ? "#00FF87" : "text.secondary",
              bgcolor: showLogic ? "rgba(0, 255, 135, 0.1)" : "transparent",
            }}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Box>

        {/* --- COLLAPSIBLE LOGIC KEY --- */}
        <Collapse in={showLogic}>
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
            }}
          >
            <InfoOutlined sx={{ fontSize: 16, color: "#00FF87", mt: 0.3 }} />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.primary",
                  fontWeight: "bold",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                Understanding the Stats:
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", lineHeight: 1.2 }}
              >
                The % badge on a player shows their share of votes{" "}
                <b>for that specific position</b> (e.g. 80% picked this player
                as Striker). It is not their total popularity across the whole
                team.
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
        title="Community XI"
        themeColor="#00FF87" // Green accent for the Consensus view
        enableSave={true} // Allow users to download the Consensus image
      />
    </Box>
  );
}
