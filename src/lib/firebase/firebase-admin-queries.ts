import "server-only";
import { adminDb } from "./admin";
import { Fixture } from "@/types/football";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  ClubDirectory,
  EMPTY_CLUB_DIRECTORY,
  normaliseClubDirectory,
} from "@/lib/clubDirectory";
import { CURRENT_SEASON } from "@/lib/config/season";
import {
  EMPTY_SHOWCASE,
  FEATURE_CLUBS,
  HomepageShowcase,
  ShowcaseClub,
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
 * How many recent fixtures to scan for the feature clubs.
 *
 * One query, filtered in memory, rather than a per-club query: a
 * `where(homeTeamId).orderBy(timestamp)` would need a composite index, and
 * five of them would need five. This window has to be wide enough that each of
 * the five clubs appears in it — they play weekly, so ~120 recent fixtures
 * across all competitions comfortably covers a month.
 */
const SHOWCASE_FIXTURE_WINDOW = 120;

/**
 * How many players to keep per position, per club.
 *
 * Must be a per-position quota, not a flat `slice(0, n)`. activeSquad comes
 * back in GK-DEF-MID-FWD order, so a flat slice of a 30-man squad kept the
 * keepers and defenders and cut every striker — which then made the
 * attacker-first panels lead with fringe midfielders.
 *
 * Totals ~22: enough to fill an XI in any of the 19 formations with slack,
 * without shipping five full squads in the server-rendered payload.
 */
const SHOWCASE_POSITION_QUOTA: Record<string, number> = {
  Goalkeeper: 2,
  Defender: 7,
  Midfielder: 8,
  Attacker: 5,
};

/** How long the showcase is cached for. See getHomepageShowcase. */
const SHOWCASE_TTL_SECONDS = 3600;

const logoFor = (id: number | string) =>
  `https://media.api-sports.io/football/teams/${id}.png`;

/** Goals and cards, then subs — see buildEvents. */
const goalCount = (data: any) =>
  (data?.events || []).filter((e: any) => e?.type === "Goal").length;

/**
 * Goals and cards first, then subs fill any remaining slots — a straight
 * chronological slice gets swallowed by the wall of half-time substitutions
 * and the chart ends up showing no goals at all.
 */
function buildEvents(data: any): ShowcaseEvent[] {
  const usable = (data?.events || []).filter(
    (event: any) =>
      event?.time?.elapsed != null && SHOWCASE_EVENT_TYPES.includes(event.type),
  );

  return [
    ...usable.filter((e: any) => e.type !== "subst"),
    ...usable.filter((e: any) => e.type === "subst"),
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
}

const toShowcasePlayer = (player: any): ShowcasePlayer => ({
  id: String(player.id),
  name: player.name,
  photo: player.photo || "",
  position: player.position || "",
});

/**
 * Byte size of API-Football's "no headshot" placeholder.
 *
 * The CDN answers 200 with this grey silhouette for any real player id it has
 * no photo for, so a failed <img> load can't be used to detect it — only the
 * size can. Verified fixed at 5192 bytes across eight unrelated player ids
 * (a genuinely non-existent id 404s instead, so this never mislabels one).
 *
 * If the CDN ever reskins the placeholder this stops matching, and the only
 * consequence is that photo-less players stop being demoted — the panels keep
 * working. Failing that way round is deliberate.
 */
const PLACEHOLDER_PHOTO_BYTES = 5192;

/** How long to wait on the CDN before giving up on a photo check. */
const PHOTO_CHECK_TIMEOUT_MS = 3000;

/**
 * Memo across requests within a server instance. Player photos essentially
 * never change, and this keeps a cache miss on the showcase from re-checking
 * faces it has already seen.
 */
const photoCheckCache = new Map<string, boolean>();

/**
 * Marks which players actually have a headshot.
 *
 * Runs inside the cached loader, so this costs one round of HEAD requests per
 * hour rather than per page view. Fails open: any network error leaves the
 * player unmarked, which `outfieldHighlights` treats as usable — a possibly
 * grey avatar beats dropping a real player over a flaky request.
 */
async function verifyPhotos(players: ShowcasePlayer[]): Promise<void> {
  await Promise.all(
    players.map(async (player) => {
      if (!player.photo) {
        player.hasPhoto = false;
        return;
      }

      const cached = photoCheckCache.get(player.photo);
      if (cached !== undefined) {
        player.hasPhoto = cached;
        return;
      }

      try {
        const response = await fetch(player.photo, {
          method: "HEAD",
          signal: AbortSignal.timeout(PHOTO_CHECK_TIMEOUT_MS),
        });

        const bytes = Number(response.headers.get("content-length"));
        const ok =
          response.ok && bytes > 0 && bytes !== PLACEHOLDER_PHOTO_BYTES;

        photoCheckCache.set(player.photo, ok);
        player.hasPhoto = ok;
      } catch {
        // Leave unmarked — see the fail-open note above.
      }
    }),
  );
}

/**
 * A positionally balanced slice of a squad, keeping the source order within
 * each position so the first-choice players come first.
 *
 * Players whose position isn't one of the four known values are kept up to the
 * midfielder quota — free-text positions do occur, and dropping them silently
 * would thin out a squad for no visible reason.
 */
function pickSquad(activeSquad: any[]): ShowcasePlayer[] {
  const taken: Record<string, number> = {};
  const picked: ShowcasePlayer[] = [];

  for (const player of activeSquad) {
    if (!player?.id || !player?.name) continue;

    const position = player.position || "Midfielder";
    const quota = SHOWCASE_POSITION_QUOTA[position] ?? 2;

    if ((taken[position] ?? 0) >= quota) continue;
    taken[position] = (taken[position] ?? 0) + 1;
    picked.push(toShowcasePlayer(player));
  }

  return picked;
}

/**
 * Real entities for the marketing homepage demos, one club per feature row.
 *
 * Each of the five clubs in FEATURE_CLUBS gets its own crest, its own squad and
 * its own real recent match, so the five panels show five recognisable teams
 * instead of repeating whichever club happened to play most recently.
 *
 * Cost: one fixture query plus five squad doc reads. `/` is a dynamic route
 * (it reads the session cookie), so without the unstable_cache wrapper below
 * that would run on every single homepage request. React's `cache()` only
 * dedupes within one request, which is not the problem here.
 *
 * Never throws and never partially fails — a club with no squad is simply
 * dropped, and the homepage renders fully with none of this, which is what
 * happens on a cold season.
 */
async function loadHomepageShowcase(): Promise<HomepageShowcase> {
  try {
    const fixturesRef = adminDb
      .collection("fixtures")
      .doc(CURRENT_SEASON)
      .collection("fixtures");

    const nowSeconds = Math.floor(Date.now() / 1000);

    // select() keeps the payload to the fields used here. Fixture docs also
    // carry lineups and full match statistics, which would make reading a
    // window of them far heavier than it needs to be.
    const fields = ["teams", "events", "status", "timestamp"] as const;

    // Finished matches only: they are the only ones carrying a real `events`
    // array, which the pulse and reactions panels are built from.
    const snapshot = await fixturesRef
      .where("timestamp", "<", nowSeconds)
      .orderBy("timestamp", "desc")
      .limit(SHOWCASE_FIXTURE_WINDOW)
      .select(...fields)
      .get();

    const directory = await getClubDirectoryServer();
    const nameById = new Map(
      directory.clubs.map((club) => [String(club.teamId), club.name]),
    );

    const squadDocs = await Promise.all(
      FEATURE_CLUBS.map((club) =>
        adminDb
          .collection("teamSquads")
          .doc(club.teamId)
          .collection("season")
          .doc(CURRENT_SEASON)
          .get()
          .catch(() => null),
      ),
    );

    const clubs: ShowcaseClub[] = [];

    FEATURE_CLUBS.forEach((featureClub, i) => {
      const squadDoc = squadDocs[i];
      const squad = pickSquad(squadDoc?.data()?.activeSquad || []);

      // No squad means no faces, and every panel for this row is about the
      // players. Drop the club rather than render an empty pitch.
      if (squad.length === 0) return;

      // This club's best recent match: most goals, so the pulse chart has a
      // shape and the reactions feed has something to react to. The docs
      // arrive newest-first and the sort is stable, so ties fall back to the
      // most recent.
      const candidates = snapshot.docs.filter((doc) => {
        const teams = doc.data().teams;
        return (
          String(teams?.home?.id) === featureClub.teamId ||
          String(teams?.away?.id) === featureClub.teamId
        );
      });

      const best = [...candidates].sort(
        (a, b) => goalCount(b.data()) - goalCount(a.data()),
      )[0];

      const data = best?.data();
      const home = data?.teams?.home;
      const away = data?.teams?.away;

      clubs.push({
        teamId: featureClub.teamId,
        name: nameById.get(featureClub.teamId) || featureClub.name,
        logo: logoFor(featureClub.teamId),
        squad,
        fixture:
          best && home?.id && away?.id
            ? {
                matchId: best.id,
                homeName: home.name || "",
                homeLogo: home.logo || logoFor(home.id),
                awayName: away.name || "",
                awayLogo: away.logo || logoFor(away.id),
              }
            : null,
        events: data ? buildEvents(data) : [],
      });
    });

    // Only the outfielders — they are the ones the face-led panels pick from,
    // and keepers are never surfaced as a headshot.
    await verifyPhotos(
      clubs.flatMap((club) =>
        club.squad.filter((player) => player.position !== "Goalkeeper"),
      ),
    );

    return { clubs };
  } catch (error) {
    console.error("❌ Homepage showcase fetch failed:", error);
    return EMPTY_SHOWCASE;
  }
}

/**
 * Cached across requests for an hour. The underlying data only changes when
 * the nightly job runs, so serving a slightly stale showcase is free, while
 * re-reading it per homepage view is not.
 *
 * `cache()` still wraps it so repeated calls inside one render share a result.
 */
export const getHomepageShowcase = cache(
  unstable_cache(loadHomepageShowcase, ["homepage-showcase", CURRENT_SEASON], {
    revalidate: SHOWCASE_TTL_SECONDS,
    tags: ["homepage-showcase"],
  }),
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

/**
 * One player out of a club's squad for a season.
 *
 * The `players` collection this used to be read from does not cover the
 * squads — the nightly job writes them to `teamSquads/{clubId}/season/{season}`
 * as `activeSquad` / `seasonSquad` arrays — which is why every player page
 * titled itself "Player Not Found".
 *
 * `seasonSquad` is the fallback rather than the primary because it accumulates:
 * it keeps players who have since left the club, and their pages still carry a
 * season of ratings, so they must stay resolvable by name.
 *
 * cache()d — generateMetadata and the page body both resolve the same player
 * within one render.
 */
export const getSquadPlayerServer = cache(
  async (
    clubId: string | number | null | undefined,
    season: string,
    playerId: string,
  ) => {
    if (!clubId) return null;

    try {
      const squadDoc = await adminDb
        .collection("teamSquads")
        .doc(String(clubId))
        .collection("season")
        .doc(String(season))
        .get();

      if (!squadDoc.exists) return null;

      const data = squadDoc.data();
      const find = (list: unknown) =>
        Array.isArray(list)
          ? list.find((p: any) => String(p?.id) === String(playerId))
          : undefined;

      return find(data?.activeSquad) ?? find(data?.seasonSquad) ?? null;
    } catch (error) {
      console.error("❌ Error resolving squad player:", error);
      return null;
    }
  },
);

/**
 * The slug of the club the fan calls home — the header logo's destination.
 *
 * Resolved on the server rather than read from Redux, because the header
 * renders above the club layout that populates the store: subscribing it to
 * Redux made it a listener for a dispatch that happens during another
 * component's render (see GroupClientInitializer). This also means the logo
 * points at the right club in the very first HTML, before hydration.
 *
 * cache()d, and built on the already-cache()d getUserData, so the root layout
 * and the page it wraps share one read.
 */
export const getUserHomeSlugServer = cache(async (userId: string) => {
  try {
    const userData = await getUserData(userId);
    const groupId = userData?.activeGroup;
    if (!groupId) return null;

    const groupDoc = await adminDb.collection("groups").doc(groupId).get();
    return groupDoc.exists ? (groupDoc.data()?.slug ?? null) : null;
  } catch (error) {
    console.error("❌ Error resolving home slug:", error);
    return null;
  }
});

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
