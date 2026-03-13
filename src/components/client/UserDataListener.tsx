"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
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

  // Track IDs from both sources to determine when a re-fetch is actually needed
  const lastIdSet = useRef<string>("");

  useEffect(() => {
    if (!userId) return;

    dispatch(fetchUserDataStart());

    const userRef = doc(clientDB, "users", String(userId));
    const joinedGroupsRef = collection(userRef, "joinedGroups");

    // Helper: Fetches full group data once we have the combined IDs
    const syncGroups = async (
      legacyIds: string[],
      subCollectionDocs: any[],
    ) => {
      const subMetadata = subCollectionDocs.reduce(
        (acc, d) => {
          acc[d.id] = d.data();
          return acc;
        },
        {} as Record<string, any>,
      );

      const allIds = Array.from(
        new Set([...legacyIds, ...Object.keys(subMetadata)]),
      );
      const idString = allIds.sort().join(",");

      // PERFORMANCE: Only fetch if the set of IDs has changed
      if (lastIdSet.current === idString) return;
      lastIdSet.current = idString;

      if (allIds.length === 0) {
        dispatch(groupDataSuccess({}));
        return;
      }

      dispatch(groupDataStart());
      const promises = allIds.map(async (groupId) => {
        try {
          const groupDoc = await getDoc(doc(clientDB, "groups", groupId));
          if (!groupDoc.exists()) return null;

          return {
            id: groupId,
            data: { ...sanitizeData(groupDoc.data()), groupId },
            role: subMetadata[groupId]?.role || "member",
          };
        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(promises);
      const groupObj: Record<string, any> = {};
      const groupPermissions: Record<string, any> = {};

      results.forEach((res) => {
        if (res) {
          groupObj[res.id] = res.data;
          groupPermissions[res.id] = res.role;
        }
      });

      dispatch(groupDataSuccess(groupObj));
      return groupPermissions;
    };

    // 1. Listen to the User Doc
    const unsubscribeUser = onSnapshot(userRef, async (snap) => {
      if (!snap.exists()) return;
      const userData = { ...sanitizeData(snap.data()), uid: userId };

      // We still need to fetch the sub-collection to do the merge
      const subSnap = await getDocs(joinedGroupsRef);
      const perms = await syncGroups(userData.groups || [], subSnap.docs);

      dispatch(fetchUserDataSuccess({ ...userData, groupPermissions: perms }));
    });

    // 2. Listen to the JoinedGroups (Ensures instant role updates)
    const unsubscribeSub = onSnapshot(joinedGroupsRef, async (subSnap) => {
      // Re-fetch the user doc to get the latest legacy array for the merge
      const userSnap = await getDoc(userRef);
      const legacyIds = userSnap.exists() ? userSnap.data().groups || [] : [];

      await syncGroups(legacyIds, subSnap.docs);
    });

    return () => {
      unsubscribeUser();
      unsubscribeSub();
    };
  }, [userId, dispatch]);

  return null;
};
