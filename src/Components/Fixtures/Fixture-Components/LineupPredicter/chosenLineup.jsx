import React, { useMemo } from "react";

import { FORMATIONS } from "./LineupPredictor";
import LineupShell from "./lineupShell";

export default function ChosenLineup({ squadData, userPrediction }) {
  // 1. Prepare Data for the Shell
  // We transform your specific ID-based map into the Shell's expected format
  const mappedTeam = useMemo(() => {
    if (!userPrediction.chosenTeam || !squadData) return {};

    const teamObj = {};
    Object.entries(userPrediction.chosenTeam).forEach(([slotId, playerId]) => {
      const player = squadData[playerId];
      if (player) {
        teamObj[slotId] = {
          name: player.name,
          photo: player.photo,
          // You could add subText here if you wanted later
        };
      }
    });
    return teamObj;
  }, [userPrediction.chosenTeam, squadData]);

  // 2. Render Shell
  return (
    <LineupShell
      team={mappedTeam}
      formation={userPrediction.formation}
      formationConfig={FORMATIONS}
      title="11VOTES.COM"
    />
  );
}
