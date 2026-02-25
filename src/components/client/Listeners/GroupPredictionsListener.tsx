"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { fetchMatchPrediction } from "@/lib/redux/slices/predictionsSlice";

interface GroupPredictionsListenerProps {
  groupId: string | number;
  matchId: string | number;
  currentYear: string | number;
}

/**
 * 11VOTES DEEP CLEAN:
 * Listen for real-time changes to community predictions in a specific group.
 */
export const GroupPredictionsListener = ({
  groupId,
  matchId,
  currentYear,
}: GroupPredictionsListenerProps) => {
  const dispatch = useDispatch();
  const lastDataRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Guard against missing/undefined props
    if (!groupId || !matchId || !currentYear) {
      console.warn("⚠️ [PredictionsListener] Missing props:", {
        groupId,
        matchId,
        currentYear,
      });
      return;
    }

    const gid = String(groupId);
    const mid = String(matchId);
    const year = String(currentYear);

    console.log(
      `%c🔮 [PredictionsListener] Subscribing: groups/${gid}/seasons/${year}/predictions/${mid}`,
      "color: #8b5cf6; font-weight: bold;",
    );

    const predictionsRef = doc(
      db,
      "groups",
      gid,
      "seasons",
      year,
      "predictions",
      mid,
    );

    const unsubscribe = onSnapshot(
      predictionsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const fingerprint = JSON.stringify(data);

          // Only dispatch if data changed to save CPU/Renders
          if (lastDataRef.current !== fingerprint) {
            console.log(
              `%c📈 [PredictionsListener] Update for Group ${gid}:`,
              "color: #10b981; font-weight: bold;",
              data,
            );

            lastDataRef.current = fingerprint;

            dispatch(
              fetchMatchPrediction({
                groupId: gid,
                matchId: mid,
                data: data,
              }),
            );
          }
        } else {
          console.log(
            `ℹ️ [PredictionsListener] No predictions yet for match ${mid}`,
          );
        }
      },
      (error) => {
        console.error(
          "%c🚨 [PredictionsListener] Firestore Error:",
          "color: #ef4444; font-weight: bold;",
        );
        console.error(`Path: groups/${gid}/seasons/${year}/predictions/${mid}`);
        console.error("Message:", error.message);
      },
    );

    return () => {
      console.log(
        `%c🧹 [PredictionsListener] Unsubscribing from match ${mid}`,
        "color: #f59e0b;",
      );
      unsubscribe();
    };
  }, [groupId, matchId, currentYear, dispatch]);

  return null;
};
