import { configureStore } from "@reduxjs/toolkit";

// Import reducers
import fixturesReducer from "./Reducers/fixturesReducer";
import predictionsReducer from "./Reducers/predictionsReducer";
import ratingsSlice from "./Reducers/playerRatingsReducer";
import teamSquadsSlice from "./Reducers/teamSquads";
import userDataSlice from "./Reducers/userDataReducer";
import groupSlice from "./Reducers/groupReducer";
import globalSlice from "./Reducers/globalReducer";

const store = configureStore({
  reducer: {
    fixtures: fixturesReducer,
    predictions: predictionsReducer,
    playerRatings: ratingsSlice,
    teamSquads: teamSquadsSlice,
    userData: userDataSlice,
    groupData: groupSlice,
    globalData: globalSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: { warnAfter: 128 }, // Increase threshold (default is 32ms)
      serializableCheck: { warnAfter: 128 }, // Increase threshold (default is 32ms)
    }),
});

export default store;
