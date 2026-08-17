import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Group {
  id: string;
  groupId: string;
  name: string;
  slug: string;
  groupClubId: string;
  logoUrl?: string;
  headerImage?: string;
  visibility: "public" | "private";
  groupName?: string;
  league?: string;
  isPublic?: boolean;
  isGroupOpen?: boolean;
  groupType?: "club" | "group";
  /**
   * Club lifecycle, maintained by the nightly reconcile in updateFixtures.
   * "archived" means the club has left the league: no new fixtures or squads
   * will be written, so its pages are frozen at `lastActiveSeason` and go
   * read-only. Absent on community groups.
   */
  status?: "active" | "archived";
  lastActiveSeason?: string | null;
}

interface GroupState {
  byGroupId: { [key: string]: Group };
  activeGroupId: string | null; // <--- Ensure this is on its own line!
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

const initialState: GroupState = {
  byGroupId: {},
  activeGroupId: null, // Now this will be recognized
  loading: false,
  error: null,
  loaded: false,
};
const groupSlice = createSlice({
  name: "groupData",
  initialState,
  reducers: {
    groupDataStart(state) {
      state.loading = true;
      state.loaded = false;
      state.error = null;
    },
    groupDataFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
      state.loaded = true;
    },
    groupDataSuccess(state, action: PayloadAction<Record<string, Group>>) {
      state.loading = false;
      state.loaded = true;
      state.byGroupId = { ...state.byGroupId, ...action.payload };
    },
    updateGroupData(
      state,
      action: PayloadAction<{ groupId: string; data: Partial<Group> }>,
    ) {
      const { groupId, data } = action.payload;
      if (state.byGroupId[groupId]) {
        state.byGroupId[groupId] = { ...state.byGroupId[groupId], ...data };
      }
    },
    setActiveGroup: (state, action: PayloadAction<string | null>) => {
      state.activeGroupId = action.payload;
    },
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
