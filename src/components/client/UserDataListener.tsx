"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { clientDB } from "@/lib/firebase/client";
import {
  fetchUserDataSuccess,
  fetchUserDataStart,
  fetchUserDataFailure,
} from "@/lib/redux/slices/userDataSlice";
import {
  groupDataSuccess,
  groupDataStart,
  groupDataFailure,
} from "@/lib/redux/slices/groupSlice";

const sanitizeData = (data: any) => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] && typeof sanitized[key].toDate === "function") {
      sanitized[key] = sanitized[key].toDate().toISOString();
    }
  });
  return sanitized;
};

// Simple deep comparison to prevent unnecessary Redux dispatches
const isDataEqual = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

export const UserDataListener = ({ userId }: { userId: string | null }) => {
  const dispatch = useDispatch();
  const lastUserData = useRef<any>(null);
  const lastGroupData = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    dispatch(fetchUserDataStart());
    const userRef = doc(clientDB, "users", String(userId));

    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (!snapshot.exists()) {
        dispatch(fetchUserDataFailure("User profile not found"));
        return;
      }

      const rawUserData = snapshot.data();
      const userData = { ...sanitizeData(rawUserData), uid: userId };

      // 1. Only process if user data changed
      if (isDataEqual(lastUserData.current, userData)) return;
      lastUserData.current = userData;

      try {
        if (userData.groups?.length > 0) {
          dispatch(groupDataStart());

          const groupPromises = userData.groups.map(async (groupId: string) => {
            // 1. EXTRA GUARD: Check for valid groupId and userId
            if (!groupId || !userId) {
              console.error("[UserDataListener] Skipping invalid path:", {
                groupId,
                userId,
              });
              return null;
            }

            // 2. Use safe references
            const groupRef = doc(clientDB, "groups", groupId);
            const memberRef = doc(
              clientDB,
              "groupUsers",
              groupId,
              "members",
              userId,
            );

            const [groupDoc, groupUserDoc] = await Promise.all([
              getDoc(groupRef),
              getDoc(memberRef),
            ]);

            if (!groupDoc.exists()) return null;

            return {
              id: groupId,
              data: { ...sanitizeData(groupDoc.data()), groupId },
              role: groupUserDoc.exists() ? groupUserDoc.data().role : "user",
            };
          });

          const results = await Promise.all(groupPromises);

          const groupObj: Record<string, any> = {};
          const groupPermissions: Record<string, any> = {};
          results.forEach((res) => {
            if (res) {
              groupObj[res.id] = res.data;
              groupPermissions[res.id] = res.role;
            }
          });

          // 2. Only dispatch if group data actually changed
          if (!isDataEqual(lastGroupData.current, groupObj)) {
            lastGroupData.current = groupObj;
            dispatch(groupDataSuccess(groupObj));
          }
          dispatch(fetchUserDataSuccess({ ...userData, groupPermissions }));
        } else {
          dispatch(groupDataSuccess({}));
          dispatch(fetchUserDataSuccess(userData));
        }
      } catch (err: any) {
        dispatch(groupDataFailure(err.message));
      }
    });

    return () => unsubscribe();
  }, [userId, dispatch]);

  return null;
};
