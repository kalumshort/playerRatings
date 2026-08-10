"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getAuth } from "firebase/auth";
import { fetchUserMatchData } from "@/lib/redux/slices/userDataSlice";
import { devWarn } from "@/lib/utils/logger";

interface UsersMatchDataListenerProps {
  matchId: string;
  groupId: string;
  currentYear: string;
}

/**
 * Listens to the user's personal data for a specific match
 * (Their specific player ratings, MOTM choice, and mood).
 */
export const UsersMatchDataListener = ({
  matchId,
  groupId,
  currentYear,
}: UsersMatchDataListenerProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    // Guard: We need a user, a group, and a match to listen
    if (!user || !groupId || !matchId) return;

    const matchRef = doc(
      db,
      "users",
      user.uid,
      "groups",
      groupId,
      "seasons",
      currentYear,
      "matches",
      matchId,
    );

    const unsubscribe = onSnapshot(
      matchRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const matchData = snapshot.data();
          dispatch(
            fetchUserMatchData({
              matchId,
              data: matchData,
            }),
          );
        }
      },
      (error) => {
        // Log but don't crash; usually a permissions issue right after logout
        devWarn("[UserListener] Match data access error:", error.message);
      },
    );

    return () => unsubscribe();
  }, [dispatch, matchId, groupId, currentYear]);

  return null;
};
