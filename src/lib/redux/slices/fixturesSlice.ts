"use client";

import { db } from "@/lib/firebase/client";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  collection,
  query,
  where,
  getDocs,
  or,
  orderBy,
} from "firebase/firestore";

// --- TYPES ---

interface FixturesState {
  byClubId: {
    [clubId: string]: {
      [year: string]: any[];
    };
  };
  loading: boolean;
  error: string | null;
}

const initialState: FixturesState = {
  byClubId: {},
  loading: false,
  error: null,
};

// --- ASYNC THUNKS ---

export const fetchFixtures = createAsyncThunk(
  "fixtures/fetchAll",
  async (
    { clubId, currentYear }: { clubId: string; currentYear: string },
    { rejectWithValue },
  ) => {
    try {
      const matchesRef = collection(db, "fixtures", currentYear, "fixtures");
      const teamIdNumber = Number(clubId);

      const q = query(
        matchesRef,
        or(
          where("homeTeamId", "==", teamIdNumber),
          where("awayTeamId", "==", teamIdNumber),
        ),
        orderBy("timestamp", "desc"),
      );

      const querySnapshot = await getDocs(q);

      const fixtures = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        // Filter out specific unwanted match IDs
        .filter(
          (fixture: any) =>
            !["1371777", "1402829"].includes(String(fixture.id)),
        );

      return { clubId, year: currentYear, fixtures };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// --- SLICE ---

const fixturesSlice = createSlice({
  name: "fixtures",
  initialState,
  reducers: {
    // 1. HYDRATION: Set fixtures from Server-Side props
    setInitialFixtures(
      state,
      action: PayloadAction<{ clubId: string; year: string; fixtures: any[] }>,
    ) {
      const { clubId, year, fixtures } = action.payload;
      if (!state.byClubId[clubId]) state.byClubId[clubId] = {};
      state.byClubId[clubId][year] = fixtures;
    },

    // 2. LISTENER UPDATE: Renamed from 'fixtureReducer'
    updateSingleFixture(
      state,
      action: PayloadAction<{
        clubId: string | number;
        year: string;
        id: string | number;
        data: any;
      }>,
    ) {
      const { clubId, year, id, data } = action.payload;
      const clubIdStr = String(clubId);
      const fixtureIdStr = String(id);

      console.log(`🔄 [Reducer] Processing update for Match ${fixtureIdStr}`);

      // 1. Ensure the nested structure exists so we don't fail silently
      if (!state.byClubId[clubIdStr]) {
        state.byClubId[clubIdStr] = {};
      }
      if (!state.byClubId[clubIdStr][year]) {
        state.byClubId[clubIdStr][year] = [];
      }

      const clubFixtures = state.byClubId[clubIdStr][year];

      // 2. Find the index
      const index = clubFixtures.findIndex(
        (f) => String(f.id) === fixtureIdStr,
      );

      if (index !== -1) {
        // 3. Update existing: Merge carefully
        // We update the array index directly to ensure Immer picks it up
        clubFixtures[index] = {
          ...clubFixtures[index],
          ...data,
          id: fixtureIdStr, // Keep ID consistent as a string
        };
        console.log(`✅ [Reducer] Updated existing fixture at index ${index}`);
      } else {
        // 4. Insert new: If it's a live match that wasn't in the initial list
        clubFixtures.push({
          ...data,
          id: fixtureIdStr,
        });
        console.log(`➕ [Reducer] Added new fixture to state`);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFixtures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFixtures.fulfilled, (state, action) => {
        const { clubId, year, fixtures } = action.payload;
        if (!state.byClubId[clubId]) state.byClubId[clubId] = {};
        state.byClubId[clubId][year] = fixtures;
        state.loading = false;
      })
      .addCase(fetchFixtures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addMatcher(
        (action) => action.type.includes("updateSingleFixture"),
        (state, action) => {
          console.log("🎯 MATCHED ACTION IN REDUCER:", action.type);
        },
      );
  },
});

export const { updateSingleFixture, setInitialFixtures } =
  fixturesSlice.actions;
export default fixturesSlice.reducer;
