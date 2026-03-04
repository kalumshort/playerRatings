"use client";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, Timestamp } from "firebase/firestore";

interface SquadState {
  byClubId: {
    [clubId: string]: {
      [year: string]: any; // Structure: { activeSquad: [...], seasonSquad: [...], lastUpdated: string }
    };
  };
  loading: boolean;
  error: string | null;
}

const initialState: SquadState = {
  byClubId: {},
  loading: false,
  error: null,
};

// --- MODERN ASYNC THUNK ---
export const fetchTeamSquad = createAsyncThunk(
  "teamSquads/fetchOne",
  async (
    { squadId, currentYear }: { squadId: string; currentYear: string },
    { rejectWithValue },
  ) => {
    if (!squadId || !currentYear) return rejectWithValue("Missing params");

    try {
      // Path: teamSquads/[squadId]/season/[year]
      const docRef = doc(
        db,
        "teamSquads",
        squadId,
        "season",
        currentYear.toString(),
      );
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const teamSquadData = { ...docSnap.data() };

      // 🛡️ YOUR SANITIZATION LOGIC
      if (teamSquadData.lastUpdated) {
        // Handle Firestore Timestamp conversion
        if (typeof teamSquadData.lastUpdated.toDate === "function") {
          teamSquadData.lastUpdated = teamSquadData.lastUpdated
            .toDate()
            .toISOString();
        } else if (teamSquadData.lastUpdated instanceof Timestamp) {
          teamSquadData.lastUpdated = teamSquadData.lastUpdated
            .toDate()
            .toISOString();
        }
      }

      return {
        clubId: squadId,
        year: currentYear.toString(),
        data: teamSquadData,
      };
    } catch (error: any) {
      console.error("Error fetching squad:", error);
      return rejectWithValue(error.message);
    }
  },
);

const teamSquadsSlice = createSlice({
  name: "teamSquads",
  initialState,
  reducers: {
    clearTeamSquads(state) {
      state.byClubId = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeamSquad.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamSquad.fulfilled, (state, action) => {
        if (!action.payload) {
          state.loading = false;
          return;
        }

        const { clubId, year, data } = action.payload;

        // 1. Create the club bucket if it doesn't exist
        if (!state.byClubId[clubId]) {
          state.byClubId[clubId] = {};
        }

        // 2. Store the data specifically for this year
        state.byClubId[clubId][year] = data;
        state.loading = false;
      })
      .addCase(fetchTeamSquad.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTeamSquads } = teamSquadsSlice.actions;
export default teamSquadsSlice.reducer;
