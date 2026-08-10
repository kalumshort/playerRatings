const axios = require("axios");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// --- CONFIGURATION ---
const BASE_URL = "https://v3.football.api-sports.io";

// The season every function reads and writes. Bump this once per season.
const SEASON = 2026;
const LEAGUE_ID = 39; // Premier League

// Roles a user may hold in a group. Anything outside this list is rejected
// before it reaches a Firestore path, because `groupUsers/{groupId}/admins/{uid}`
// grants group write access via firestore.rules.
const VALID_ROLES = ["member", "admin", "owner"];

// Roles a user is allowed to grant themselves by joining. Admin/owner must come
// from an invite created by an existing owner.
const SELF_JOIN_ROLES = ["member"];

/**
 * Generic helper to fetch data from API-Football.
 * @param {string} endpoint - The endpoint path (e.g., "fixtures", "fixtures/statistics").
 * @param {object} params - Query parameters (e.g., { id: 123, fixture: 456 }).
 * @param {object} options - { allowEmpty } to return [] rather than throw on an empty response.
 */
const fetchFootballApi = async (endpoint, params = {}, options = {}) => {
  // Read at call time, not module load: secrets are only present in the
  // runtime environment of functions that declare them.
  const apiKey = process.env.FOOTBALL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "FOOTBALL_API_KEY is not set. Run: firebase functions:secrets:set FOOTBALL_API_KEY",
    );
  }

  try {
    const response = await axios.get(`${BASE_URL}/${endpoint}`, {
      headers: {
        "x-apisports-key": apiKey,
      },
      params: params, // Axios automatically serializes this to ?key=value
    });

    const data = response.data.response;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      if (options.allowEmpty) {
        return [];
      }
      throw new Error(
        `No data found for endpoint: ${endpoint} with params: ${JSON.stringify(
          params,
        )}`,
      );
    }

    return data;
  } catch (error) {
    // Enhance error logging to see API response details if available
    const msg = error.response?.data?.message || error.message;
    console.error(`API Error [${endpoint}]:`, msg);
    throw error;
  }
};

// --- SPECIFIC FETCH FUNCTIONS ---

/**
 * Fetches a single fixture. The `fixtures?id=` response already embeds
 * lineups, statistics and events, so no separate calls are needed.
 * @param {number|string} fixtureId - The API fixture id.
 */
const fetchFixtureData = async (fixtureId) => {
  const data = await fetchFootballApi("fixtures", { id: fixtureId });
  const fixtureObj = data[0];

  return {
    ...fixtureObj,
    matchDate: fixtureObj.fixture.timestamp,
  };
};

// --- AGGREGATION & FIRESTORE LOGIC ---

/**
 * Fetches a fixture and writes it to fixtures/{season}/fixtures/{fixtureId}.
 * Throws on failure so callers and the scheduler can see it.
 * @param {object} args - { fixtureId }.
 */
const fetchAllMatchData = async ({ fixtureId }) => {
  console.log(`Fetching all data for fixture: ${fixtureId}`);

  const fixtureData = await fetchFixtureData(fixtureId);

  // Safety Check: If the core fixture data is missing, we shouldn't save
  if (!fixtureData) {
    console.warn(
      `Skipping save for ${fixtureId} because core fixture data is missing.`,
    );
    return;
  }

  const year = fixtureData?.league?.season;

  if (!year) {
    throw new Error("League season not found in the fixture data.");
  }

  await getFirestore()
    .collection("fixtures")
    .doc(year.toString())
    .collection("fixtures")
    .doc(fixtureId.toString())
    .set(fixtureData, { merge: true });

  console.log(`Successfully saved available data for fixture ${fixtureId}`);
};

/**
 * Deletes a user's existing membership for a league, if they have one in a
 * different group. Must be called inside a transaction, after all reads.
 * @param {object} transaction - The active Firestore transaction.
 * @param {object} db - Firestore instance.
 * @param {string} uid - The user id.
 * @param {string} oldGroupId - The group being left.
 * @param {object} oldJoinedGroupDoc - Already-read snapshot of the old membership.
 */
const queueOldMembershipCleanup = (
  transaction,
  db,
  uid,
  oldGroupId,
  oldJoinedGroupDoc,
) => {
  if (!oldJoinedGroupDoc.exists) return;

  const { role: oldRole } = oldJoinedGroupDoc.data();
  const oldRoleCollection = VALID_ROLES.includes(oldRole)
    ? `${oldRole}s`
    : "members";

  const oldGlobalMemberRef = db
    .collection("groupUsers")
    .doc(String(oldGroupId))
    .collection(oldRoleCollection)
    .doc(String(uid));

  transaction.delete(oldGlobalMemberRef);
  transaction.delete(oldJoinedGroupDoc.ref);
};

