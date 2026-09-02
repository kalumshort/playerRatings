import { clientDB, functions } from "./client";
import {
  doc,
  increment,
  runTransaction,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { updateOrSet, txUpdateOrSet } from "./utils";
import { httpsCallable } from "firebase/functions";
import { trackEvent } from "@/lib/analytics";
import { stanceDelta, type PlayerStance } from "@/lib/live/heat";

// --- Validation Helper ---
const validateParams = (params: Record<string, any>) => {
  const missing = Object.entries(params).filter(([_, value]) => !value);
  if (missing.length > 0) {
    throw new Error(
      `Missing required parameters: ${missing.map(([key]) => key).join(", ")}`,
    );
  }
};

interface VoteParams {
  groupId: string;
  currentYear: string;
  matchId: string;
  userId: string;
}
interface ScorePredictParams {
  groupId: string;
  currentYear: string;
  matchId: string;
  userId: string;
  score: string; // e.g., "2-1"
  homeGoals: number; // e.g., 2
  awayGoals: number; // e.g., 1
}
interface TeamSubmitParams {
  chosenTeam: Record<string, string>; // { "1": "player_id_123", ... }
  formation: string;
  matchId: string;
  groupId: string;
  userId: string;
  currentYear: string;
}
interface LiveVoteParams {
  groupId: string;
  currentYear: string;
  matchId: string;
  timeElapsed: string | number;
  playerId: string;
  /** The stance this fan now holds on this player. Replaces their previous one. */
  stance: PlayerStance;
  /** Required: a stance belongs to somebody. Guests cannot hold one. */
  userId: string;
  /** Set once this match's XP cap is reached, to stop paying for dead writes. */
  xpCapReached?: boolean;
}

/**
 * Records that this user took part, on their own per-match doc.
 *
 * Moods, live votes and event reactions write only to anonymous group
 * counters, so before this there was no per-user trace of them at all and
 * nothing for the XP engine to read.
 *
 * Fire-and-forget on purpose: these fire on a tap during a live match, and a
 * failed XP marker must never surface an error over an interaction that
 * actually succeeded. Missing markers are picked up by the nightly reconcile.
 *
 * The caller passes `skip` once the client-side count is past the XP cap —
 * mood taps are deliberately unlimited, and writes that can no longer earn
 * anything are pure cost.
 */
const recordParticipation = (
  params: {
    groupId: string;
    currentYear: string;
    matchId: string;
    userId?: string;
  },
  field: "moodTaps" | "liveVotes" | "reactions",
  skip = false,
) => {
  const { groupId, currentYear, matchId, userId } = params;
  if (!userId || skip) return;

  void updateOrSet(
    `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
    matchId,
    { [field]: increment(1) },
  ).catch(() => {
    /* see above — never surface over a successful interaction */
  });
};
interface RatingData {
  groupId: string;
  currentYear: string;
  matchId: string;
  playerId: string;
  userId: string;
  rating: number;
}

/**
 * The predictions doc has no dedup in firestore.rules (only touchesOnly), so
 * these writers are responsible for their own idempotency.
 *
 * Shape shared by the three below: read ONLY the user's own match doc inside
 * the transaction, then write the group aggregate with increment(±1) sentinels.
 * Reading the group doc would be the obvious move but is wrong — Firestore
 * transactions are optimistic, so every doc you read becomes a contention
 * point, and predictions/{matchId} is the hot doc at kickoff. The user's doc
 * has exactly one writer, so contention stays at zero. Cost is unchanged:
 * updateOrSet already did a getDoc.
 */
export const handlePredictWinningTeam = async ({
  groupId,
  currentYear,
  matchId,
  userId,
  choice,
}: VoteParams & { choice: "home" | "draw" | "away" }) => {
  validateParams({ groupId, currentYear, matchId, userId });

  const groupRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/predictions`,
    matchId,
  );
  const userRef = doc(
    clientDB,
    `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
    matchId,
  );

  const outcome = await runTransaction(clientDB, async (tx) => {
    const userSnap = await tx.get(userRef);
    const previous: "home" | "draw" | "away" | null =
      userSnap.exists() ? (userSnap.data()?.result ?? null) : null;

    // Re-running the same vote (a retry after a dropped connection) is a no-op.
    if (previous === choice) return { changed: false, previous };

    const result: Record<string, any> = { [choice]: increment(1) };
    if (previous) {
      // Moving a vote: the denominator doesn't change.
      result[previous] = increment(-1);
    } else {
      result.totalVotes = increment(1);
    }

    tx.set(groupRef, { result }, { merge: true });
    txUpdateOrSet(tx, userRef, userSnap, { result: choice });

    return { changed: true, previous };
  });

  // Only real votes are reported. `changed: false` is a retry of a vote we
  // already hold, and counting those would inflate every engagement number
  // against whoever has the flakiest connection.
  if (outcome.changed) {
    trackEvent("predict_winner", {
      match_id: matchId,
      group_id: groupId,
      choice,
      changed_vote: Boolean(outcome.previous),
    });
  }

  return outcome;
};

export const handlePredictTeamScore = async (params: ScorePredictParams) => {
  try {
    const {
      groupId,
      currentYear,
      matchId,
      userId,
      score,
      homeGoals,
      awayGoals,
    } = params;

    // Not validateParams(params): homeGoals/awayGoals are 0 for any clean
    // sheet, and the falsy check rejected them as missing — so every 1-0, 0-0
    // or 2-0 prediction threw before it reached Firestore.
    validateParams({ groupId, currentYear, matchId, userId, score });
    if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) {
      throw new Error("Score prediction requires numeric goal counts");
    }

    const groupPredRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/predictions`,
      matchId,
    );
    const userRef = doc(
      clientDB,
      `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
      matchId,
    );

    const outcome = await runTransaction(clientDB, async (tx) => {
      const userSnap = await tx.get(userRef);
      const previous: string | null = userSnap.exists()
        ? (userSnap.data()?.ScorePrediction ?? null)
        : null;

      if (previous === score) return { success: true, changed: false, previous };

      // Accumulate numeric deltas before converting to increment() sentinels.
      // "2-1" -> "2-0" keeps the same home score, so homeGoals[2] must net to
      // zero; assigning increment(1) then increment(-1) under the same key
      // would just overwrite and wrongly decrement.
      const homeDeltas: Record<string, number> = { [homeGoals]: 1 };
      const awayDeltas: Record<string, number> = { [awayGoals]: 1 };
      const scoreDeltas: Record<string, number> = { [score]: 1 };

      if (previous) {
        scoreDeltas[previous] = (scoreDeltas[previous] ?? 0) - 1;

        // A malformed or legacy value must skip the goal decrements rather
        // than write NaN into a counter — that would be unrecoverable.
        const [prevHome, prevAway] = String(previous).split("-").map(Number);
        if (Number.isFinite(prevHome) && Number.isFinite(prevAway)) {
          homeDeltas[prevHome] = (homeDeltas[prevHome] ?? 0) - 1;
          awayDeltas[prevAway] = (awayDeltas[prevAway] ?? 0) - 1;
        }
      }

      const toIncrements = (deltas: Record<string, number>) =>
        Object.entries(deltas).reduce<Record<string, any>>((acc, [k, v]) => {
          if (v !== 0) acc[k] = increment(v);
          return acc;
        }, {});

      const groupUpdate: Record<string, any> = {
        scorePredictions: toIncrements(scoreDeltas),
        homeGoals: toIncrements(homeDeltas),
        awayGoals: toIncrements(awayDeltas),
      };

      if (!previous) groupUpdate.totalScoreVotes = increment(1);

      tx.set(groupPredRef, groupUpdate, { merge: true });
      txUpdateOrSet(tx, userRef, userSnap, {
        ScorePrediction: score,
        predictionTimestamp: Date.now(),
      });

      return { success: true, changed: true, previous };
    });

    if (outcome.changed) {
      trackEvent("predict_score", {
        match_id: matchId,
        group_id: groupId,
        score,
        changed_vote: Boolean(outcome.previous),
      });
    }

    return outcome;
  } catch (error: any) {
    console.error("❌ Error submitting score prediction:", error);
    throw error;
  }
};

export const handlePredictPreMatchMotm = async (params: {
  matchId: string;
  playerId: string;
  groupId: string;
  userId: string;
  currentYear: string;
}) => {
  validateParams(params);
  const { matchId, playerId, groupId, userId, currentYear } = params;

  const groupRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/predictions`,
    matchId,
  );
  const userRef = doc(
    clientDB,
    `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
    matchId,
  );

  const outcome = await runTransaction(clientDB, async (tx) => {
    const userSnap = await tx.get(userRef);
    const previous: string | null = userSnap.exists()
      ? (userSnap.data()?.preMatchMotm ?? null)
      : null;

    if (previous === playerId) return { changed: false, previous };

    const groupUpdate: Record<string, any> = {
      preMatchMotm: { [playerId]: increment(1) },
    };

    if (previous) {
      groupUpdate.preMatchMotm[previous] = increment(-1);
    } else {
      groupUpdate.preMatchMotmVotes = increment(1);
    }

    tx.set(groupRef, groupUpdate, { merge: true });
    txUpdateOrSet(tx, userRef, userSnap, { preMatchMotm: playerId });

    return { changed: true, previous };
  });

  if (outcome.changed) {
    trackEvent("predict_motm", {
      match_id: matchId,
      group_id: groupId,
      player_id: playerId,
      changed_vote: Boolean(outcome.previous),
    });
  }

  return outcome;
};

export const handlePredictTeamSubmit = async (params: TeamSubmitParams) => {
  try {
    validateParams(params);
    const { chosenTeam, formation, matchId, groupId, userId, currentYear } =
      params;

    const predictionRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/predictions`,
      matchId,
    );

    const updates: any = {
      totalTeamSubmits: increment(1),
      formations: { [formation]: increment(1) },
      positionConsensus: {},
      totalPlayersSubmits: {},
    };

    Object.entries(chosenTeam).forEach(([slotId, playerId]) => {
      if (!playerId) return;
      if (!updates.positionConsensus[slotId])
        updates.positionConsensus[slotId] = {};
      updates.positionConsensus[slotId][playerId] = increment(1);
      updates.totalPlayersSubmits[playerId] = increment(1);
    });

    const userPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;

    await Promise.all([
      setDoc(predictionRef, updates, { merge: true }),
      updateOrSet(userPath, matchId, {
        chosenTeam,
        formation,
        teamSubmitted: true,
        submittedAt: Date.now(),
      }),
    ]);

    trackEvent("submit_lineup", {
      match_id: matchId,
      group_id: groupId,
      formation,
      players_picked: Object.values(chosenTeam).filter(Boolean).length,
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Lineup Submission Error:", error);
    // Re-throw as-is: wrapping in new Error() discards error.code, which the
    // UI needs to tell "already submitted" apart from "connection dropped".
    throw error;
  }
};

/**
 * Casts (or changes, or clears) this fan's stance on one player in a live match.
 *
 * The old `handleLivePlayerStats` was an anonymous `increment(1)` per tap, with
 * no record of who tapped. Fifty taps counted fifty times, so "hot" measured
 * enthusiasm for tapping rather than the crowd's opinion. A stance is held, not
 * accumulated: one per fan per player, changeable at any time.
 *
 * Shape follows the note above handlePredictWinningTeam. Read ONLY the user's
 * own voter doc inside the transaction, then write the group aggregate with
 * increment(±1) sentinels. Reading the aggregate is the obvious move and the
 * wrong one — every doc read inside an optimistic transaction becomes a
 * contention point, and this aggregate is the hottest doc on the page during a
 * live match. The voter doc has exactly one writer, so contention stays at zero.
 *
 * Four things move, and they have to move together — a re-tap that decremented
 * `subOut` but not `sub_req_{id}` would leave a suggestion list that outlives
 * the request behind it:
 *   1. voters/{userId}  — the new stance
 *   2. aggregate `live` — ±1 for the stance replaced and the one taken up
 *   3. aggregate `totals` + minute bucket — +1, append-only, for the Full Time
 *      story. History records that the fan felt this at this minute; changing
 *      your mind later does not un-feel it.
 *   4. voterCount       — +1, once, on the fan's first stance of the match
 */
export const castLivePlayerVote = async (params: LiveVoteParams) => {
  // Not validateParams(params): timeElapsed is legitimately 0 at kickoff and
  // the falsy check would reject it as missing.
  validateParams({
    groupId: params.groupId,
    currentYear: params.currentYear,
    matchId: params.matchId,
    playerId: params.playerId,
    userId: params.userId,
  });

  const {
    groupId,
    currentYear,
    matchId,
    timeElapsed,
    playerId,
    stance,
    userId,
  } = params;

  const base = `groups/${groupId}/seasons/${currentYear}/livePlayerStats`;
  const aggregateRef = doc(clientDB, base, matchId);
  const voterRef = doc(clientDB, base, matchId, "voters", userId);

  try {
    const changed = await runTransaction(clientDB, async (tx) => {
      const voterSnap = await tx.get(voterRef);
      const previous: PlayerStance | undefined =
        voterSnap.data()?.stances?.[playerId];

      const delta = stanceDelta(previous, stance);

      // A tap that lands on the stance already held is a no-op rather than a
      // wasted write. The UI models "tap the active button to clear", so this
      // only fires on a genuine double-submit.
      if (Object.keys(delta).length === 0) return false;

      const minute = String(timeElapsed ?? 0);
      const liveDelta: Record<string, any> = {};
      const historyDelta: Record<string, any> = {};

      Object.entries(delta).forEach(([key, by]) => {
        liveDelta[key] = increment(by);
        // History only ever counts up. `subOut` is named `sub` in the
        // append-only half — that key predates this feature and the Full Time
        // timeline reads matches that were played before it.
        if (by > 0) {
          const historyKey = key === "subOut" ? "sub" : key;
          historyDelta[historyKey] = increment(1);
        }
      });

      const isFirstStance = !voterSnap.exists();

      const aggregatePayload: Record<string, any> = {
        live: { [playerId]: liveDelta },
      };
      if (Object.keys(historyDelta).length > 0) {
        aggregatePayload.totals = { [playerId]: historyDelta };
        aggregatePayload[minute] = { [playerId]: historyDelta };
      }
      if (isFirstStance) aggregatePayload.voterCount = increment(1);

      tx.set(aggregateRef, aggregatePayload, { merge: true });

      txUpdateOrSet(tx, voterRef, voterSnap, {
        joinedAt: voterSnap.data()?.joinedAt ?? (Number(timeElapsed) || 0),
        stances: {
          [playerId]: {
            mood: stance.mood ?? null,
            moodMinute: stance.mood ? Number(timeElapsed) || 0 : null,
            subFor: stance.subFor ?? null,
            subMinute: stance.subFor ? Number(timeElapsed) || 0 : null,
          },
        },
      });

      return true;
    });

    // Only a real stance change is participation. A double-submit that wrote
    // nothing should not spend XP budget.
    if (changed) recordParticipation(params, "liveVotes", params.xpCapReached);
    return { success: true, changed };
  } catch (error: any) {
    console.error("❌ Live Player Vote Error:", error);
    throw error;
  }
};

export const handleFixtureMood = async (params: {
  groupId: string;
  currentYear: string;
  matchId: string;
  timeElapsed: number;
  moodKey: string;
  /** Optional: omitted for guests. Only used to record participation. */
  userId?: string;
  /** Set once this match's XP cap is reached, to stop paying for dead writes. */
  xpCapReached?: boolean;
}) => {
  const { groupId, currentYear, matchId, timeElapsed, moodKey } = params;
  validateParams({ groupId, currentYear, matchId, moodKey });

  const docRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/fixtureMoods`,
    matchId,
  );

  const result = await setDoc(
    docRef,
    { [String(timeElapsed || 0)]: { [moodKey]: increment(1) } },
    { merge: true },
  );

  recordParticipation(params, "moodTaps", params.xpCapReached);
  return result;
};

export const handleEventReaction = async (params: {
  groupId: string;
  currentYear: string;
  matchId: string;
  event: any; // The full event object
  moodKey: string;
  eventKey: string;
  /** Optional: omitted for guests. Only used to record participation. */
  userId?: string;
  /** Set once this match's XP cap is reached, to stop paying for dead writes. */
  xpCapReached?: boolean;
}) => {
  const { groupId, currentYear, matchId, event, moodKey, eventKey } = params;

  // 1. Create the unique identifier

  // 2. Reference the new path
  const docRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/eventsReactions`,
    matchId,
  );

  const result = await setDoc(
    docRef,
    {
      [eventKey]: {
        [moodKey]: increment(1),
      },
    },
    { merge: true },
  );

  recordParticipation(params, "reactions", params.xpCapReached);
  return result;
};

/**
 * One writeBatch, not two parallel writes.
 *
 * These two documents are a pair, and Promise.all let them diverge. If the
 * group aggregate landed but the user doc failed, `motmVote` stayed absent, so
 * notYetVotedMotm() in firestore.rules still passed and the same user could
 * vote again — a double-counted MOTM vote. The other order silently lost the
 * vote while still locking the user out. A batch commits or fails as a unit.
 *
 * Rules budget for this batch: playerRatings/{matchId} costs canWriteGroup
 * (<=3 exists) + notYetVotedMotm (1 get) = 4; the user doc is isOwner, = 0.
 * 4 of the 20 allowed per batched write.
 */
export const handleMatchMotmVote = async (params: {
  matchId: string;
  playerId: string;
  groupId: string;
  userId: string;
  currentYear: string;
}) => {
  validateParams(params);
  const { matchId, playerId, groupId, userId, currentYear } = params;

  const batch = writeBatch(clientDB);

  batch.set(
    doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/playerRatings`,
      matchId,
    ),
    {
      motmTotalVotes: increment(1),
      playerVotes: {
        [playerId]: increment(1),
      },
    },
    { merge: true },
  );

  // No createdAt stamp, matching how handlePlayerRatingSubmit writes this same
  // document — the per-player ratings always land first, so it already exists.
  batch.set(
    doc(
      clientDB,
      `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
      matchId,
    ),
    {
      motmVote: playerId,
      ratingsSubmitted: true,
    },
    { merge: true },
  );

  try {
    await batch.commit();

    trackEvent("vote_motm", {
      match_id: matchId,
      group_id: groupId,
      player_id: playerId,
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ MOTM Vote Batch Failed:", error);
    // Preserve error.code — rules dedupe repeat votes with permission-denied,
    // which the UI reports as "you've already submitted this".
    throw error;
  }
};

export const handlePlayerRatingSubmit = async (data: any) => {
  validateParams(data); // Ensures all required fields exist

  const batch = writeBatch(clientDB);
  const { groupId, currentYear, matchId, playerId, userId, rating } = data;

  const gId = String(groupId);
  const mId = String(matchId);
  const pId = String(playerId);
  const uId = String(userId);
  const year = String(currentYear);

  batch.set(
    doc(
      clientDB,
      `groups/${gId}/seasons/${year}/playerRatings/${mId}/players`,
      pId,
    ),
    {
      totalSubmits: increment(1),
      totalRating: increment(rating),
    },
    { merge: true },
  );

  batch.set(
    doc(clientDB, `users/${uId}/groups/${gId}/seasons/${year}/matches`, mId),
    {
      players: { [pId]: rating },
    },
    { merge: true },
  );

  batch.set(
    doc(clientDB, `groups/${gId}/seasons/${year}/players/${pId}/matches`, mId),
    {
      totalSubmits: increment(1),
      totalRating: increment(rating),
    },
    { merge: true },
  );

  batch.set(
    doc(clientDB, `groups/${gId}/seasons/${year}/players`, pId),
    {
      totalSubmits: increment(1),
      totalRating: increment(rating),
    },
    { merge: true },
  );

  try {
    await batch.commit();

    // One event per player, not per matchday card: a fan who rates four
    // players and abandons the rest is the thing worth being able to see, and
    // a single "ratings submitted" event would hide exactly that.
    trackEvent("rate_player", {
      match_id: mId,
      group_id: gId,
      player_id: pId,
      rating: Number(rating),
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Firestore Batch Failed:", error);
    // Preserve error.code — rules dedupe repeat ratings with permission-denied,
    // which the UI reports as "you've already submitted this".
    throw error;
  }
};

export const submitContactForm = async ({
  email,
  subject,
  message,
  userId = null,
}: {
  email: string;
  subject: string;
  message: string;
  userId?: string | null;
}) => {
  try {
    // No need to call getFunctions() here anymore, we use the exported one
    const submitFunction = httpsCallable(functions, "submitContactForm");

    const response = await submitFunction({
      email,
      subject,
      message,
      userId,
      timestamp: new Date().toISOString(),
    });

    return response.data as { success: boolean; message: string };
  } catch (error: any) {
    console.error("🛠️ [Firebase Action] submitContactForm Failed:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
};

export const handleAddUserToGroup = async ({
  userData,
  groupId,
}: {
  userData: any;
  groupId: string;
}) => {
  try {
    // 1. Guard: Ensure we have the required IDs
    if (!userData?.uid || !groupId) {
      throw new Error("Missing tactical data: UserID or GroupID not found.");
    }

    // 2. Reference the function using the pre-initialized 'functions' instance
    const addUserToGroup = httpsCallable(functions, "addUserToGroup");

    // 3. Execute call. Role is decided server-side — a client-supplied role
    // was an escalation path into groupUsers/{groupId}/admins/{uid}.
    await addUserToGroup({
      groupId: groupId,
    });

    trackEvent("join_group", { group_id: groupId, method: "direct" });

    return {
      success: true,
      message: "User successfully added to the group.",
    };
  } catch (err: any) {
    console.error("🛠️ [Firebase AuthAction] handleAddUserToGroup Failed:", err);

    return {
      success: false,
      message: err.message || "Failed to join the club hub. Try again.",
    };
  }
};
