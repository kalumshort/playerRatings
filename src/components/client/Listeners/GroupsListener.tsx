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

export const GroupsListener = () => {
  const { userData } = useUserData();
  const dispatch = useDispatch();

  // Internal state: { [groupId]: role }
  const [membership, setMembership] = useState<Record<string, string>>({});
  const lastMembershipKey = useRef<string>("");

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
        // 1. Start with the "Official" League Groups from the User Doc
        const newMembership: Record<string, string> = {};

        if (userData.leagueTeams) {
          Object.values(userData.leagueTeams).forEach((groupId: any) => {
            if (groupId) newMembership[groupId] = "official";
          });
        }

        // 2. Overlay the "Private/Social" Groups from the Sub-collection
        snapshot.docs.forEach((doc) => {
          // If a user is in a private group that is also their official club,
          // the private role (owner/member) usually takes precedence for UI actions.
          newMembership[doc.id] = doc.data().role || "member";
        });

        // 3. Sync Check
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
  }, [userData?.uid, userData?.leagueTeams, dispatch]); // Added leagueTeams to dependencies

  // PHASE 2: Fetch metadata for the combined list
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
          const groupDocData = doc.data();

          finalGroupMap[doc.id] = {
            ...groupDocData,
            groupId: doc.id,
            role: membership[doc.id], // Will be 'official', 'owner', or 'member'
          };
        });

        console.log(
          `[GroupsListener] Synced ${Object.keys(finalGroupMap).length} total groups (Official + Private).`,
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

  return null;
};

export default GroupsListener;
