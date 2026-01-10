import { createSlice } from "@reduxjs/toolkit";

const groupSlice = createSlice({
  name: "groupData",
  initialState: {
    byGroupId: {}, // Replaces 'data'. Structure: { "group_A": { ... }, "group_B": { ... } }
    activeGroupId: null, // Replaces 'activeGroup'. The ID of the group the user is currently VIEWING.
    loading: false,
    error: null,
    loaded: false,
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
    // UPDATED: Now merges new groups instead of wiping the state
    groupDataSuccess(state, action) {
      state.loading = false;
      state.loaded = true;
      // Shallow merge: keep existing groups, add/overwrite with new ones
      state.byGroupId = { ...state.byGroupId, ...action.payload };
    },
    // UPDATED: Updates a specific group's data without touching others
    updateGroupData(state, action) {
      const { groupId, data } = action.payload;
      if (state.byGroupId[groupId]) {
        state.byGroupId[groupId] = { ...state.byGroupId[groupId], ...data };
      }
    },
    // UPDATED: Standardized naming
    setActiveGroup: (state, action) => {
      state.activeGroupId = action.payload;
    },
    // Optional: clears everything if user logs out
    clearGroupData(state) {
      state.byGroupId = {};
      state.activeGroupId = null;
      state.loaded = false;
    },
  },
});

export const {
  groupDataStart,
  groupDataFailure,
  groupDataSuccess,
  updateGroupData,
  setActiveGroup,
  clearGroupData,
} = groupSlice.actions;

export default groupSlice.reducer;
