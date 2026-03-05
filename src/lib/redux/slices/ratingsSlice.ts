import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchAllPlayersSeasonOverallRating,
  fetchMatchPlayerRatings,
  fetchPlayerRatingsAllMatches, // New Thunk Action
} from "../actions/ratingsActions";

// --- TYPES ---

interface RatingsState {
  byGroupId: {
    [groupId: string]: {
      matches: {
        [matchId: string]: {
          players: Record<string, any>;
          motm: any;
        };
      };
      players: {
        [playerId: string]: {
          seasonOverall: any;
          matches: Record<string, any>;
        };
      };
    };
  };
  loading: boolean;
  playerSeasonOverallRatingsLoading: boolean;
  playerAllMatchesRatingLoading: boolean;
  error: string | null;
}

const initialState: RatingsState = {
  byGroupId: {},
  loading: false,
  playerSeasonOverallRatingsLoading: false,
  playerAllMatchesRatingLoading: false,
  error: null,
};

// --- HELPER ---

const initGroupBucket = (state: RatingsState, groupId: string) => {
  if (!state.byGroupId[groupId]) {
    state.byGroupId[groupId] = { matches: {}, players: {} };
  }
  return state.byGroupId[groupId];
};

// --- SLICE ---

const ratingsSlice = createSlice({
  name: "ratings",
  initialState,
  reducers: {
    // 1. Update individual match players (from listeners)
    fetchMatchPlayerRatingsAction(
      state,
      action: PayloadAction<{ groupId: string; matchId: string; data: any }>,
    ) {
      const { groupId, matchId, data } = action.payload;
      const group = initGroupBucket(state, groupId);
      if (!group.matches[matchId])
        group.matches[matchId] = { players: {}, motm: {} };
      group.matches[matchId].players = data;
    },

    // 2. Update MOTM votes (from listeners)
    matchMotmVotesAction(
      state,
      action: PayloadAction<{ groupId: string; matchId: string; data: any }>,
    ) {
      const { groupId, matchId, data } = action.payload;
      const group = initGroupBucket(state, groupId);
      if (!group.matches[matchId])
        group.matches[matchId] = { players: {}, motm: {} };
      group.matches[matchId].motm = data;
    },

    // 3. Update Season Overall (Manual/Listener)
    fetchAllPlayersSeasonOverallRatingAction(
      state,
      action: PayloadAction<{ groupId: string; players: any }>,
    ) {
      const { groupId, players } = action.payload;
      const group = initGroupBucket(state, groupId);
      Object.entries(players).forEach(([playerId, playerData]) => {
        if (!group.players[playerId]) {
          group.players[playerId] = { seasonOverall: {}, matches: {} };
        }
        group.players[playerId].seasonOverall = playerData;
      });
      state.playerSeasonOverallRatingsLoading = false;
    },

    // 4. Update Match History for single player (Manual/Listener)
    fetchAllMatchRatingsForPlayerAction(
      state,
      action: PayloadAction<{
        groupId: string;
        playerId: string;
        matchesData: any;
      }>,
    ) {
      const { groupId, playerId, matchesData } = action.payload;
      const group = initGroupBucket(state, groupId);

      if (!group.players[playerId]) {
        group.players[playerId] = { seasonOverall: {}, matches: {} };
      }
      group.players[playerId].matches = matchesData;
      state.playerAllMatchesRatingLoading = false;
    },

    // --- STATUS HANDLERS ---
    fetchRatingsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchRatingsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.playerSeasonOverallRatingsLoading = false;
      state.playerAllMatchesRatingLoading = false;
      state.error = action.payload;
    },
    resetRatings: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // CASE: Fetch All Players Season Averages
      .addCase(fetchAllPlayersSeasonOverallRating.pending, (state) => {
        state.playerSeasonOverallRatingsLoading = true;
      })
      .addCase(
        fetchAllPlayersSeasonOverallRating.fulfilled,
        (state, action) => {
          const { groupId, players } = action.payload;
          const bucket = initGroupBucket(state, groupId);
          Object.entries(players).forEach(([playerId, playerData]) => {
            if (!bucket.players[playerId]) {
              bucket.players[playerId] = { seasonOverall: {}, matches: {} };
            }
            bucket.players[playerId].seasonOverall = playerData;
          });
          state.playerSeasonOverallRatingsLoading = false;
        },
      )

      // CASE: Fetch Ratings for a Specific Match
      .addCase(fetchMatchPlayerRatings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMatchPlayerRatings.fulfilled, (state, action) => {
        const { groupId, matchId, playerRatings, motmData } = action.payload;
        const bucket = initGroupBucket(state, groupId);
        bucket.matches[matchId] = { players: playerRatings, motm: motmData };
        state.loading = false;
      })
      .addCase(fetchMatchPlayerRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CASE: Fetch All Match Ratings for a specific Player Profile
      .addCase(fetchPlayerRatingsAllMatches.pending, (state) => {
        state.playerAllMatchesRatingLoading = true;
      })
      .addCase(fetchPlayerRatingsAllMatches.fulfilled, (state, action) => {
        if (!action.payload) return;
        const { groupId, playerId, matchesData } = action.payload;
        const bucket = initGroupBucket(state, groupId);
        if (!bucket.players[playerId]) {
          bucket.players[playerId] = { seasonOverall: {}, matches: {} };
        }
        bucket.players[playerId].matches = matchesData;
        state.playerAllMatchesRatingLoading = false;
      })
      .addCase(fetchPlayerRatingsAllMatches.rejected, (state, action) => {
        state.playerAllMatchesRatingLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  fetchRatingsStart,
  fetchRatingsFailure,
  fetchMatchPlayerRatingsAction,
  matchMotmVotesAction,
  fetchAllPlayersSeasonOverallRatingAction,
  fetchAllMatchRatingsForPlayerAction,
  resetRatings,
} = ratingsSlice.actions;

export default ratingsSlice.reducer;
