import "server-only";
import { adminDb } from "./admin";
import { Fixture } from "@/types/football";
import { cache } from "react";
import {
  ClubDirectory,
  EMPTY_CLUB_DIRECTORY,
  normaliseClubDirectory,
} from "@/lib/clubDirectory";
import { CURRENT_SEASON } from "@/lib/config/season";
import {
  EMPTY_SHOWCASE,
  HomepageShowcase,
  ShowcaseEvent,
  ShowcasePlayer,
} from "@/lib/homepageShowcase";

/**
 * Builds the directory straight from `groups`, for the window between deploying
 * this code and updateFixtures first writing config/clubDirectory. Without it
 * the club picker would render empty until the next 00:00 run. Server-only: the
 * client can't run this query, because the groups read rule calls get() on a
 * wildcard the list has no way to bind.
 */
async function buildClubDirectoryFromGroups(): Promise<ClubDirectory> {
  const snapshot = await adminDb
    .collection("groups")
    .where("league", "==", "premier-league")
    .get();

  return normaliseClubDirectory({
    season: CURRENT_SEASON,
    clubs: snapshot.docs
      .filter((doc) => /^\d+$/.test(doc.id) && doc.data().isPublic !== false)
      .map((doc) => ({ teamId: doc.id, ...doc.data() })),
  });
}

/**
 * The club list for the picker and the marketing homepage. One doc read,
 * rebuilt nightly by the updateFixtures Cloud Function. Wrapped in cache() so
 * a single render pays for it once.
 *
 * Never throws — a club picker that 500s is worse than one that comes up short.
 */
export const getClubDirectoryServer = cache(
  async (): Promise<ClubDirectory> => {
    try {
      const snapshot = await adminDb
        .collection("config")
        .doc("clubDirectory")
        .get();

      if (snapshot.exists) return normaliseClubDirectory(snapshot.data());

      return await buildClubDirectoryFromGroups();
    } catch (error) {
      console.error("❌ Club directory fetch failed:", error);
      return EMPTY_CLUB_DIRECTORY;
    }
  },
);

/** Event types the pulse chart draws a marker for. */
const SHOWCASE_EVENT_TYPES = ["Goal", "Card", "subst"];

/**
 * How many recent fixtures to consider. The most recent one is often a friendly
 * whose only events are substitutions, which makes for a dull pulse chart — so
 * look back a few and prefer one that actually has a goal in it.
 */
const SHOWCASE_FIXTURE_WINDOW = 6;

/**
 * "Player to watch" should look like a matchwinner. Squads come back in
 * GK-DEF-MID-FWD order, so taking the first three without this gives three
 * centre-backs.
 */
const SHOWCASE_POSITION_RANK: Record<string, number> = {
  Attacker: 0,
  Midfielder: 1,
  Defender: 2,
};

/**
 * Real entities for the marketing homepage demos: a real fixture for the
 * crests, its real goals and cards for the pulse chart, and real squad players
 * with photos.
 *
 * Prefers the most recently finished fixture over an upcoming one, because a
 * finished match is the only thing that carries a real `events` array.
 *
 * Both queries filter and order on `timestamp` alone, so neither needs a
 * composite index beyond the single-field ones Firestore creates automatically.
 *
 * Never throws and never partially fails — the homepage renders fully without
 * any of this, which is what happens on a cold season.
 */
