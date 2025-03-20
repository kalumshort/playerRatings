import { createSlice } from "@reduxjs/toolkit";

const teamSquadsSlice = createSlice({
  name: "teamSquads",
  initialState: {},
  reducers: {
    fetchTeamSquadAction(state, action) {
      const { squadId, data } = action.payload;
      state[squadId] = data;
    },
  },
});

export const { fetchTeamSquadAction } = teamSquadsSlice.actions;

export default teamSquadsSlice.reducer;
