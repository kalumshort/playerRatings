import "server-only";
import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { CURRENT_SEASON } from "@/lib/config/season";

/**
 * Reads for the gamification surfaces.
 *
 * Both collections are written only by Cloud Functions (see
 * functions/gamification/) and are world-readable, so these could run on the
 * client too — but reading them server-side keeps the leaderboard in the
 * initial HTML, which matters because it is a page a fan lands on directly.
 *
 * Display names are already redacted at write time: an opted-out user's row
 * carries `displayName: null`, so nothing here has to defend their identity.
 */

export interface LeaderboardEntry {
  uid: string;
  /** Null when the user opted out of appearing by name. */
  displayName: string | null;
  xp: number;
  matchesParticipated: number;
  /** The separate accuracy ladder. Never summed into `xp`. */
  predictionPoints: number;
  predictionsResolved: number;
  /** 1-based, assigned after ordering. */
  rank: number;
}

export interface UserProgress {
  uid: string;
  totalXp: number;
  seasonXp: number;
  matchesParticipated: number;
  predictionPoints: number;
  predictionsResolved: number;
}

const EMPTY_PROGRESS: UserProgress = {
  uid: "",
  totalXp: 0,
  seasonXp: 0,
  matchesParticipated: 0,
  predictionPoints: 0,
  predictionsResolved: 0,
};

const toEntry = (doc: FirebaseFirestore.QueryDocumentSnapshot, i: number) => {
  const data = doc.data();
  return {
    uid: String(data.uid || doc.id),
    displayName: data.displayName ?? null,
    xp: Number(data.xp) || 0,
    matchesParticipated: Number(data.matchesParticipated) || 0,
    predictionPoints: Number(data.predictionPoints) || 0,
    predictionsResolved: Number(data.predictionsResolved) || 0,
    rank: i + 1,
  };
};

/**
 * Top fans of one club for a season.
 *
 * Needs the (season, groupId, xp desc) composite index in
 * firestore.indexes.json — without it this throws a FAILED_PRECONDITION with a
 * console link rather than returning empty, which is the usual first symptom of
 * a missed index deploy.
 */
export const getClubLeaderboard = cache(
  async (
    groupId: string,
    limit = 50,
    season: string = CURRENT_SEASON,
  ): Promise<LeaderboardEntry[]> => {
    try {
      const snapshot = await adminDb
        .collection("userSeasonProgress")
        .where("season", "==", season)
        .where("groupId", "==", String(groupId))
        .orderBy("xp", "desc")
        .limit(limit)
        .get();

      // A row exists from the moment someone joins, so filter the zeroes —
      // a leaderboard of people who have done nothing is noise.
      return snapshot.docs
        .map(toEntry)
        .filter((entry) => entry.xp > 0)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));
    } catch (error) {
      console.error("❌ Club leaderboard read failed:", error);
      return [];
    }
  },
);

/**
 * The accuracy board: same club, ranked by prediction points instead of XP.
 *
 * A separate query rather than re-sorting the XP board in memory, because the
 * top predictors are frequently not the top participants — that separation is
 * the entire reason the two ladders exist.
 *
 * Needs the (season, groupId, predictionPoints desc) composite index.
 */
export const getPredictorLeaderboard = cache(
  async (
    groupId: string,
    limit = 50,
    season: string = CURRENT_SEASON,
  ): Promise<LeaderboardEntry[]> => {
    try {
      const snapshot = await adminDb
        .collection("userSeasonProgress")
        .where("season", "==", season)
        .where("groupId", "==", String(groupId))
        .orderBy("predictionPoints", "desc")
        .limit(limit)
        .get();

      return snapshot.docs
        .map(toEntry)
        .filter((entry) => entry.predictionPoints > 0)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));
    } catch (error) {
      console.error("❌ Predictor leaderboard read failed:", error);
      return [];
    }
  },
);

/**
 * Where a fan sits on their club's board, and how many they're up against.
 *
 * A count aggregation rather than reading the rows: a fan outside the top 50
 * still has a rank, and paging the whole board to find them would be absurd.
 * Uses the same (season, groupId, xp) index the leaderboard query needs.
 *
 * Ties resolve optimistically — two fans on identical XP both read as the
 * higher rank, which is the friendlier of the two lies.
 */
export const getUserRank = cache(
  async (
    groupId: string,
    xp: number,
    season: string = CURRENT_SEASON,
  ): Promise<{ rank: number; total: number } | null> => {
    if (!groupId || xp <= 0) return null;

    try {
      const base = adminDb
        .collection("userSeasonProgress")
        .where("season", "==", season)
        .where("groupId", "==", String(groupId));

      const [ahead, total] = await Promise.all([
        base.where("xp", ">", xp).count().get(),
        base.where("xp", ">", 0).count().get(),
      ]);

      return {
        rank: ahead.data().count + 1,
        total: total.data().count,
      };
    } catch (error) {
      // A missing index surfaces here; the page drops the rank line rather
      // than failing, since the board itself is the point.
      console.error("❌ Rank read failed:", error);
      return null;
    }
  },
);

/**
 * One user's own progress: all-time XP plus this season at their club.
 *
 * Never throws — the profile page renders a zeroed panel rather than an error
 * for a user who has not participated yet, which is also the state of every
 * account before the first nightly reconcile runs.
 */
export const getUserProgress = cache(
  async (
    uid: string,
    groupId?: string | null,
    season: string = CURRENT_SEASON,
  ): Promise<UserProgress> => {
    if (!uid) return EMPTY_PROGRESS;

    try {
      const [progressSnap, rowSnap] = await Promise.all([
        adminDb.collection("userProgress").doc(uid).get(),
        groupId
          ? adminDb
              .collection("userSeasonProgress")
              .doc(`${season}_${groupId}_${uid}`)
              .get()
          : Promise.resolve(null),
      ]);

      const row = rowSnap?.data();

      return {
        uid,
        totalXp: Number(progressSnap.data()?.totalXp) || 0,
        seasonXp: Number(row?.xp) || 0,
        matchesParticipated: Number(row?.matchesParticipated) || 0,
        predictionPoints: Number(row?.predictionPoints) || 0,
        predictionsResolved: Number(row?.predictionsResolved) || 0,
      };
    } catch (error) {
      console.error("❌ User progress read failed:", error);
      return { ...EMPTY_PROGRESS, uid };
    }
  },
);
