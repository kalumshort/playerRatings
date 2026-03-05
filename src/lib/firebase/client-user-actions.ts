import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { clientDB, functions } from "./client";
import { httpsCallable } from "firebase/functions";

/**
 * Update a specific field in the User document.
 * @param userId - The Firebase Auth UID
 * @param field - The key of the field to update (e.g., 'activeGroup')
 * @param newValue - The value to set
 */

interface TransferRequest {
  userData: {
    uid: string;
    email: string;
    displayName?: string;
  };
  newGroupId: string; // The team they are moving TO
  leagueKey: string; // e.g., 'premier-league'
  userId: string; // The UID of the user making the transfer
}
export const updateUserField = async <T>(
  userId: string | undefined,
  field: string,
  newValue: T,
): Promise<void> => {
  if (!userId || !field || newValue === undefined) {
    console.warn("Update skipped: Missing required parameters.");
    return;
  }

  try {
    const userRef = doc(clientDB, "users", userId);

    await updateDoc(userRef, {
      [field]: newValue,
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error updating user field "${field}":`, err.message);
    } else {
      console.error("An unknown error occurred during Firestore update.");
    }
    throw err; // Re-throw so the UI can handle the error (e.g., show a toast)
  }
};

export const updateLeagueTeam = async ({
  userData,
  groupId,
  leagueKey = "premier-league",
}: {
  userData: any;
  groupId: string;
  leagueKey?: string;
}) => {
  try {
    // 1. Guard Clause
    if (!userData?.uid || !groupId) {
      throw new Error("Missing tactical data: UserID or GroupID not found.");
    }

    // 2. Reference the COORDINATOR function (matches the exports.transferLeagueTeam in Cloud Functions)
    const transferLeagueTeam = httpsCallable<TransferRequest, any>(
      functions,
      "transferLeagueTeam",
    );

    // 3. Execute the call
    // Note: We send 'newGroupId' to match the parameter name in the Cloud Function logic
    const result = await transferLeagueTeam({
      newGroupId: String(groupId),
      userId: userData.uid,
      leagueKey: leagueKey,
      userData: {
        email: userData.email,
        displayName: userData.displayName || "Fan",
        uid: userData.uid,
      },
    });

    // 4. Return the data payload from the function
    return result.data;
  } catch (err: any) {
    console.error("🛠️ [Transfer Action] Failed:", err);

    return {
      success: false,
      message:
        err.message || "The transfer window is closed. Please try again.",
    };
  }
};
