"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";

// Import your specific action from the group slice

import { clientDB } from "@/lib/firebase/client";
import { Group, updateGroupData } from "@/lib/redux/slices/groupSlice";

interface GroupDataListenerProps {
  groupId: string;
}

/**
 * Listens to a specific group's metadata (Privacy, Name, Branding).
 * Ensures the Redux state stays in sync with Firestore changes.
 */
export const GroupDataListener = ({ groupId }: GroupDataListenerProps) => {
  const dispatch = useDispatch();
  console.log(groupId, "GroupDataListener");
  useEffect(() => {
    if (!groupId) return;

    const groupRef = doc(clientDB, "groups", groupId);

    const unsubscribe = onSnapshot(
      groupRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const rawData = snapshot.data();

          // SERIALIZATION FIX: Firestore Timestamps crash Redux/Next.js if not plain-ified
          const serializedData = {
            ...rawData,
            // Convert to milliseconds for Redux/JSON compatibility
            updatedAt:
              rawData.updatedAt?.toMillis?.() || rawData.updatedAt || null,
            createdAt:
              rawData.createdAt?.toMillis?.() || rawData.createdAt || null,
          };

          dispatch(
            updateGroupData({
              groupId,
              data: serializedData as Partial<Group>,
            }),
          );
        }
      },
      (error) => {
        console.warn(
          `⚠️ [GroupListener] Error accessing group ${groupId}:`,
          error,
        );
      },
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [dispatch, groupId]);

  return null;
};
