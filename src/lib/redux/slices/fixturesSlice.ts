"use client";

import { clientDB } from "@/lib/firebase/client";
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
  loaded: boolean;
  error: string | null;
}

const initialState: FixturesState = {
  byClubId: {},
  loading: false,
  loaded: false,
  error: null,
};

// --- ASYNC THUNKS ---

export const fetchFixtures = createAsyncThunk(
  "fixtures/fetchAll",
  async (
    { clubId, currentYear }: { clubId: string; currentYear: string },
    { rejectWithValue },
  ) => {
    if (!clubId || !currentYear) {
      console.error("[Fixtures Thunk] Aborted: clubId or currentYear missing", {
        clubId,
        currentYear,
      });
      return rejectWithValue("Invalid parameters provided to fetchFixtures");
    }

    try {
      const matchesRef = collection(
        clientDB,
        "fixtures",
        currentYear,
        "fixtures",
      );

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
        .filter(
          (fixture: any) =>
            !["1371777", "1402829"].includes(String(fixture.id)),
        );

      return { clubId, year: currentYear, fixtures };
    } catch (error: any) {
      console.error("[Fixtures Thunk] Firestore error:", error);
      return rejectWithValue(error.message);
    }
  },
);

// --- SLICE ---

const fixturesSlice = createSlice({
  name: "fixtures",
  initialState,
  reducers: {
    setInitialFixtures(
      state,
      action: PayloadAction<{ clubId: string; year: string; fixtures: any[] }>,
    ) {
      const { clubId, year, fixtures } = action.payload;
      if (!state.byClubId[clubId]) state.byClubId[clubId] = {};
      state.byClubId[clubId][year] = fixtures;
      state.loaded = true;
    },

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

      if (!state.byClubId[clubIdStr]) {
        state.byClubId[clubIdStr] = {};
      }
      if (!state.byClubId[clubIdStr][year]) {
        state.byClubId[clubIdStr][year] = [];
      }

      const clubFixtures = state.byClubId[clubIdStr][year];
      const index = clubFixtures.findIndex(
        (f) => String(f.id) === fixtureIdStr,
      );

      if (index !== -1) {
        clubFixtures[index] = {
          ...clubFixtures[index],
          ...data,
          id: fixtureIdStr,
        };
      } else {
        clubFixtures.push({
          ...data,
          id: fixtureIdStr,
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFixtures.pending, (state) => {
        state.loading = true;
        state.loaded = false;
        state.error = null;
      })
      .addCase(fetchFixtures.fulfilled, (state, action) => {
        const { clubId, year, fixtures } = action.payload;
        if (!state.byClubId[clubId]) state.byClubId[clubId] = {};
        state.byClubId[clubId][year] = fixtures;
        state.loading = false;
        state.loaded = true;
      })
      .addCase(fetchFixtures.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
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
