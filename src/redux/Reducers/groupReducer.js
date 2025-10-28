import { createSlice } from "@reduxjs/toolkit";

const groupSlice = createSlice({
  name: "groupData",
  initialState: {
    loading: false,
    error: null,
    loaded: false,
    data: {},
  },
  reducers: {
    groupDataStart(state) {
      state.loading = true;
      state.loaded = false;
      state.error = null;
    },
    groupDataFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
      state.loaded = true;
    },
    groupDataSuccess(state, action) {
      state.loading = false;
      state.loaded = true;
      state.data = action.payload;
    },
    clearGroupIdData(state) {
      state.loading = false;
      state.error = null;
      state.loaded = false;
      state.data = {};
    },
    updateGroupData(state, action) {
      const { groupId, data } = action.payload;
      state.data[groupId] = { ...state.data[groupId], ...data };
    },
  },
});

export const {
  groupDataStart,
  groupDataFailure,
  groupDataSuccess,
  clearGroupIdData,
  updateGroupData,
} = groupSlice.actions;

export default groupSlice.reducer;