export const getHomepageShowcase = cache(
  async (): Promise<HomepageShowcase> => {
    try {
      const fixturesRef = adminDb
        .collection("fixtures")
        .doc(CURRENT_SEASON)
        .collection("fixtures");

      const nowSeconds = Math.floor(Date.now() / 1000);

      // select() keeps the payload to the four fields used here. Fixture docs
      // also carry lineups and full match statistics, which would make reading
      // a window of them far heavier than it needs to be.
      const fields = ["teams", "events", "status", "timestamp"] as const;

      let snapshot = await fixturesRef
        .where("timestamp", "<", nowSeconds)
        .orderBy("timestamp", "desc")
        .limit(SHOWCASE_FIXTURE_WINDOW)
        .select(...fields)
        .get();

      if (snapshot.empty) {
        snapshot = await fixturesRef
          .where("timestamp", ">=", nowSeconds)
          .orderBy("timestamp", "asc")
          .limit(1)
          .select(...fields)
          .get();
      }

      if (snapshot.empty) return EMPTY_SHOWCASE;

      // Most goals wins. The docs arrive newest-first and the sort is stable,
      // so ties fall back to the most recent match.
      const goalCount = (candidate: any) =>
        (candidate.data().events || []).filter((e: any) => e?.type === "Goal")
          .length;

      const doc = [...snapshot.docs].sort(
        (a, b) => goalCount(b) - goalCount(a),
      )[0];
      const data = doc.data();
      const home = data.teams?.home;
      const away = data.teams?.away;

      if (!home?.id || !away?.id) return EMPTY_SHOWCASE;

      const logoFor = (id: number | string) =>
        `https://media.api-sports.io/football/teams/${id}.png`;

      // Goals and cards first, then subs fill any remaining slots — a straight
      // chronological slice gets swallowed by the wall of half-time
      // substitutions and the chart ends up showing no goals at all.
      const usableEvents = (data.events || []).filter(
        (event: any) =>
          event?.time?.elapsed != null &&
          SHOWCASE_EVENT_TYPES.includes(event.type),
      );

      const events: ShowcaseEvent[] = [
        ...usableEvents.filter((e: any) => e.type !== "subst"),
        ...usableEvents.filter((e: any) => e.type === "subst"),
      ]
        .slice(0, 8)
        .map((event: any) => ({
          time: { elapsed: event.time.elapsed, extra: event.time.extra ?? null },
          type: event.type,
          detail: event.detail ?? "",
          player: { name: event.player?.name ?? "" },
          assist: { name: event.assist?.name ?? "" },
        }))
        .sort((a, b) => a.time.elapsed - b.time.elapsed);

      const squadDoc = await adminDb
        .collection("teamSquads")
        .doc(String(home.id))
        .collection("season")
        .doc(CURRENT_SEASON)
        .get();

      const players: ShowcasePlayer[] = (squadDoc.data()?.activeSquad || [])
        .filter((player: any) => player?.id && player?.name)
        // Goalkeepers are never a plausible "player to watch" pick.
        .filter((player: any) => player.position !== "Goalkeeper")
        .sort(
          (a: any, b: any) =>
            (SHOWCASE_POSITION_RANK[a.position] ?? 3) -
            (SHOWCASE_POSITION_RANK[b.position] ?? 3),
        )
        .slice(0, 3)
        .map((player: any) => ({
          id: String(player.id),
          name: player.name,
          photo: player.photo || "",
        }));

      return {
        fixture: {
          matchId: doc.id,
          homeName: home.name || "",
          homeLogo: home.logo || logoFor(home.id),
          awayName: away.name || "",
          awayLogo: away.logo || logoFor(away.id),
        },
        players,
        events,
      };
    } catch (error) {
      console.error("❌ Homepage showcase fetch failed:", error);
      return EMPTY_SHOWCASE;
    }
  },
);

export async function getFixturesByClubServer(
  clubId: string,
  currentYear: string,
): Promise<Fixture[]> {
  try {
    const teamIdNumber = Number(clubId);

    const fixturesRef = adminDb
      .collection("fixtures")
      .doc(currentYear)
      .collection("fixtures");

    // ✅ Get Filter safely from the admin module
    const admin = await import("firebase-admin").then((m) => m.default ?? m);
    const Filter = admin.firestore.Filter;

    const snapshot = await fixturesRef
      .where(
        Filter.or(
          Filter.where("homeTeamId", "==", teamIdNumber),
          Filter.where("awayTeamId", "==", teamIdNumber),
        ),
      )
      .orderBy("timestamp", "desc")
      .get();

    return snapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Fixture,
      )
      .filter((fixture) => !["1371777", "1402829"].includes(fixture.id));
  } catch (error) {
    console.error("❌ Server Fetch Error:", error);
    return [];
  }
}
// cache()d because layout, page and generateMetadata all resolve the same slug
// within one render — and every season-aware route now needs the group's
// archived status before it can pick a season.
export const getGroupBySlugServer = cache(async (slug: string) => {
  try {
    const snapshot = await adminDb
      .collection("groups")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const groupDoc = snapshot.docs[0];
    const data = groupDoc.data();

    return {
      ...data,
      id: groupDoc.id,
      // 1. Convert Firestore Timestamps to ISO Strings
      updatedAt: data.updatedAt?.toDate()
        ? data.updatedAt.toDate().toISOString()
        : null,
      createdAt: data.createdAt?.toDate()
        ? data.createdAt.toDate().toISOString()
        : null,
      // Add any other specific date fields here...
    } as any;
  } catch (error) {
    console.error("❌ Error fetching group by slug:", error);
    return null;
  }
});

