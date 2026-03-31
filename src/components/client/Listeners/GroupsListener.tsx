"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  collection,
  query,
  onSnapshot,
  where,
  documentId,
} from "firebase/firestore";
import useUserData from "@/Hooks/useUserData";
import { clientDB } from "@/lib/firebase/client";
import {
  groupDataFailure,
  groupDataStart,
  groupDataSuccess,
} from "@/lib/redux/slices/groupSlice";

// Ensure these match your actual Redux action creators

/**
 * GroupsListener: The "11votes" Relationship Sync Engine.
 * Listens to the user's joinedGroups sub-collection and fetches
 * corresponding group metadata (live scores, slugs) from the global collection.
 */
export const GroupsListener = () => {
  const { userData } = useUserData();
  const dispatch = useDispatch();

  // Internal state to track { groupId: role } from the sub-collection
  const [membership, setMembership] = useState<Record<string, string>>({});
  const lastMembershipKey = useRef<string>("");

  // PHASE 1: Listen to the "joinedGroups" Sub-collection for Roles
  useEffect(() => {
    if (!userData?.uid) {
      console.log(
        "[GroupsListener] No UID found, skipping sub-collection listener.",
      );
      return;
    }

    const joinedRef = collection(
      clientDB,
      "users",
      userData.uid,
      "joinedGroups",
    );

    console.log(
      `[GroupsListener] Initializing sub-collection listener for: ${userData.uid}`,
    );

    const unsubSub = onSnapshot(
      joinedRef,
      (snapshot) => {
        const newMembership: Record<string, string> = {};

        snapshot.docs.forEach((doc) => {
          // The document ID in this sub-collection IS the groupId
          newMembership[doc.id] = doc.data().role || "member";
        });

        // Generate a unique key to prevent unnecessary re-runs of the second effect
        const currentKey =
          Object.keys(newMembership).sort().join(",") +
          Object.values(newMembership).sort().join(",");

        if (currentKey !== lastMembershipKey.current) {
          console.log("[GroupsListener] Membership/Roles updated.");
          lastMembershipKey.current = currentKey;
          setMembership(newMembership);
        }
      },
      (error) => {
        console.error("[GroupsListener] Sub-collection error:", error);
        dispatch(groupDataFailure(error.message));
      },
    );

    return () => unsubSub();
  }, [userData?.uid, dispatch]);

  // PHASE 2: Listen to the main "groups" collection for Match Data/Slugs
  useEffect(() => {
    const groupIds = Object.keys(membership);

    if (groupIds.length === 0) {
      // If the sub-collection listener finished and found no groups
      if (lastMembershipKey.current !== "") {
        console.log("[GroupsListener] User has no joined groups.");
        dispatch(groupDataSuccess({}));
      }
      return;
    }

    console.log(
      `[GroupsListener] Syncing metadata for ${groupIds.length} groups...`,
    );
    dispatch(groupDataStart());

    // Firestore 'in' query supports up to 30 IDs—ideal for Premier League fans.
    const groupsQuery = query(
      collection(clientDB, "groups"),
      where(documentId(), "in", groupIds),
    );

    const unsubGroups = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const finalGroupMap: Record<string, any> = {};

        snapshot.docs.forEach((doc) => {
          const groupDocData = doc.data();

          // MERGE: Combine global group data with the user's specific role
          finalGroupMap[doc.id] = {
            ...groupDocData, // api-football live data (scores, status, etc.)
            groupId: doc.id,
            role: membership[doc.id], // Guaranteed to exist because of Step 1
          };
        });

        console.log(
          `[GroupsListener] Success: ${Object.keys(finalGroupMap).length} groups hydrated with roles.`,
        );
        dispatch(groupDataSuccess(finalGroupMap));
      },
      (error) => {
        console.error("[GroupsListener] Groups metadata error:", error);
        dispatch(groupDataFailure(error.message));
      },
    );

    return () => unsubGroups();
  }, [membership, dispatch]);

  return null; // This is a logic-only component
};

export default GroupsListener;
