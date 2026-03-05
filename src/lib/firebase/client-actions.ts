import { clientDB, functions } from "./client";
import { doc, increment, setDoc, writeBatch } from "firebase/firestore";
import { updateOrSet } from "./utils";
import { httpsCallable } from "firebase/functions";

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
  statKey: string; // 'hot' | 'cold' | 'sub' | 'sub_req_{playerId}'
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
 * Handles the "Winner Consensus" vote (Home/Draw/Away)
 */
export const handlePredictWinningTeam = async ({
  groupId,
  currentYear,
  matchId,
  userId,
  choice,
}: VoteParams & { choice: "home" | "draw" | "away" }) => {
  // 1. Update Group Consensus
  const groupPath = `groups/${groupId}/seasons/${currentYear}/predictions`;
  await setDoc(
    doc(clientDB, groupPath, matchId),
    {
      result: { [choice]: increment(1), totalVotes: increment(1) },
    },
    { merge: true },
  );

  // 2. Update User's Personal Choice
  const userPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;
  await updateOrSet(userPath, matchId, { result: choice });
};

/**
 * Handles Live Player Ratings
 */

/**
 * Updates the group consensus for score predictions and records
 * the individual user's prediction.
 */
export const handlePredictTeamScore = async ({
  groupId,
  currentYear,
  matchId,
  userId,
  score,
  homeGoals,
  awayGoals,
}: ScorePredictParams) => {
  try {
    // 1. Update Group Consensus (Global Stats)
    // Path: groups/{groupId}/seasons/{year}/predictions/{matchId}
    const groupPredRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/predictions`,
      matchId,
    );

    const groupUpdate = {
      scorePredictions: { [score]: increment(1) },
      homeGoals: { [homeGoals]: increment(1) },
      awayGoals: { [awayGoals]: increment(1) },
      totalScoreVotes: increment(1), // Useful for calculating percentages later
    };

    // 2. Update User Personal Data
    // Path: users/{userId}/groups/{groupId}/seasons/{year}/matches/{matchId}
    const userMatchPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;

    // Execute both writes in parallel for speed
    await Promise.all([
      setDoc(groupPredRef, groupUpdate, { merge: true }),
      updateOrSet(userMatchPath, matchId, {
        ScorePrediction: score,
        predictionTimestamp: Date.now(),
      }),
    ]);

    return { success: true };
  } catch (error: any) {
    console.error("❌ Error submitting score prediction:", error);
    throw new Error(error.message);
  }
};
export const handlePredictPreMatchMotm = async ({
  matchId,
  playerId,
  groupId,
  userId,
  currentYear,
}: {
  matchId: string;
  playerId: string;
  groupId: string;
  userId: string;
  currentYear: string;
}) => {
  const groupRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/predictions`,
    matchId,
  );
  const userPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;

  await Promise.all([
    setDoc(
      groupRef,
      {
        preMatchMotm: { [playerId]: increment(1) },
        preMatchMotmVotes: increment(1),
      },
      { merge: true },
    ),
    updateOrSet(userPath, matchId, { preMatchMotm: playerId }),
  ]);
};

