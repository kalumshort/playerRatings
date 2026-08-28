import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CURRENT_SEASON } from "@/lib/config/season";

interface GlobalState {
  currentYear: string;
  isSidebarOpen: boolean;
}

const initialState: GlobalState = {
  currentYear: CURRENT_SEASON, // Overridden by DataInitializer when browsing an archived season
  isSidebarOpen: false,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setCurrentYear: (state, action: PayloadAction<string>) => {
      state.currentYear = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
  },
});

export const { setCurrentYear, toggleSidebar } = globalSlice.actions;
export default globalSlice.reducer;
