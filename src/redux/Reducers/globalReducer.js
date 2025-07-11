import { createSlice } from "@reduxjs/toolkit";

const globalSlice = createSlice({
  name: "globalData",
  initialState: {
    currentYear: 2024,
  },
  reducers: {},
});

export const {} = globalSlice.actions;

export default globalSlice.reducer;
