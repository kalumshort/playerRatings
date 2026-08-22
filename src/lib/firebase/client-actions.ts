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
interface LiveStatParams {
  groupId: string;
  currentYear: string;
  matchId: string;
  timeElapsed: string | number;
  playerId: string;
  statKeys: string[]; // 'hot' | 'cold' | 'sub' | 'sub_req_{playerId}'
}
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

  return await runTransaction(clientDB, async (tx) => {
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

    return await runTransaction(clientDB, async (tx) => {
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

  return await runTransaction(clientDB, async (tx) => {
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

    return { success: true };
  } catch (error: any) {
    console.error("❌ Lineup Submission Error:", error);
    // Re-throw as-is: wrapping in new Error() discards error.code, which the
    // UI needs to tell "already submitted" apart from "connection dropped".
    throw error;
  }
};

export const handleLivePlayerStats = async (params: LiveStatParams) => {
  try {
    // Not validateParams(params): timeElapsed is legitimately 0 at kickoff and
    // the falsy check would reject it as missing.
    validateParams({
      groupId: params.groupId,
      currentYear: params.currentYear,
      matchId: params.matchId,
      playerId: params.playerId,
    });
    const { groupId, currentYear, matchId, timeElapsed, playerId, statKeys } =
      params;

    const docRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/livePlayerStats`,
      matchId,
    );

    // One merged payload for all keys. A sub vote writes both `sub` and
    // `sub_req_{id}`; issuing them as two sequential writes meant a failure
    // between them counted the sub without the target, corrupting sortedSubs.
    const perPlayer = statKeys.reduce<Record<string, any>>((acc, key) => {
      acc[key] = increment(1);
      return acc;
    }, {});

    const updatePayload = {
      [String(timeElapsed)]: { [playerId]: perPlayer },
      totals: { [playerId]: perPlayer },
    };

    await setDoc(docRef, updatePayload, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("❌ Live Player Stat Error:", error);
    throw error;
  }
};

export const handleFixtureMood = async (params: {
  groupId: string;
  currentYear: string;
  matchId: string;
  timeElapsed: number;
  moodKey: string;
}) => {
  const { groupId, currentYear, matchId, timeElapsed, moodKey } = params;
  validateParams({ groupId, currentYear, matchId, moodKey });

  const docRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/fixtureMoods`,
    matchId,
  );

  return await setDoc(
    docRef,
    { [String(timeElapsed || 0)]: { [moodKey]: increment(1) } },
    { merge: true },
  );
};

export const handleEventReaction = async (params: {
  groupId: string;
  currentYear: string;
  matchId: string;
  event: any; // The full event object
  moodKey: string;
  eventKey: string;
}) => {
  const { groupId, currentYear, matchId, event, moodKey, eventKey } = params;

  // 1. Create the unique identifier

  // 2. Reference the new path
  const docRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/eventsReactions`,
    matchId,
  );

  return await setDoc(
    docRef,
    {
      [eventKey]: {
        [moodKey]: increment(1),
      },
    },
    { merge: true },
  );
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
