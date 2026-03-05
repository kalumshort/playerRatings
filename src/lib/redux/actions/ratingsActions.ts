import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientDB } from "@/lib/firebase/client";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";

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

export const fetchAllPlayersSeasonOverallRating = createAsyncThunk(
  "ratings/fetchAllSeasonOverall",
  async (
    { groupId, currentYear }: { groupId: string; currentYear: string },
    { rejectWithValue },
  ) => {
    try {
      const playersColRef = collection(
        clientDB,
        "groups",
        groupId,
        "seasons",
        currentYear,
        "players",
      );
      const querySnapshot = await getDocs(playersColRef);

      const sanitizedRatings: Record<string, any> = {};
      querySnapshot.forEach((doc) => {
        sanitizedRatings[doc.id] = sanitizeData({ ...doc.data(), id: doc.id });
      });

      return { groupId, players: sanitizedRatings };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMatchPlayerRatings = createAsyncThunk(
  "ratings/fetchMatchSpecific",
  async (
    {
      matchId,
      groupId,
      currentYear,
    }: { matchId: string; groupId: string; currentYear: string },
    { rejectWithValue },
  ) => {
    try {
      const mid = String(matchId);
      const playersColRef = collection(
        clientDB,
        "groups",
        groupId,
        "seasons",
        currentYear,
        "playerRatings",
        mid,
        "players",
      );
      const motmDocRef = doc(
        clientDB,
        "groups",
        groupId,
        "seasons",
        currentYear,
        "playerRatings",
        mid,
      );

      const [playersSnapshot, motmSnapshot] = await Promise.all([
        getDocs(playersColRef),
        getDoc(motmDocRef),
      ]);

      const playerRatings: Record<string, any> = {};
      playersSnapshot.forEach((doc) => {
        playerRatings[doc.id] = sanitizeData(doc.data());
      });

      return {
        groupId,
        matchId: mid,
        playerRatings,
        motmData: motmSnapshot.exists()
          ? sanitizeData(motmSnapshot.data())
          : null,
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Fetches all historical match ratings for a single specific player.
 * Path: groups/${groupId}/seasons/${currentYear}/players/${playerId}/matches
 */
export const fetchPlayerRatingsAllMatches = createAsyncThunk(
  "ratings/fetchPlayerAllMatches",
  async (
    {
      playerId,
      groupId,
      currentYear,
    }: { playerId: string; groupId: string; currentYear: string },
    { rejectWithValue },
  ) => {
    try {
      if (!playerId || !groupId) return;

      const matchesColRef = collection(
        clientDB,
        "groups",
        groupId,
        "seasons",
        currentYear,
        "players",
        playerId,
        "matches",
      );

      const querySnapshot = await getDocs(matchesColRef);

      const matchesData: Record<string, any> = {};
      querySnapshot.forEach((doc) => {
        // We use doc.id as the key (the matchId)
        matchesData[doc.id] = { id: doc.id, ...doc.data() };
      });

      return { groupId, playerId, matchesData };
    } catch (error: any) {
      console.error("Error getting player ratings:", error);
      return rejectWithValue(error.message);
    }
  },
);
