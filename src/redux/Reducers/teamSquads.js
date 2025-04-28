import { createSlice } from "@reduxjs/toolkit";

const teamSquadsSlice = createSlice({
  name: "teamSquads",
  initialState: {
    squads: {},
    loading: false,
    error: null,
    loaded: false,
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
    fetchTeamSquadSuccess(state) {
      state.loading = false;
      state.loaded = true;
    },
    fetchTeamSquadAction(state, action) {
      const { squadId, data } = action.payload;
      state.squads[squadId] = data;
    },
    clearTeamSquads(state) {
      state.squads = {}; // Clear all squads data
      state.loading = false; // Reset loading state
      state.error = null; // Reset error state
      state.loaded = false; // Reset loaded flag
    },
  },
});

export const {
  fetchTeamSquadStart,
  fetchTeamSquadFailure,
  fetchTeamSquadSuccess,
  fetchTeamSquadAction,
  clearTeamSquads, // Export the clearTeamSquads action
} = teamSquadsSlice.actions;

export default teamSquadsSlice.reducer;
