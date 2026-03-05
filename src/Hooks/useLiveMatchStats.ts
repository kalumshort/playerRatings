import { useEffect, useState, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client"; // Adjust to your clean path

// Types for the raw Firestore data
interface PlayerMinuteData {
  hot?: number;
  cold?: number;
  sub?: number;
  [key: string]: number | undefined;
}

interface LiveStatsData {
  totals: Record<string, Record<string, number>>;
  [minute: string]: Record<string, PlayerMinuteData> | any;
}

export default function useLiveMatchStats(
  fixtureId: string | number,
  elapsedTime: number,
  groupId: string,
  currentYear: string,
) {
  const [liveStats, setLiveStats] = useState<LiveStatsData>({ totals: {} });

  // 1. REAL-TIME LISTENER
  useEffect(() => {
    if (!fixtureId || !groupId) return;

    const statsRef = doc(
      db,
      `groups/${groupId}/seasons/${currentYear}/livePlayerStats`,
      String(fixtureId),
    );

    const unsubscribe = onSnapshot(
      statsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as LiveStatsData;
          setLiveStats(data);
        }
      },
      (error) => {
        console.error("❌ Live Stats Subscription Error:", error);
      },
    );

    return () => unsubscribe();
  }, [fixtureId, groupId, currentYear]);

  // 2. DERIVED ANALYTICS (Momentum Logic)
  const playerStatus = useMemo(() => {
    const computed: Record<string, any> = {};
    const currentMinute = Number(elapsedTime) || 90;
    const LOOKBACK_WINDOW = 10;

    // Extract totals and separate the timeline minutes
    const { totals, ...timeline } = liveStats;

    // Calculate Momentum for every player who has appeared in the stats
    const playerMomentum = Object.keys(totals).map((playerId) => {
      let recentHot = 0;
      let recentCold = 0;
      let recentSub = 0;

      // Sliding Window Calculation: Check the last 10 minutes relative to current elapsed time
      for (let i = 0; i < LOOKBACK_WINDOW; i++) {
        const minuteKey = String(currentMinute - i);
        const minuteData = timeline[minuteKey]?.[playerId];

        if (minuteData) {
          recentHot += minuteData.hot || 0;
          recentCold += minuteData.cold || 0;
          recentSub += minuteData.sub || 0;
        }
      }

      return {
        playerId,
        netMomentum: recentHot - recentCold,
        recentSub,
        totalSubRequests: totals[playerId]?.sub || 0,
      };
    });

    // Identify "Hot" (Top 2 with positive momentum)
    const hotIds = [...playerMomentum]
      .filter((p) => p.netMomentum > 0)
      .sort((a, b) => b.netMomentum - a.netMomentum)
      .slice(0, 2)
      .map((p) => p.playerId);

    // Identify "Cold" (Bottom 2 with negative momentum)
    const coldIds = [...playerMomentum]
      .filter((p) => p.netMomentum < 0)
      .sort((a, b) => a.netMomentum - b.netMomentum)
      .slice(0, 2)
      .map((p) => p.playerId);

    // Final Status Mapping
    playerMomentum.forEach((p) => {
      computed[p.playerId] = {
        isHot: hotIds.includes(p.playerId),
        isCold: coldIds.includes(p.playerId),
        // If 3 or more fans in the last 10 minutes want a sub, trigger the alert
        wantsSubOut: p.recentSub >= 3,
        totalSubRequests: p.totalSubRequests,
      };
    });

    return computed;
  }, [liveStats, elapsedTime]);

  return {
    liveStats, // Raw totals for modals
    playerStatus, // Computed { isHot, isCold, wantsSubOut } for icons
  };
}
