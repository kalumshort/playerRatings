const axios = require("axios");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// --- CONFIGURATION ---
const API_KEY = "7074e7d716eac4f8b67251541d144aba";
const BASE_URL = "https://v3.football.api-sports.io";

/**
 * Generic helper to fetch data from API-Football.
 * @param {string} endpoint - The endpoint path (e.g., "fixtures", "fixtures/statistics").
 * @param {object} params - Query parameters (e.g., { id: 123, fixture: 456 }).
 */
const fetchFootballApi = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/${endpoint}`, {
      headers: {
        "x-apisports-key": API_KEY, // Header specific to the direct URL
      },
      params: params, // Axios automatically serializes this to ?key=value
    });

    const data = response.data.response;

    if (!data || (Array.isArray(data) && data.length === 0)) {
      // Depending on strictness, you might want to log this but return empty,
      // or throw an error. Currently keeping your logic of throwing.
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

const fetchFixtureData = async (fixtureId) => {
  try {
    // Determine endpoint based on ID.
    // The API returns an array, we want the first item.
    const data = await fetchFootballApi("fixtures", { id: fixtureId });
    const fixtureObj = data[0];

    return {
      ...fixtureObj,
      matchDate: fixtureObj.fixture.timestamp,
    };
  } catch (error) {
    console.error(`Error in fetchFixtureData for ${fixtureId}:`, error.message);
    throw error;
  }
};

const fetchStatisticsData = async (fixtureId) => {
  try {
    return await fetchFootballApi("fixtures/statistics", {
      fixture: fixtureId,
    });
  } catch (error) {
    console.error(
      `Error in fetchStatisticsData for ${fixtureId}:`,
      error.message,
    );
    throw error;
  }
};

const fetchEventsData = async (fixtureId) => {
  try {
    return await fetchFootballApi("fixtures/events", { fixture: fixtureId });
  } catch (error) {
    console.error(`Error in fetchEventsData for ${fixtureId}:`, error.message);
    throw error;
  }
};

const fetchLineupData = async (fixtureId) => {
  try {
    return await fetchFootballApi("fixtures/lineups", { fixture: fixtureId });
  } catch (error) {
    console.error(`Error in fetchLineupData for ${fixtureId}:`, error.message);
    throw error;
  }
};

// --- AGGREGATION & FIRESTORE LOGIC ---

const fetchAllMatchData = async ({ fixtureId }) => {
  console.log(`Fetching all data for fixture: ${fixtureId}`);
  try {
    // Wrap each call in a catch to ensure one failure doesn't kill the whole process
    const [
      fixtureData,
      // fixtureStatsData,
      // fixtureLineupData,
      // fixtureEventsData,
    ] = await Promise.all([
      fetchFixtureData(fixtureId).catch((err) => {
        console.error(`Fixture basic data failed: ${err.message}`);
        return null;
      }),
      // fetchStatisticsData(fixtureId).catch((err) => {
      //   console.error(`Stats failed: ${err.message}`);
      //   return [];
      // }),
      // fetchLineupData(fixtureId).catch((err) => {
      //   console.error(`Lineups failed: ${err.message}`);
      //   return [];
      // }),
      // fetchEventsData(fixtureId).catch((err) => {
      //   console.error(`Events failed: ${err.message}`);
      //   return [];
      // }),
    ]);

    // Safety Check: If the core fixture data is missing, we probably shouldn't save
    if (!fixtureData) {
      console.warn(
        `Skipping save for ${fixtureId} because core fixture data is missing.`,
      );
      return;
    }

    const combinedFixtureData = {
      ...fixtureData,
      // statistics: fixtureStatsData || [],
      // lineups: fixtureLineupData || [],
      // events: fixtureEventsData || [],
    };

    const year = combinedFixtureData?.league?.season;

    if (!year) {
      throw new Error("League season not found in the fixture data.");
    }

    await getFirestore()
      .collection("fixtures")
      .doc(year.toString())
      .collection("fixtures")
      .doc(fixtureId.toString())
      .set(combinedFixtureData, { merge: true });

    console.log(`Successfully saved available data for fixture ${fixtureId}`);
  } catch (error) {
    console.error(
      `Critical error in fetchAllMatchData for ${fixtureId}:`,
      error.message,
    );
  }
};

const checkTeamsLatestFixture = async (teamId) => {
  const now = Math.floor(Date.now() / 1000);
  console.log(`Checking latest fixture for team: ${teamId}`);
  try {
    // Query the next match
    // Note: Ensure your Firestore path `fixtures/2025/${teamId}` is correct for your DB structure
    const matchesRef = getFirestore().collection(`fixtures/2025/${teamId}`);

    const nextFixture = await matchesRef
      .where("matchDate", ">=", now)
      .orderBy("matchDate", "asc")
      .limit(1)
      .get();

    const lastFixture = await matchesRef
      .where("matchDate", "<=", now)
      .orderBy("matchDate", "desc")
      .limit(1)
      .get();

    if (nextFixture.empty || lastFixture.empty) {
      console.log("Fixture was empty (Next or Last fixture missing)");
      return;
    }

    const nextFixtureData = nextFixture.docs[0].data();
    const lastFixtureData = lastFixture.docs[0].data();

    let latestFixture = null;
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Logic: If the last match was over 24h ago, look at the next match.
    // Otherwise, stick to the last match.
    if (lastFixtureData.matchDate * 1000 < twentyFourHoursAgo) {
      latestFixture = nextFixtureData;
    } else {
      latestFixture = lastFixtureData;
    }

    const matchStartingTimestamp = latestFixture?.fixture?.timestamp;
    const latestFixtureId = latestFixture?.fixture?.id;

    if (!latestFixtureId) {
      console.error("Error: No latest Fixture Id");
      return;
    }

    // Calculate the difference in seconds
    const timeDifference = Math.abs(now - matchStartingTimestamp);

    // Check if within 1 hour OR match is currently active
    if (timeDifference <= 3600) {
      console.log("The timestamp is within an hour of the starting time.");
      await fetchAllMatchData({ fixtureId: latestFixtureId, teamId: teamId });
    } else if (
      latestFixture.fixture.status.long !== "Match Finished" &&
      latestFixture.fixture.status.long !== "Not Started"
    ) {
      console.log("Match Inplay.");
      await fetchAllMatchData({ fixtureId: latestFixtureId, teamId: teamId });
    } else {
      console.log("Match is not within 1 hour and is not in play");
    }

    console.log("Successful");
  } catch (error) {
    console.error("Error checking team latest fixture:", error);
  }
};

const addMemberToGroup = async (db, groupId, uid, role = "member") => {
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
      const roleCollection = `${role}s`;
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
  fetchFootballApi, // Exported so you can use it elsewhere
  fetchFixtureData,
  fetchStatisticsData,
  fetchLineupData,
  fetchEventsData,
  fetchAllMatchData,
  checkTeamsLatestFixture,
  addMemberToGroup,
  removeMemberFromGroup,
};
