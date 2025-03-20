import { configureStore } from "@reduxjs/toolkit";

// Import reducers
import fixturesReducer from "./Reducers/fixturesReducer";
import squadDataReducer from "./Reducers/squadData";
import predictionsReducer from "./Reducers/predictionsReducer";
import ratingsSlice from "./Reducers/playerRatingsReducer";
import playerStatsSlice from "./Reducers/playersReducer";
import teamSquadsSlice from "./Reducers/teamSquads";

const store = configureStore({
  reducer: {
    fixtures: fixturesReducer,
    squadData: squadDataReducer,
    predictions: predictionsReducer,
    ratings: ratingsSlice,
    playerStats: playerStatsSlice,
    teamSquads: teamSquadsSlice,
  },
});

export default store;
