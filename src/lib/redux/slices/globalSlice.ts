import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GlobalState {
  currentYear: string;
  isSidebarOpen: boolean;
}

const initialState: GlobalState = {
  currentYear: "2025", // Default starting year
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
