"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import { clientDB } from "@/lib/firebase/client";
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

    const predictionsRef = doc(
      clientDB,
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
      unsubscribe();
    };
  }, [groupId, matchId, currentYear, dispatch]);

  return null;
};
