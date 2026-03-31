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
import { setUserGroups } from "@/lib/redux/slices/userDataSlice";
// Import your user data action here

export const GroupsListener = () => {
  const { userData } = useUserData();
  const dispatch = useDispatch();

  const [membership, setMembership] = useState<Record<string, string>>({});
  const lastMembershipKey = useRef<string>("");

  // PHASE 1: Listen to the "joinedGroups" Sub-collection
  useEffect(() => {
    if (!userData?.uid) return;

    const joinedRef = collection(
      clientDB,
      "users",
      userData.uid,
      "joinedGroups",
    );

    const unsubSub = onSnapshot(
      joinedRef,
      (snapshot) => {
        const newMembership: Record<string, string> = {};
        const groupIds: string[] = []; // Array for userStore

        snapshot.docs.forEach((doc) => {
          newMembership[doc.id] = doc.data().role || "member";
          groupIds.push(doc.id); // Collect IDs
        });

        // 1. Sync the raw IDs to the User Store immediately
        dispatch(setUserGroups(groupIds));

        // 2. Sync Check for Phase 2 (Internal State)
        const currentKey =
          Object.keys(newMembership).sort().join(",") +
          Object.values(newMembership).sort().join(",");

        if (currentKey !== lastMembershipKey.current) {
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

  // PHASE 2: Fetch Metadata (Unchanged logic, just ensure clear works)
  useEffect(() => {
    const groupIds = Object.keys(membership);

    if (groupIds.length === 0) {
      if (lastMembershipKey.current !== "") {
        dispatch(groupDataSuccess({}));
      }
      return;
    }

    dispatch(groupDataStart());

    const groupsQuery = query(
      collection(clientDB, "groups"),
      where(documentId(), "in", groupIds),
    );

    const unsubGroups = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const finalGroupMap: Record<string, any> = {};

        snapshot.docs.forEach((doc) => {
          finalGroupMap[doc.id] = {
            ...doc.data(),
            groupId: doc.id,
            role: membership[doc.id],
          };
        });

        dispatch(groupDataSuccess(finalGroupMap));
      },
      (error) => {
        dispatch(groupDataFailure(error.message));
      },
    );

    return () => unsubGroups();
  }, [membership, dispatch]);

  return null;
};
