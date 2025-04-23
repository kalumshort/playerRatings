import { createSlice } from "@reduxjs/toolkit";

const userDataSlice = createSlice({
  name: "userData",
  initialState: {
    loading: false,
    error: null,
    loaded: false,
    accountData: {},
    matches: {},
  },
  reducers: {
    fetchUserDataStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUserDataFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    fetchUserDataSuccess(state, action) {
      state.loading = false;
      state.loaded = true;
      state.accountData = action.payload;
    },
    clearUserData(state) {
      state.loading = false;
      state.error = null;
      state.loaded = false;
      state.accountData = {};
    },
    fetchUserMatchData(state, action) {
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