export async function getFixtureByIdServer(
  matchId: string,
  currentYear: string,
) {
  try {
    // Path: fixtures -> {year} -> fixtures -> {matchId}
    const fixtureRef = adminDb
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
    const memberDoc = await adminDb
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
 * Role-agnostic membership check.
 *
 * isGroupMemberServer() only looks at groupUsers/{id}/members, so it misses
 * admins and owners. users/{uid}/joinedGroups/{groupId} is written for every
 * role, and is the same doc joinGroupByCode tests before it rejects a re-join.
 */
export async function hasJoinedGroupServer(groupId: string, userId: string) {
  try {
    const membershipDoc = await adminDb
      .collection("users")
      .doc(userId)
      .collection("joinedGroups")
      .doc(String(groupId))
      .get();

    return membershipDoc.exists;
  } catch (error) {
    console.error("❌ [Admin] Error checking joined group:", error);
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
    const doc = await adminDb
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
    const baseRef = adminDb
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

    // Keyed by playerId, matching the client thunk and the shape the store
    // declares. This used to be an array, which meant the same Redux slot held
    // two incompatible shapes depending on which path filled it.
    const players: Record<string, any> = {};
    playersSnapshot.docs.forEach((doc) => {
      players[doc.id] = { id: doc.id, ...doc.data() };
    });

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
    return { players: {}, motm: null };
  }
}

export type InvitePreview =
  | {
      valid: true;
      code: string;
      groupId: string;
      groupName: string;
      groupLogo: string | null;
      groupSlug: string | null;
      role: string;
    }
  | { valid: false; reason: "invalid" | "expired" | "exhausted" };

/**
 * Reads an invite code for the /join/[code] preview.
 *
 * Rules deny every client read of groupInvites to non-owners, so a would-be
 * joiner can only see the group behind a code through the Admin SDK. The
 * validity checks mirror evaluateInvite() in functions/index.js — keep the two
 * in step, or the page will offer a Join button that redemption then refuses.
 *
 * A missing code and a deactivated one both return "invalid", so this can't be
 * used to enumerate which codes exist.
 */
export async function getInvitePreview(code: string): Promise<InvitePreview> {
  const normalised = String(code || "")
    .trim()
    .toUpperCase();

  if (!normalised) return { valid: false, reason: "invalid" };

  try {
    const inviteDoc = await adminDb
      .collection("groupInvites")
      .doc(normalised)
      .get();

    if (!inviteDoc.exists) return { valid: false, reason: "invalid" };

    const invite = inviteDoc.data() as any;

    if (invite.active === false) return { valid: false, reason: "invalid" };

    if (invite.expiresAt && invite.expiresAt.toMillis() <= Date.now()) {
      return { valid: false, reason: "expired" };
    }

    if (invite.maxUses != null && (invite.usageCount || 0) >= invite.maxUses) {
      return { valid: false, reason: "exhausted" };
    }

    // groupName/groupLogo/groupSlug are denormalised onto the invite, but codes
    // created before that fall back to the group doc rather than showing blanks.
    let { groupName, groupLogo, groupSlug } = invite;

    if (!groupName || !groupSlug) {
      const groupDoc = await adminDb
        .collection("groups")
        .doc(String(invite.groupId))
        .get();

      if (!groupDoc.exists) return { valid: false, reason: "invalid" };

      const group = groupDoc.data() as any;
      groupName = groupName || group.name || "a private group";
      groupLogo = groupLogo || group.logoUrl || null;
      groupSlug = groupSlug || group.slug || null;
    }

    return {
      valid: true,
      code: normalised,
      groupId: String(invite.groupId),
      groupName,
      groupLogo: groupLogo || null,
      groupSlug: groupSlug || null,
      role: invite.role || "member",
    };
  } catch (error) {
    console.error("❌ [Admin] Error reading invite:", error);
    return { valid: false, reason: "invalid" };
  }
}

export const getUserData = cache(async (userId: string) => {
  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) return null;

  const rawData = userDoc.data();
  // Return plain object to avoid serialization errors with Firestore Timestamps
  return JSON.parse(
    JSON.stringify({
      ...rawData,
      lastLogin: rawData?.lastLogin?.toMillis() || null,
      createdAt: rawData?.createdAt?.toMillis() || null,
    }),
  );
});
