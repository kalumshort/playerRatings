import { clientDB, functions } from "./client";
import { doc, increment, setDoc, writeBatch } from "firebase/firestore";
import { updateOrSet } from "./utils";
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

export const handlePredictWinningTeam = async ({
  groupId,
  currentYear,
  matchId,
  userId,
  choice,
}: VoteParams & { choice: "home" | "draw" | "away" }) => {
  validateParams({ groupId, currentYear, matchId, userId });

  const groupPath = `groups/${groupId}/seasons/${currentYear}/predictions`;
  await setDoc(
    doc(clientDB, groupPath, matchId),
    {
      result: { [choice]: increment(1), totalVotes: increment(1) },
    },
    { merge: true },
  );

  const userPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;
  await updateOrSet(userPath, matchId, { result: choice });
};

export const handlePredictTeamScore = async (params: ScorePredictParams) => {
  try {
    validateParams(params);
    const {
      groupId,
      currentYear,
      matchId,
      userId,
      score,
      homeGoals,
      awayGoals,
    } = params;

    const groupPredRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/predictions`,
      matchId,
    );

    const groupUpdate = {
      scorePredictions: { [score]: increment(1) },
      homeGoals: { [homeGoals]: increment(1) },
      awayGoals: { [awayGoals]: increment(1) },
      totalScoreVotes: increment(1),
    };

    const userMatchPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;

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
    throw new Error(error.message);
  }
};

export const handleLivePlayerStats = async (params: LiveStatParams) => {
  try {
    validateParams(params);
    const { groupId, currentYear, matchId, timeElapsed, playerId, statKey } =
      params;

    const docRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/livePlayerStats`,
      matchId,
    );

    const updatePayload = {
      [String(timeElapsed)]: { [playerId]: { [statKey]: increment(1) } },
      totals: { [playerId]: { [statKey]: increment(1) } },
    };

    await setDoc(docRef, updatePayload, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("❌ Live Player Stat Error:", error);
    throw new Error(error.message);
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

export const handleMatchMotmVote = async (params: {
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
    `groups/${groupId}/seasons/${currentYear}/playerRatings`,
    matchId,
  );
  const userPath = `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`;

  await Promise.all([
    setDoc(
      groupRef,
      { motmVotes: { [playerId]: increment(1) } },
      { merge: true },
    ),
    updateOrSet(userPath, matchId, {
      motmVote: playerId,
      ratingsSubmitted: true,
    }),
  ]);
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
  leagueKey,
}: {
  userData: any;
  groupId: string;
  role?: string;
  leagueKey?: string;
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
      leagueKey: leagueKey,
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
