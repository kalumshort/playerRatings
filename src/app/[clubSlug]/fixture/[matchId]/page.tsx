import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFixtureByIdServer,
  getGroupBySlugServer,
  getMatchPlayerRatingsServer,
  getMatchPredictionsServer,
  isGroupMemberServer,
} from "@/lib/firebase/firebase-admin-queries";
import FixtureClientWrapper from "@/components/client/Fixture/FixtureClientWrapper";
import { getUserIdFromSession } from "@/lib/auth-server";
import PrivateGroupPlaceholder from "@/components/ui/PrivateGroupPlaceholder";
import {
  archivedClubSeason,
  isArchivedSeason,
  resolveSeason,
} from "@/lib/config/season";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, sportsEventJsonLd } from "@/lib/seo/jsonLd";
import { fixtureDescription, fixtureTitle } from "@/lib/seo/fixtureMeta";

interface PageProps {
  params: Promise<{ clubSlug: string; matchId: string }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { clubSlug, matchId } = await params;
  // getGroupBySlugServer is cache()d, so this shares the page's own lookup.
  const group = await getGroupBySlugServer(clubSlug);
  const season = resolveSeason(
    (await searchParams).season,
    archivedClubSeason(group),
  );

  try {
    const fixture = await getFixtureByIdServer(matchId, season);
    if (!fixture) return { title: "Match Not Found" };

    const { home, away } = fixture.teams;
    // `groupName` mirrors the fallback in [clubSlug]/page.tsx — a few older
    // club docs predate the `name` field. The last resort is the home side
    // rather than the slug: a slug is lowercase and hyphenated, and would read
    // as "manchester-united Fan Ratings".
    const clubName = group?.name || group?.groupName || home.name;
    const canonical = `https://11votes.com/${clubSlug}/fixture/${matchId}`;

    return {
      // `absolute` opts out of the layout's "%s | 11Votes" template. The title
      // already names the club and runs close to the truncation limit, and
      // Google appends the site name itself from the homepage's WebSite
      // JSON-LD — so the suffix costs ten characters and buys nothing here.
      title: { absolute: fixtureTitle({ fixture, clubName }) },
      description: fixtureDescription({ fixture, clubName }),
      openGraph: {
        // Per-club, so a link shared out of the Chelsea hub resolves back to
        // the Chelsea hub rather than collapsing into one shared card.
        url: canonical,
        images: [home.logo, away.logo],
      },
      // Self-referential, and deliberately so. The same fixture under two club
      // slugs is NOT duplicate content: predictions and ratings are fetched per
      // group (getMatchPredictionsServer(group.id, ...)), so each club's page
      // shows its own fans' consensus. What makes that claim credible to a
      // crawler is the per-club title and description above — see fixtureMeta.
      alternates: {
        canonical,
      },
      // Archived seasons aren't in the sitemap and must not compete
      // with the canonical current-season URLs.
      ...(isArchivedSeason(season) && {
        robots: { index: false, follow: true },
      }),
    };
  } catch (error) {
    console.error("[Metadata Error]:", error);
    return { title: "Error Loading Match" };
  }
}

export default async function FixturePage({
  params,
  searchParams,
}: PageProps) {
  const { clubSlug, matchId } = await params;

  console.log(`--- [DEBUG] Starting Page Load for ${clubSlug}/${matchId} ---`);

  // 1. Resolve Group & User Identity
  const [group, userId] = await Promise.all([
    getGroupBySlugServer(clubSlug),
    getUserIdFromSession(),
  ]);

  if (!group) {
    console.error(`[NOT_FOUND]: Group not found for slug "${clubSlug}"`);
    notFound();
  }

  // Resolved after the group: an archived club falls back to its last active
  // season, so a bare fixture link still finds the match.
  const season = resolveSeason(
    (await searchParams).season,
    archivedClubSeason(group),
  );

  console.log(
    `[DEBUG]: Group found (${group.id}), User ID: ${userId ?? "Guest"}`,
  );

  // 2. Security Check
  const isPublic = group.isPublic === true;
  const isAuthorized =
    isPublic || (userId ? await isGroupMemberServer(group.id, userId) : false);

  if (!isAuthorized) {
    console.warn(
      `[AUTH_DENIED]: User ${userId} unauthorized for group ${group.id}`,
    );
    return <PrivateGroupPlaceholder name={group.name} />;
  }

  // 3. Parallel Data Fetching
  console.log(
    `[DEBUG]: Fetching fixture/ratings for matchId: ${matchId}, year: ${season}`,
  );

  const [fixture, predictions, ratingsData] = await Promise.all([
    getFixtureByIdServer(matchId, season),
    getMatchPredictionsServer(group.id, matchId, season),
    getMatchPlayerRatingsServer(group.id, matchId, season),
  ]);

  if (!fixture) {
    console.error(
      `[NOT_FOUND]: Fixture data missing for matchId "${matchId}" in year ${season}`,
    );
    notFound();
  }

  console.log(
    `[SUCCESS]: Data loaded for ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
  );

  return (
    <>
      <JsonLd
        data={[
          sportsEventJsonLd({
            homeName: fixture.teams.home.name,
            awayName: fixture.teams.away.name,
            homeLogo: fixture.teams.home.logo,
            awayLogo: fixture.teams.away.logo,
            startDate: fixture.fixture?.date,
            status: fixture.fixture?.status?.short,
            venue: fixture.fixture?.venue?.name,
            url: `/${clubSlug}/fixture/${matchId}`,
            matchId,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "" },
            { name: group.name, path: `/${clubSlug}` },
            {
              name: `${fixture.teams.home.name} v ${fixture.teams.away.name}`,
              path: `/${clubSlug}/fixture/${matchId}`,
            },
          ]),
        ]}
      />
      <FixtureClientWrapper
        initialFixture={fixture}
        initialPredictions={predictions}
        initialRatings={ratingsData}
        group={group}
        matchId={matchId}
        currentYear={season}
      />
    </>
  );
}
