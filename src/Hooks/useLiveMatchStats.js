import { useEffect, useState, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import useGroupData from "./useGroupsData";
import useGlobalData from "./useGlobalData";

export default function useLiveMatchStats(fixtureId, elapsedTime) {
  const { currentGroup } = useGroupData();
  const { currentYear } = useGlobalData();
  const [liveStats, setLiveStats] = useState({ totals: {}, timeline: {} });

  useEffect(() => {
    if (!fixtureId || !currentGroup?.groupId) return;

    const statsRef = doc(
      db,
      `groups/${currentGroup.groupId}/seasons/${currentYear}/livePlayerStats`,
      String(fixtureId)
    );

    const unsubscribe = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const { totals, ...timeline } = data;
        setLiveStats({ totals: totals || {}, timeline: timeline || {} });
      }
    });

    return () => unsubscribe();
  }, [fixtureId, currentGroup?.groupId, currentYear]);

  // --- DERIVED DATA CALCULATIONS ---
  const stats = useMemo(() => {
    const computed = {};
    const currentMinute = elapsedTime || 90;
    const LOOKBACK_WINDOW = 10; // Check last 10 minutes

    // 1. Calculate Momentum for EVERY player first
    const playerMomentum = [];

    // Iterate over all players who have received at least one vote
    Object.keys(liveStats.totals).forEach((playerId) => {
      let recentHot = 0;
      let recentCold = 0;
      let recentSub = 0;

      // Sum up the last 10 minutes
      for (let i = 0; i < LOOKBACK_WINDOW; i++) {
        const minuteKey = String(currentMinute - i);
        const minuteData = liveStats.timeline[minuteKey]?.[playerId];

        if (minuteData) {
          if (minuteData.hot) recentHot += minuteData.hot;
          if (minuteData.cold) recentCold += minuteData.cold;
          if (minuteData.sub) recentSub += minuteData.sub;
        }
      }

      // "Net Momentum" = Hot - Cold
      const netMomentum = recentHot - recentCold;

      playerMomentum.push({
        playerId,
        netMomentum,
        recentSub,
        // We still need total requests for the modal logic
        totalSubRequest: liveStats.totals[playerId]?.subInRequest || 0,
      });
    });

    // 2. Identify the "Hot" Players (Top 2 Highest Momentum)
    // Must be positive (> 0) to avoid highlighting 0 as hot
    const hotIds = playerMomentum
      .filter((p) => p.netMomentum > 0)
      .sort((a, b) => b.netMomentum - a.netMomentum) // Descending
      .slice(0, 2) // Take Top 2
      .map((p) => p.playerId);

    // 3. Identify the "Cold" Players (Bottom 2 Lowest Momentum)
    // Must be negative (< 0)
    const coldIds = playerMomentum
      .filter((p) => p.netMomentum < 0)
      .sort((a, b) => a.netMomentum - b.netMomentum) // Ascending (Most negative first)
      .slice(0, 2) // Take Top 2
      .map((p) => p.playerId);

    // 4. Build the final status map
    playerMomentum.forEach((p) => {
      computed[p.playerId] = {
        isHot: hotIds.includes(p.playerId),
        isCold: coldIds.includes(p.playerId),

        // Sub logic stays absolute (if 3 people want you off in 10 mins, it's urgent)
        wantsSubOut: p.recentSub >= 3,
        totalSubRequests: p.totalSubRequest,
      };
    });

    return computed;
  }, [liveStats, elapsedTime]);

  return {
    liveStats,
    playerStatus: stats,
  };
}
