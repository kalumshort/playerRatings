import { createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { clientDB } from "@/lib/firebase/client";

/**
 * Helper to convert Firestore Timestamps to ISO Strings for Redux serialization
 */
const sanitizeData = (data: any) => {
  const cleanData = { ...data };
  Object.keys(cleanData).forEach((key) => {
    const value = cleanData[key];
    if (value instanceof Timestamp) {
      cleanData[key] = value.toDate().toISOString();
    }
  });
  return cleanData;
};

export const userSeasonMatchesKey = (groupId: string, season: string) =>
  `${groupId}:${season}`;

/**
 * Every match the user has acted on this season, in one read.
 *
 * UsersMatchDataListener only ever fetches the match whose fixture page is
 * open, so `userData.matches` was empty everywhere else — which is why the
 * schedule couldn't tell you which games you'd already rated. This is a
 * one-shot collection read, not another listener: the schedule only needs
 * "have I done this yet", and the fixture page's listener still owns live
 * updates for the match you're actually looking at.
 *
 * Rules already allow it — users/{uid}/{allSubcollections=**} grants the owner
 * `read`, which covers `list`.
 */
export const fetchUserSeasonMatches = createAsyncThunk(
  "userData/fetchSeasonMatches",
  async (
    { groupId, season }: { groupId: string; season: string },
    { rejectWithValue },
  ) => {
    try {
      const user = getAuth().currentUser;
      if (!user) return { key: userSeasonMatchesKey(groupId, season), matches: {} };

      const snapshot = await getDocs(
        collection(
          clientDB,
          "users",
          user.uid,
          "groups",
          groupId,
          "seasons",
          season,
          "matches",
        ),
      );

      const matches: Record<string, any> = {};
      snapshot.forEach((doc) => {
        matches[doc.id] = sanitizeData(doc.data());
      });

      return { key: userSeasonMatchesKey(groupId, season), matches };
    } catch (error: any) {
      // A signed-out or non-member user just gets no badges; don't surface it.
      console.warn("[UserSeasonMatches] fetch failed:", error?.message);
      return rejectWithValue(error?.message);
    }
  },
);
