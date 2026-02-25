import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

// --- TYPES ---
interface PredictionsState {
  byGroupId: {
    [groupId: string]: {
      [matchId: string]: any;
    };
  };
  loading: boolean;
  error: string | null;
}

const initialState: PredictionsState = {
  byGroupId: {},
  loading: false,
  error: null,
};

// --- ASYNC THUNK ---
export const fetchMatchPredictionData = createAsyncThunk(
  "predictions/fetchMatch",
  async (
    {
      groupId,
      matchId,
      currentYear,
    }: { groupId: string; matchId: string; currentYear: string },
    { rejectWithValue },
  ) => {
    try {
      const docRef = doc(
        db,
        "groups",
        groupId,
        "seasons",
        currentYear,
        "predictions",
        matchId,
      );
      const docSnap = await getDoc(docRef);
      return {
        groupId,
        matchId,
        data: docSnap.exists() ? docSnap.data() : {},
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// --- SLICE ---
const predictionsSlice = createSlice({
  name: "predictions",
  initialState,
  reducers: {
    /**
     * UPDATED: Unified action for Listener sync and Manual hydration.
     * We'll keep the name you used in the listener for compatibility.
     */
    fetchMatchPrediction(
      state,
      action: PayloadAction<{ groupId: string; matchId: string; data: any }>,
    ) {
      const { groupId, matchId, data } = action.payload;

      if (!state.byGroupId[groupId]) {
        state.byGroupId[groupId] = {};
      }

      // If data is null/undefined from a snapshot, we default to empty object
      state.byGroupId[groupId][matchId] = data || {};
      state.loading = false;
      state.error = null;
    },

    // Standard Status Handlers
    fetchPredictionsStart(state) {
      state.loading = true;
      state.error = null;
    },
    resetPredictions: (state) => {
      state.byGroupId = {};
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatchPredictionData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMatchPredictionData.fulfilled, (state, action) => {
        const { groupId, matchId, data } = action.payload;
        if (!state.byGroupId[groupId]) {
          state.byGroupId[groupId] = {};
        }
        state.byGroupId[groupId][matchId] = data;
        state.loading = false;
      })
      .addCase(fetchMatchPredictionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  fetchMatchPrediction, // Use this for your Listener!
  fetchPredictionsStart,
  resetPredictions,
} = predictionsSlice.actions;

export default predictionsSlice.reducer;