const addMemberToGroup = async (db, groupId, uid, role = "member") => {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const groupRef = db.collection("groups").doc(String(groupId));
  const userRef = db.collection("users").doc(uid);

  // User's private record for UI and permission checks
  const userJoinedGroupRef = userRef
    .collection("joinedGroups")
    .doc(String(groupId));

  // Dynamic global collection based on role (members, admins, or owners)
  // This allows for path-based Firestore Security Rules
  const roleCollection = `${role}s`;

  const globalMemberRef = db
    .collection("groupUsers")
    .doc(String(groupId))
    .collection(roleCollection)
    .doc(String(uid));

  try {
    await db.runTransaction(async (transaction) => {
      // 1. READ: Fetch Group and User data
      const [groupDoc, userDoc] = await Promise.all([
        transaction.get(groupRef),
        transaction.get(userRef),
      ]);

      if (!groupDoc.exists) throw new Error("Group does not exist.");
      if (!userDoc.exists) throw new Error("User does not exist.");

      const groupData = groupDoc.data();
      const fullUserData = userDoc.data();
      const leagueKey = groupData.league;

      // 1b. READ: If they already hold a team in this league, we must clear it
      // out rather than just overwriting the pointer, which would leave an
      // orphaned doc in the old group's member list.
      const oldGroupId = leagueKey
        ? fullUserData?.leagueTeams?.[leagueKey]
        : null;
      let oldJoinedGroupDoc = null;

      if (oldGroupId && String(oldGroupId) !== String(groupId)) {
        oldJoinedGroupDoc = await transaction.get(
          userRef.collection("joinedGroups").doc(String(oldGroupId)),
        );
      }

      // 2. PREPARE: Global Data (Stored in groupUsers/{groupId}/{role}s/{uid})
      const globalMemberData = {
        uid: uid,
        email: fullUserData.email || "",
        displayName: fullUserData.displayName || fullUserData.name || "Fan",
        joinedAt: FieldValue.serverTimestamp(),
        // We keep the role string here for easy querying if needed later
        role: role,
      };

      // 3. PREPARE: Private Metadata (Stored in users/{uid}/joinedGroups/{groupId})
      const userGroupMetadata = {
        groupId: String(groupId),
        groupName: groupData.name || "Unknown Group",
        role: role,
        joinedAt: FieldValue.serverTimestamp(),
        leagueKey: leagueKey || null,
      };

      // 4. PREPARE: User Profile Updates
      const userUpdate = {
        activeGroup: String(groupId),
      };

      if (leagueKey) {
        userUpdate[`leagueTeams.${leagueKey}`] = String(groupId);
        userUpdate[`lastTransferDates.${leagueKey}`] =
          FieldValue.serverTimestamp();
      }

      // 5. WRITE: Execute all updates atomically
      // If any of these fail, none of them happen.
      if (oldJoinedGroupDoc) {
        queueOldMembershipCleanup(
          transaction,
          db,
          uid,
          oldGroupId,
          oldJoinedGroupDoc,
        );
      }

      transaction.set(globalMemberRef, globalMemberData);
      transaction.set(userJoinedGroupRef, userGroupMetadata);
      transaction.update(userRef, userUpdate);
    });

    return { success: true };
  } catch (error) {
    console.error("Transaction Join Error:", error);
    throw new Error(error.message || "Failed to join group.");
  }
};

const removeMemberFromGroup = async (db, groupId, uid) => {
  const userRef = db.collection("users").doc(uid);
  const userJoinedGroupRef = userRef
    .collection("joinedGroups")
    .doc(String(groupId));

  try {
    await db.runTransaction(async (transaction) => {
      // 1. READ: We must know the role and league before we can delete
      const userJoinedGroupDoc = await transaction.get(userJoinedGroupRef);

      if (!userJoinedGroupDoc.exists) {
        throw new Error("User record not found in this group.");
      }

      const { role, leagueKey } = userJoinedGroupDoc.data();

      // 2. REF: Construct the path to the global collection (members/admins/owners)
      // Fall back to "members" if the stored role is unrecognised, so we never
      // build a path from unvalidated data.
      const roleCollection = VALID_ROLES.includes(role) ? `${role}s` : "members";
      const globalMemberRef = db
        .collection("groupUsers")
        .doc(String(groupId))
        .collection(roleCollection)
        .doc(String(uid));

      // 3. PREPARE: User profile updates
      const userUpdate = {
        activeGroup: FieldValue.delete(), // Remove active status
      };

      // 11votes Logic: If this was their league-specific team, clear that slot
      if (leagueKey) {
        userUpdate[`leagueTeams.${leagueKey}`] = FieldValue.delete();
        // NOTE: We keep lastTransferDates.${leagueKey} as a "paper trail"
        // to prevent immediate re-joining/spamming.
      }

      // 4. WRITE: Atomic Cleanup
      transaction.delete(globalMemberRef); // Wipe from the global role list
      transaction.delete(userJoinedGroupRef); // Wipe from user's private list
      transaction.update(userRef, userUpdate); // Update the user document
    });

    return { success: true };
  } catch (error) {
    console.error("Transaction Removal Error:", error);
    throw new Error(error.message || "Failed to remove member safely.");
  }
};

module.exports = {
  SEASON,
  LEAGUE_ID,
  VALID_ROLES,
  SELF_JOIN_ROLES,
  fetchFootballApi,
  fetchFixtureData,
  fetchAllMatchData,
  addMemberToGroup,
  removeMemberFromGroup,
  queueOldMembershipCleanup,
};
