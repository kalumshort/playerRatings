"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// Redux Actions
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

// Helper to sanitize Firebase Timestamps (Prevents Redux serialization errors)
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
    if (!userId) return;

    dispatch(fetchUserDataStart());
    const userRef = doc(db, "users", String(userId));

    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
      if (!snapshot.exists()) {
        dispatch(fetchUserDataFailure("User profile not found"));
        return;
      }

      const rawUserData = snapshot.data();
      const userData = { ...sanitizeData(rawUserData), uid: userId };

      try {
        if (userData.groups && userData.groups.length > 0) {
          dispatch(groupDataStart());

          // Parallel fetch for all groups the user belongs to
          const groupPromises = userData.groups.map(async (groupId: string) => {
            try {
              const groupRef = doc(db, "groups", groupId);
              const groupDoc = await getDoc(groupRef);

              if (!groupDoc.exists()) return null;

              const groupData = sanitizeData(groupDoc.data());

              // Fetch User Role in this specific group
              const groupUserRef = doc(
                db,
                `groupUsers/${groupId}/members`,
                userId,
              );
              const groupUserDoc = await getDoc(groupUserRef);
              const role = groupUserDoc.exists()
                ? groupUserDoc.data().role
                : "user";

              return {
                id: groupId,
                data: { ...groupData, groupId },
                role,
              };
            } catch (err) {
              console.error(`Error loading group ${groupId}`, err);
              return null;
            }
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

          dispatch(groupDataSuccess(groupObj));
          dispatch(fetchUserDataSuccess({ ...userData, groupPermissions }));
        } else {
          // No groups - finish loading user data
          dispatch(groupDataSuccess({}));
          dispatch(fetchUserDataSuccess(userData));
        }
      } catch (err: any) {
        console.error("Listener Logic Error:", err);
        dispatch(groupDataFailure(err.message));
      }
    });

    return () => unsubscribe();
  }, [userId, dispatch]);

  return null;
};
