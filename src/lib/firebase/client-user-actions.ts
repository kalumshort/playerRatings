import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { clientDB, functions } from "./client";
import { httpsCallable } from "firebase/functions";
import { trackEvent } from "@/lib/analytics";

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
interface JoinGroupRequest {
  inviteCode: string;
}

/**
 * Interface for the Function response
 */
interface JoinGroupResponse {
  success: boolean;
  message: string;
  // Returned so the caller can name the group in a toast and route into it
  // without a second lookup. Absent on older deployments of the function.
  groupId?: string;
  groupName?: string;
  groupSlug?: string | null;
  role?: string;
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

    // The callable resolves for a refused transfer too (closed window, same
    // club), so the reported event is gated on the payload rather than on the
    // absence of a throw.
    if (result.data?.success !== false) {
      trackEvent("select_club", { group_id: groupId, league: leagueKey });
    }

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

export const joinGroupByCodeClient = async (
  data: JoinGroupRequest,
): Promise<JoinGroupResponse> => {
  try {
    const joinFunction = httpsCallable<JoinGroupRequest, JoinGroupResponse>(
      functions,
      "joinGroupByCode",
    );

    const result = await joinFunction(data);

    if (result.data?.success) {
      // The invite code itself is deliberately not sent: it is a credential.
      trackEvent("join_group", {
        group_id: result.data.groupId,
        method: "invite_code",
      });
    }

    return result.data;
  } catch (error: any) {
    console.error("Error in joinGroupByCodeClient:", error);
    // Propagate the specific Firebase HttpsError message to the UI
    throw new Error(error.message || "Failed to join group.");
  }
};
