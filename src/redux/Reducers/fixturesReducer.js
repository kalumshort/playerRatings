import { createSlice } from "@reduxjs/toolkit";

const fixturesSlice = createSlice({
  name: "fixtures",
  initialState: {
    fixtures: [],
    loading: false, // Added loading state
    error: null,
    loaded: false,
  },
  reducers: {
    fetchFixturesStart(state) {
      state.loading = true;
      state.error = null;
    },
    fixturesReducer(state, action) {
      state.fixtures = action.payload;
    },
    fixtureReducer(state, action) {
      const index = state.fixtures.findIndex(
        (fixture) => fixture.id === action.payload.id
      );
      if (index !== -1) {
        state.fixtures[index] = {
          ...state.fixtures[index],
          ...action.payload.data,
        };
      }
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
  fixturesReducer,
  fixtureReducer,
} = fixturesSlice.actions;

export default fixturesSlice.reducer;
