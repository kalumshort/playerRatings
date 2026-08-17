import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchUserSeasonMatches } from "../actions/userActions";

interface UserDataState {
  loading: boolean;
  error: string | null;
  loaded: boolean;
  accountData: any; // We'll refine this as we see your Firestore User schema
  matches: Record<string, any>;
  /**
   * Which `${groupId}:${season}` has been bulk-loaded, so DataInitializer can
   * tell "not fetched yet" from "fetched and genuinely empty". Match ids are
   * unique across seasons, so `matches` itself stays a flat map.
   */
  matchesSeasonKey: string | null;
}

const initialState: UserDataState = {
  loading: false,
  error: null,
  loaded: false,
  accountData: {},
  matches: {},
  matchesSeasonKey: null,
};

const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    fetchUserDataStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUserDataFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    fetchUserDataSuccess(state, action: PayloadAction<any>) {
      state.loading = false;

      // MERGE instead of REPLACE
      state.accountData = {
        ...state.accountData, // Keep everything currently in Redux (like userGroups)
        ...action.payload, // Overwrite with new fields from Firestore
      };
    },
    setUserGroups: (state, action) => {
      if (state.accountData) {
        state.accountData.userGroups = action.payload; // action.payload is the string[]
      }
    },
    clearUserData(state) {
      state.loading = false;
      state.error = null;
      state.loaded = false;
      state.accountData = {};
      state.matches = {};
      state.matchesSeasonKey = null;
    },
    fetchUserMatchData(
      state,
      action: PayloadAction<{ matchId: string; data: any }>,
    ) {
      const { matchId, data } = action.payload;
      state.matches[matchId] = data;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserSeasonMatches.fulfilled, (state, action) => {
      // Merge, don't replace: the per-match listener may already have written a
      // fresher copy of the match currently on screen.
      state.matches = { ...action.payload.matches, ...state.matches };
      state.matchesSeasonKey = action.payload.key;
    });
  },
});

export const {
  fetchUserDataStart,
  fetchUserDataFailure,
  fetchUserDataSuccess,
  clearUserData,
  fetchUserMatchData,
  setUserGroups,
} = userDataSlice.actions;

export default userDataSlice.reducer;
