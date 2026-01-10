import { createSlice } from "@reduxjs/toolkit";

const fixturesSlice = createSlice({
  name: "fixtures",
  initialState: {
    byClubId: {}, // Structure: { "33": { "2025": [ ...fixtures ] } }
    loading: false,
    error: null,
  },
  reducers: {
    fetchFixturesStart(state) {
      state.loading = true;
      state.error = null;
    },

    fetchFixturesFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },

    // REPLACED: fixturesReducer -> fetchFixturesSuccess
    // We now expect payload: { clubId, year, fixtures }
    // This allows us to store multiple clubs' data simultaneously.
    fetchFixturesSuccess(state, action) {
      const { clubId, year, fixtures } = action.payload;

      if (!state.byClubId[clubId]) {
        state.byClubId[clubId] = {};
      }

      state.byClubId[clubId][year] = fixtures;
      state.loading = false;
    },

    // UPDATED: Single Fixture Update (from Listener)
    // Payload needs context: { clubId, year, id, data }
    fixtureReducer(state, action) {
      const { clubId, year, id, data } = action.payload;

      // Access the specific bucket for this club and year
      const clubFixtures = state.byClubId[clubId]?.[year];

      if (clubFixtures) {
        const index = clubFixtures.findIndex(
          (f) => String(f.id) === String(id)
        );
        if (index !== -1) {
          clubFixtures[index] = { ...clubFixtures[index], ...data };
        }
      }
    },
  },
});

export const {
  fetchFixturesStart,
  fetchFixturesSuccess,
  fetchFixturesFailure,
  fixtureReducer,
} = fixturesSlice.actions;

export default fixturesSlice.reducer;
