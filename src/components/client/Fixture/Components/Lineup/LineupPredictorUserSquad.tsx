"use client";

import React, { useMemo } from "react";
import { FORMATIONS } from "./LineupPredictor";
import LineupShell from "./LineupShell";

interface ChosenLineupProps {
  squadData: Record<string, any>;
  userPrediction: {
    chosenTeam: Record<string, string | number>;
    formation: string;
  };
}

export default function ChosenLineup({
  squadData,
  userPrediction,
}: ChosenLineupProps) {
  // 1. DATA TRANSFORMATION
  // Transforms { "1": "player_id_123" } into { "1": { name: "...", photo: "..." } }
  const mappedTeam = useMemo(() => {
    const rawTeam = userPrediction?.chosenTeam;

    if (!rawTeam || !squadData) return {};

    return Object.entries(rawTeam).reduce(
      (acc, [slotId, playerId]) => {
        const player = squadData[String(playerId)];

        if (player) {
          acc[slotId] = {
            // Deep Clean: Extracting only the necessary UI fields
            name: player.name?.split(" ").pop() || player.name, // Last name only for pitch clarity
            photo: player.photo,
            fullName: player.name, // Fallback for tooltips/accessibility
          };
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }, [userPrediction?.chosenTeam, squadData]);

  // 2. FALLBACK CHECK
  // If the formation in the prediction isn't in our config, default to 4-3-3 Holding
  const activeFormation = useMemo(() => {
    return FORMATIONS[userPrediction.formation]
      ? userPrediction.formation
      : "4-3-3 Holding";
  }, [userPrediction.formation]);

  return (
    <LineupShell
      team={mappedTeam}
      formation={activeFormation}
      formationConfig={FORMATIONS}
      // You can pass the club's colors here later for extra polish
      title="11Votes.com"
    />
  );
}
