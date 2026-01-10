import { createSlice } from "@reduxjs/toolkit";

const teamSquadsSlice = createSlice({
  name: "teamSquads",
  initialState: {
    byClubId: {}, // Structure: { "33": { "2025": { activeSquad: [...], ... } } }
    loading: false,
    error: null,
  },
  reducers: {
    fetchTeamSquadStart(state) {
      state.loading = true;
      state.error = null;
    },

    fetchTeamSquadFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },

    // REFACTOR: Merged 'Action' and 'Success' into one.
    // Payload expectation: { clubId, year, data }
    fetchTeamSquadSuccess(state, action) {
      const { clubId, year, data } = action.payload;

      // 1. Create the club bucket if it doesn't exist
      if (!state.byClubId[clubId]) {
        state.byClubId[clubId] = {};
      }

      // 2. Store the data specifically for this year
      state.byClubId[clubId][year] = data;

      state.loading = false;
    },

    // Optional: Keeps the store clean if needed, but rarely used now
    clearTeamSquads(state) {
      state.byClubId = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  fetchTeamSquadStart,
  fetchTeamSquadFailure,
  fetchTeamSquadSuccess,
  clearTeamSquads,
} = teamSquadsSlice.actions;

export default teamSquadsSlice.reducer;
