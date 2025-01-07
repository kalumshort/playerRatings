import { createSlice } from "@reduxjs/toolkit";

const fixturesSlice = createSlice({
  name: "fixtures",
  initialState: {
    previousFixtures: [],
    upcomingFixtures: [],
    latestFixture: null,
    loading: false, // Added loading state
    error: null,
    loaded: false,
  },
  reducers: {
    fetchFixturesStart(state) {
      state.loading = true;
      state.error = null;
    },
    previousFixturesReducer(state, action) {
      state.previousFixtures = action.payload;
    },
    upcomingFixturesReducer(state, action) {
      state.upcomingFixtures = action.payload;
    },
    latestFixtureReducer(state, action) {
      state.latestFixture = action.payload;
    },
    fetchFixturesFailure(state, action) {
      state.error = action.payload;
      state.loading = false; // Set loading to false on failure
    },
    fetchFixturesSuccess(state) {
      state.loading = false; // Set loading to false on success
      state.loaded = true;
    },
  },
});

export const {
  fetchFixturesStart,
  fetchFixturesSuccess,
  fetchFixturesFailure,
  previousFixturesReducer,
  upcomingFixturesReducer,
  latestFixtureReducer,
} = fixturesSlice.actions;

export default fixturesSlice.reducer;
