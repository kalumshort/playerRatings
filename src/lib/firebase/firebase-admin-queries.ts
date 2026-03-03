import "server-only"; // Add this line!
import { Filter } from "firebase-admin/firestore";
import { getAdminDb } from "./admin";
import { Fixture } from "@/types/football";

export async function getFixturesByClubServer(
  clubId: string,
  currentYear: string,
) {
  try {
    const db = getAdminDb();
    const teamIdNumber = Number(clubId);

    // Exact same path as your Redux logic
    const fixturesRef = db
      .collection("fixtures")
      .doc(currentYear)
      .collection("fixtures");

    // Replicate: (homeTeamId == ID OR awayTeamId == ID)
    const snapshot = await fixturesRef
      .where(
        Filter.or(
          Filter.where("homeTeamId", "==", teamIdNumber),
          Filter.where("awayTeamId", "==", teamIdNumber),
        ),
      )
      .orderBy("timestamp", "desc")
      .get();

    return (
      snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Filter out those specific bugged fixture IDs
        .filter((fixture: any) => !["1371777", "1402829"].includes(fixture.id))
    );
  } catch (error) {
    console.error("❌ Server Fetch Error:", error);
    return [];
  }
}

export async function getGroupBySlugServer(slug: string) {
  try {
    const db = getAdminDb();

    // Query the groups collection for the matching slug
    const snapshot = await db
      .collection("groups")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const groupDoc = snapshot.docs[0];
    return {
      id: groupDoc.id,
      ...groupDoc.data(),
    } as any; // Replace 'any' with your Group interface
  } catch (error) {
    console.error("❌ Error fetching group by slug:", error);
    return null;
  }
}

export async function getFixtureByIdServer(
  matchId: string,
  currentYear: string,
) {
  try {
    const db = getAdminDb();

    // Path: fixtures -> {year} -> fixtures -> {matchId}
    const fixtureRef = db
      .collection("fixtures")
      .doc(currentYear)
      .collection("fixtures")
      .doc(matchId);

    const doc = await fixtureRef.get();

    if (!doc.exists) {
      console.warn(
        `[Admin] ⚠️ Fixture not found: ${matchId} for year ${currentYear}`,
      );
      return null;
    }

    // Return the data with the ID injected
    return { id: doc.id, ...doc.data() } as Fixture;
  } catch (error) {
    console.error("❌ [Admin] Error fetching fixture by ID:", error);
    // Returning null allows the Page Component to trigger notFound()
    return null;
  }
}
/**
 * Checks if a user is a member of a group by looking for their
 * document in the groupusers/{groupId}/members/{userId} sub-collection.
 */
export async function isGroupMemberServer(groupId: string, userId: string) {
  try {
    const db = getAdminDb();
    const memberDoc = await db
      .collection("groupUsers")
      .doc(groupId)
      .collection("members")
      .doc(userId)
      .get();

    return memberDoc.exists;
  } catch (error) {
    console.error("❌ [Admin] Error checking membership:", error);
    return false;
  }
}

/**
 * Server-side fetch for match predictions (Winner, Score, MOTM predictions)
 */
export async function getMatchPredictionsServer(
  groupId: string,
  matchId: string,
  currentYear: string,
) {
  try {
    const db = getAdminDb();
    // Path: groups/{groupId}/seasons/{year}/predictions/{matchId}
    const doc = await db
      .collection("groups")
      .doc(groupId)
      .collection("seasons")
      .doc(currentYear)
      .collection("predictions")
      .doc(matchId)
      .get();

    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error("❌ [Admin] Error fetching match predictions:", error);
    return null;
  }
}

/**
 * Server-side fetch for player ratings (Collection) and MOTM aggregate (Document)
 */
export async function getMatchPlayerRatingsServer(
  groupId: string,
  matchId: string,
  currentYear: string,
) {
  try {
    const db = getAdminDb();
    const baseRef = db
      .collection("groups")
      .doc(groupId)
      .collection("seasons")
      .doc(currentYear);

    // 1. Fetch the actual ratings for each player (The 'players' sub-collection)
    const playersSnapshot = await baseRef
      .collection("playerRatings")
      .doc(matchId)
      .collection("players")
      .get();

    const players = playersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Fetch the aggregate MOTM/Rating summary (The document at the matchId level)
    const motmDoc = await baseRef
      .collection("playerRatings")
      .doc(matchId)
      .get();

    return {
      players,
      motm: motmDoc.exists ? { id: motmDoc.id, ...motmDoc.data() } : null,
    };
  } catch (error) {
    console.error("❌ [Admin] Error fetching match player ratings:", error);
    return { players: [], motm: null };
  }
}
