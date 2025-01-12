import { configureStore } from "@reduxjs/toolkit";

// Import reducers
import fixturesReducer from "./Reducers/fixturesReducer";
import squadDataReducer from "./Reducers/squadData";
import predictionsReducer from "./Reducers/predictionsReducer";

const store = configureStore({
  reducer: {
    fixtures: fixturesReducer,
    squadData: squadDataReducer,
    predictions: predictionsReducer,
  },
});

export default store;
