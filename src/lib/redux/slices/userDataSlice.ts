import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserDataState {
  loading: boolean;
  error: string | null;
  loaded: boolean;
  accountData: any; // We'll refine this as we see your Firestore User schema
  matches: Record<string, any>;
}

const initialState: UserDataState = {
  loading: false,
  error: null,
  loaded: false,
  accountData: {},
  matches: {},
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
      state.loaded = true;
      state.accountData = action.payload;
    },
    clearUserData(state) {
      state.loading = false;
      state.error = null;
      state.loaded = false;
      state.accountData = {};
      state.matches = {};
    },
    fetchUserMatchData(
      state,
      action: PayloadAction<{ matchId: string; data: any }>,
    ) {
      const { matchId, data } = action.payload;
      state.matches[matchId] = data;
    },
  },
});

export const {
  fetchUserDataStart,
  fetchUserDataFailure,
  fetchUserDataSuccess,
  clearUserData,
  fetchUserMatchData,
} = userDataSlice.actions;

export default userDataSlice.reducer;
