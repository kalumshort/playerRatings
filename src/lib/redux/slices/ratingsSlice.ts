import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchAllPlayersSeasonOverallRating,
  fetchMatchPlayerRatings,
  fetchPlayerRatingsAllMatches, // New Thunk Action
} from "../actions/ratingsActions";

// --- TYPES ---

export interface PlayerRatingEntry {
  id: string;
  totalRating?: number;
  totalSubmits?: number;
  [key: string]: any;
}

/**
 * Match ratings are always keyed by playerId.
 *
 * Three states, all distinguishable and all meaningful:
 *   undefined -> never fetched      (render a skeleton)
 *   {}        -> fetched, no votes  (render "—")
 *   populated -> data
 * So never substitute a shared empty object for `undefined`.
 */
export type PlayerRatingsMap = Record<string, PlayerRatingEntry>;

interface RatingsState {
  byGroupId: {
    [groupId: string]: {
      /** Season this bucket holds. Ratings are cleared when the user switches season. */
      season?: string;
      matches: {
        [matchId: string]: {
          players: PlayerRatingsMap;
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

// --- HELPERS ---

/**
 * Coerce match ratings into the keyed-by-playerId shape.
 *
 * Two writers feed this slot and they used to disagree: the admin SDK query
 * returns an array of { id, ...data }, while the client thunk returns an object
 * keyed by playerId. Consumers picked one shape each, so whichever wrote last
 * decided whether the ratings pitch rendered, showed "—", or threw
 * `matchRatings.find is not a function`.
 *
 * Normalising in the reducer makes this the single choke point — every current
 * and future writer lands in the same shape regardless of where it came from.
 * The `id` is stamped onto each entry so an entry stays self-describing when
 * passed down as a prop.
 */
export const normalizePlayerRatings = (data: unknown): PlayerRatingsMap => {
  if (!data || typeof data !== "object") return {};

  if (Array.isArray(data)) {
    return data.reduce<PlayerRatingsMap>((acc, entry: any) => {
      if (entry?.id == null) return acc;
      const id = String(entry.id);
      acc[id] = { ...entry, id };
      return acc;
    }, {});
  }

  return Object.entries(data as Record<string, any>).reduce<PlayerRatingsMap>(
    (acc, [key, entry]) => {
      if (!entry || typeof entry !== "object") return acc;
      acc[key] = { ...entry, id: String(key) };
      return acc;
    },
    {},
  );
};

// `season` is only passed by fetches that know which season they loaded. When it
// differs from what the bucket holds, the cached ratings belong to another season
// and must be dropped rather than merged. Listener reducers omit it and are no-ops here.
const initGroupBucket = (
  state: RatingsState,
  groupId: string,
  season?: string,
) => {
  const existing = state.byGroupId[groupId];

  if (!existing || (season && existing.season && existing.season !== season)) {
    state.byGroupId[groupId] = { matches: {}, players: {}, season };
  } else if (season) {
    existing.season = season;
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
      group.matches[matchId].players = normalizePlayerRatings(data);
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
          const { groupId, season, players } = action.payload;
          const bucket = initGroupBucket(state, groupId, season);
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
        const { groupId, season, matchId, playerRatings, motmData } =
          action.payload;
        const bucket = initGroupBucket(state, groupId, season);
        bucket.matches[matchId] = {
          players: normalizePlayerRatings(playerRatings),
          motm: motmData ?? null,
        };
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
        const { groupId, season, playerId, matchesData } = action.payload;
        const bucket = initGroupBucket(state, groupId, season);
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