export const handlePredictTeamSubmit = async ({
  chosenTeam,
  formation,
  matchId,
  groupId,
  userId,
  currentYear,
}: TeamSubmitParams) => {
  try {
    const predictionRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/predictions`,
      matchId,
    );

    // 1. Build the Group Update Object
    // We use real nested objects to allow Firestore to perform deep merges.
    const updates: any = {
      totalTeamSubmits: increment(1),
      formations: {
        [formation]: increment(1),
      },
      positionConsensus: {},
      totalPlayersSubmits: {},
    };

    // 2. Loop through the 11 slots to populate increments
    Object.entries(chosenTeam).forEach(([slotId, playerId]) => {
      if (!playerId) return;

      // A. Position-specific count (e.g., How many people picked Player X for Slot 1?)
      if (!updates.positionConsensus[slotId]) {
        updates.positionConsensus[slotId] = {};
      }
      updates.positionConsensus[slotId][playerId] = increment(1);

      // B. Overall player count (e.g., How many people picked Player X regardless of slot?)
      updates.totalPlayersSubmits[playerId] = increment(1);
    });

    // 3. Perform the Writes
    const userPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;

    await Promise.all([
      // Update Group Analytics
      setDoc(predictionRef, updates, { merge: true }),

      // Update User Personal Prediction
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
    throw new Error(error.message);
  }
};
export const handleLivePlayerStats = async ({
  groupId,
  currentYear,
  matchId,
  timeElapsed,
  playerId,
  statKey,
}: LiveStatParams) => {
  try {
    // 1. Validation check
    if (!groupId || !matchId || !playerId || !statKey) {
      throw new Error("Missing required parameters for Live Player Stats");
    }

    const docRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/livePlayerStats`,
      matchId,
    );

    const timestampKey = String(timeElapsed);

    // 2. Atomic Update Object
    const updatePayload = {
      // Minute-by-minute breakdown (useful for "Heat Maps" later)
      [timestampKey]: {
        [playerId]: {
          [statKey]: increment(1),
        },
      },
      // Running totals for the current UI view
      totals: {
        [playerId]: {
          [statKey]: increment(1),
        },
      },
    };

    // 3. Fire-and-forget setDoc with merge
    await setDoc(docRef, updatePayload, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Live Player Stat Error:", error);
    throw new Error(error.message);
  }
};
export const handleFixtureMood = async ({
  groupId,
  currentYear,
  matchId,
  timeElapsed,
  moodKey,
}: {
  groupId: string;
  currentYear: string;
  matchId: string;
  timeElapsed: number;
  moodKey: string;
}) => {
  const docRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/fixtureMoods`,
    matchId,
  );
  const minute = String(timeElapsed || 0);

  return await setDoc(
    docRef,
    {
      [minute]: {
        [moodKey]: increment(1),
      },
    },
    { merge: true },
  );
};

export const handleMatchMotmVote = async ({
  matchId,
  playerId,
  groupId,
  userId,
  currentYear,
}: any) => {
  const groupRef = doc(
    clientDB,
    `groups/${groupId}/seasons/${currentYear}/playerRatings`,
    matchId,
  );
  const userPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;

  await Promise.all([
    // Increment the global MOTM tally
    setDoc(
      groupRef,
      { motmVotes: { [playerId]: increment(1) } },
      { merge: true },
    ),
    // Mark the user as having submitted everything
    updateOrSet(userPath, matchId, {
      motmVote: playerId,
      ratingsSubmitted: true,
    }),
  ]);
};

export const handlePlayerRatingSubmit = async (data: any) => {
  const batch = writeBatch(clientDB);

  // 1. Destructure and Guard
  const { groupId, currentYear, matchId, playerId, userId, rating } = data;

  if (!groupId || !matchId || !playerId || !userId) {
    console.error("❌ Missing required IDs for rating submission", data);
    return { success: false, message: "Missing required IDs" };
  }

  // 2. FORCE STRING CASTING (Prevents n.indexOf is not a function)
  const gId = String(groupId);
  const mId = String(matchId);
  const pId = String(playerId);
  const uId = String(userId);
  const year = String(currentYear);

  // 3. DEFINE REFERENCES

  // A. Match-specific stats for the group
  const matchPlayerRef = doc(
    clientDB,
    `groups/${gId}/seasons/${year}/playerRatings/${mId}/players`,
    pId,
  );

  // B. User's personal match history
  const userMatchRef = doc(
    clientDB,
    `users/${uId}/groups/${gId}/seasons/${year}/matches`,
    mId,
  );

  // C. Player's historical match performance
  const playerMatchRef = doc(
    clientDB,
    `groups/${gId}/seasons/${year}/players/${pId}/matches`,
    mId,
  );

  // D. Player's overall season leaderboard stats
  const playerSeasonRef = doc(
    clientDB,
    `groups/${gId}/seasons/${year}/players`,
    pId,
  );

  // 4. ADD TO BATCH
  batch.set(
    matchPlayerRef,
    {
      totalSubmits: increment(1),
      totalRating: increment(rating),
    },
    { merge: true },
  );

  batch.set(
    userMatchRef,
    {
      players: { [pId]: rating },
    },
    { merge: true },
  );

  batch.set(
    playerMatchRef,
    {
      totalSubmits: increment(1),
      totalRating: increment(rating),
    },
    { merge: true },
  );

  batch.set(
    playerSeasonRef,
    {
      totalSubmits: increment(1),
      totalRating: increment(rating),
    },
    { merge: true },
  );

  // 5. ATOMIC COMMIT
  try {
    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("❌ Firestore Batch Failed:", error);
    throw new Error(error.message);
  }
};

/**
 * Calls the 'submitContactForm' Firebase Cloud Function.
 * Logic: Sends user inquiry to Firestore and triggers an email notification.
 */
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
  role = "user",
}: {
  userData: any;
  groupId: string;
  role?: string;
}) => {
  try {
    // 1. Guard: Ensure we have the required IDs
    if (!userData?.uid || !groupId) {
      throw new Error("Missing tactical data: UserID or GroupID not found.");
    }

    // 2. Reference the function using the pre-initialized 'functions' instance
    const addUserToGroup = httpsCallable(functions, "addUserToGroup");

    // 3. Execute call
    await addUserToGroup({
      groupId: groupId,
      userId: userData.uid,
      userData: {
        email: userData.email,
        role: role,
        joinedAt: new Date().toISOString(),
      },
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
