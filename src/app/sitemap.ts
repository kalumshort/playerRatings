// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { CURRENT_SEASON } from "@/lib/config/season";

const BASE_URL = "https://11votes.com";

/**
 * Regenerate daily.
 *
 * Without this the route is fully static: the prerender manifest showed
 * `initialRevalidate=false`, meaning the sitemap was a snapshot frozen at the
 * last deploy and never picked up new fixtures. Daily matches the cadence of
 * the nightly updateFixtures job, and keeps the Firestore cost to roughly one
 * collection scan per day.
 */
export const revalidate = 86400;

/**
 * The league key club groups are tagged with. Mirrors LEAGUE_KEY in
 * functions/helperFunctions.js — `src/` and `functions/` are separate packages
 * and cannot import each other.
 */
const LEAGUE_KEY = "premier-league";

/**
 * Last substantive edit to the legal/contact pages. Hardcoded because a real
 * date is the whole point of lastModified — `new Date()` on every request
 * tells Google the page changed right now, every time, which trains it to
 * ignore the field entirely.
 */
const STATIC_PAGE_UPDATED = new Date("2026-01-15");

/**
 * Whether a group doc is an auto-generated club hub rather than a user-created
 * community group.
 *
 * Mirrors `isClubGroup` in functions/helperFunctions.js:362. The
 * groupType-or-league disjunction is load-bearing: some hand-created club docs
 * predate the `league` field, so testing `groupType` alone would silently drop
 * real clubs. Without this filter, community groups like "The United Stand"
 * were being submitted alongside actual Premier League clubs.
 */
const isClubGroup = (docId: string, data: FirebaseFirestore.DocumentData) =>
  /^\d+$/.test(String(docId)) &&
  (data?.groupType === "club" || data?.league === LEAGUE_KEY);

/**
 * The URLs that need no database: the homepage and the legal pages.
 *
 * This route is prerendered at build time, so it is the one page in the app
 * that genuinely reads Firestore during `next build`. When credentials are
 * absent — a CI check, a fresh clone without `.env.local` — falling back to
 * these keeps the build alive instead of failing the whole thing over a file
 * that is regenerated daily anyway.
 */
const staticOnlySitemap = (): MetadataRoute.Sitemap => [
  { url: BASE_URL, priority: 1 },
  // A real marketing page, not a legal footnote — it gets its own priority
  // rather than being lumped in with the 0.2 pages below.
  {
    url: `${BASE_URL}/private-clubs`,
    lastModified: STATIC_PAGE_UPDATED,
    priority: 0.7,
  },
  ...["/privacy", "/terms", "/contact"].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: STATIC_PAGE_UPDATED,
    priority: 0.2,
  })),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Current season only — archived `?season=` views are deliberately excluded
  // and rendered noindex, so they never compete with these canonical URLs.
  //
  // The whole season, not a trailing window: a finished match carries a full
  // set of fan ratings and is evergreen content. The previous 7-day floor
  // dropped those permanently.
  let groupsSnapshot;
  let fixturesSnapshot;

  try {
    [groupsSnapshot, fixturesSnapshot] = await Promise.all([
      // `isPublic` is the field the app itself gates on ([clubSlug]/page.tsx),
      // and the only one updateGroupPrivacy has always written.
      adminDb.collection("groups").where("isPublic", "==", true).get(),
      adminDb.collection(`fixtures/${CURRENT_SEASON}/fixtures`).get(),
    ]);
  } catch (error) {
    // Loud on purpose. A near-empty sitemap shipping to production would be a
    // silent SEO regression, so this has to be findable in the build log.
    console.error(
      "❌ Sitemap could not reach Firestore — emitting static URLs only. " +
        "A production build should NOT hit this:",
      error,
    );
    return staticOnlySitemap();
  }

  // Numeric API team id -> slug, for mapping fixtures onto club hubs.
  const clubIdToSlug: Record<number, string> = {};
  const clubSlugs: string[] = [];

  groupsSnapshot.forEach((doc) => {
    const data = doc.data();

    // Archived clubs stay publicly readable, but their current-season pages are
    // empty by design and their archived seasons render noindex. Filtered in
    // memory rather than as a `!=` query, which would force a composite index.
    if (data.status === "archived") return;
    if (!isClubGroup(doc.id, data)) return;
    if (!data.slug || !data.groupClubId) return;

    clubIdToSlug[Number(data.groupClubId)] = data.slug;
    clubSlugs.push(data.slug);
  });

  const clubUrls: MetadataRoute.Sitemap = clubSlugs.flatMap((slug) => [
    { url: `${BASE_URL}/${slug}`, priority: 0.9 },
    { url: `${BASE_URL}/${slug}/schedule`, priority: 0.6 },
    { url: `${BASE_URL}/${slug}/player-stats`, priority: 0.6 },
    { url: `${BASE_URL}/${slug}/fans`, priority: 0.6 },
  ]);

  // --- Fixtures ---------------------------------------------------------
  // A fixture is listed under BOTH clubs when both have a hub. That is not
  // duplicate content: predictions and ratings are fetched per group, so each
  // club's page shows its own fans' consensus, and each carries a
  // self-referential canonical.
  const fixtureUrls: MetadataRoute.Sitemap = [];

  fixturesSnapshot.forEach((doc) => {
    const data = doc.data();
    const homeSlug = clubIdToSlug[data.teams?.home?.id];
    const awaySlug = clubIdToSlug[data.teams?.away?.id];

    // Kickoff time, so lastModified means something. Falls back to undefined
    // rather than "now" when a doc predates the field.
    const kickoff =
      typeof data.timestamp === "number"
        ? new Date(data.timestamp * 1000)
        : undefined;

    for (const slug of new Set([homeSlug, awaySlug].filter(Boolean))) {
      fixtureUrls.push({
        url: `${BASE_URL}/${slug}/fixture/${doc.id}`,
        lastModified: kickoff,
        priority: 0.8,
      });
    }
  });

  // --- Player pages: deliberately NOT listed yet ------------------------
  // These should be the strongest long-tail pages on the site. Two problems
  // originally blocked them; one is now fixed:
  //
  //   1. FIXED. `generateMetadata` read `players/{playerId}`, but squads live
  //      under `teamSquads/{clubId}/season/{season}` as activeSquad /
  //      seasonSquad, so every page titled itself "Player Not Found". The
  //      route now resolves the player from the squad (getSquadPlayerServer)
  //      and carries a real title, description and OG image.
  //   2. STILL OPEN. The body is entirely client-rendered — server HTML is a
  //      skeleton, so there is no content for a crawler to index beyond the
  //      head.
  //
  // Submitting ~674 content-less URLs is still worse than omitting them, so
  // this stays off until the page server-renders its player.

  // Indexable, but the lowest priority on the site. `priority` is a hint Google
  // documents as ignored; it is kept here to state intent, not to expect an
  // effect. Hierarchy is actually communicated by the BreadcrumbList JSON-LD.
  const staticUrls: MetadataRoute.Sitemap = [
    "/privacy",
    "/terms",
    "/contact",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: STATIC_PAGE_UPDATED,
    priority: 0.2,
  }));

  return [
    { url: BASE_URL, priority: 1 },
    {
      url: `${BASE_URL}/private-clubs`,
      lastModified: STATIC_PAGE_UPDATED,
      priority: 0.7,
    },
    ...clubUrls,
    ...fixtureUrls,
    ...staticUrls,
  ];
}
