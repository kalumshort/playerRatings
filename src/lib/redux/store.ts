import { configureStore } from "@reduxjs/toolkit";
import groupReducer from "./slices/groupSlice";
import userReducer from "./slices/userDataSlice";
import fixturesReducer from "./slices/fixturesSlice";
// We'll create this next to handle things like currentYear
import globalReducer from "./slices/globalSlice";
import teamSquadsReducer from "./slices/squadSlice";
import predictionsReducer from "./slices/predictionsSlice";
import ratingsReducer from "./slices/ratingsSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      groupData: groupReducer,
      userData: userReducer,
      fixtures: fixturesReducer,
      globalData: globalReducer,
      teamSquads: teamSquadsReducer,
      predictions: predictionsReducer,
      playerRatings: ratingsReducer,
    },
    // Middleware is usually fine by default,
    // but we ensure serializableCheck is handled for Firebase.
    // immutableCheck is off for the same reason: it deep-scans the whole state
    // (a full season of fixtures, events and every rating) on every dispatch,
    // and a live match dispatches every minute. Both checks are dev-only —
    // RTK strips them in production — so this only affects dev ergonomics.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
