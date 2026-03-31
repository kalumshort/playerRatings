"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import { clientDB } from "@/lib/firebase/client";
import {
  fetchUserDataSuccess,
  fetchUserDataStart,
  fetchUserDataFailure,
} from "@/lib/redux/slices/userDataSlice";

/**
 * Sanitizes Firestore data, specifically converting Timestamps to ISO strings
 * for Redux serializability.
 */
const sanitizeData = (data: any) => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] && typeof sanitized[key].toDate === "function") {
      sanitized[key] = sanitized[key].toDate().toISOString();
    }
  });
  return sanitized;
};

export const UserDataListener = ({ userId }: { userId: string | null }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userId) {
      console.log("[UserDataListener] No userId provided, skipping listener.");
      return;
    }

    console.log(
      `[UserDataListener] Initializing profile listener for user: ${userId}`,
    );
    dispatch(fetchUserDataStart());

    const userRef = doc(clientDB, "users", String(userId));

    // Listen only to the core user document
    const unsubscribeUser = onSnapshot(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          console.error(
            "[UserDataListener] User document does not exist in Firestore!",
          );
          dispatch(fetchUserDataFailure("User profile not found."));
          return;
        }

        const userData = {
          ...sanitizeData(snap.data()),
          uid: userId,
        };

        console.log("[UserDataListener] Profile data updated.");

        // We no longer fetch or merge groups here.
        // GroupsListener handles all group-related state.
        dispatch(fetchUserDataSuccess(userData));
      },
      (err) => {
        console.error("[UserDataListener] Snapshot error:", err);
        dispatch(fetchUserDataFailure(err.message));
      },
    );

    return () => {
      console.log(
        `[UserDataListener] Cleaning up profile listener for ${userId}`,
      );
      unsubscribeUser();
    };
  }, [userId, dispatch]);

  return null;
};

export default UserDataListener;
