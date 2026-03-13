// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase/admin";

const BASE_URL = "https://11votes.com";
const CURRENT_YEAR = "2025";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Logic: 7 days ago in seconds (API-Football uses Unix timestamps)
  const sevenDaysAgoSeconds = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

  // 1. Fetch data in parallel
  // Note: Added .where filter to fixtures to limit read costs and payload size
  const [groupsSnapshot, fixturesSnapshot] = await Promise.all([
    adminDb.collection("groups").where("visibility", "==", "public").get(),
    adminDb
      .collection(`fixtures/${CURRENT_YEAR}/fixtures`)
      .where("fixture.timestamp", ">=", sevenDaysAgoSeconds)
      .get(),
  ]);

  // 2. Build the Lookup Map (Numeric ID -> Slug)
  const clubIdToSlugMap: Record<number, string> = {};
  const groupUrls: MetadataRoute.Sitemap = [];

  groupsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.slug && data.groupClubId) {
      clubIdToSlugMap[Number(data.groupClubId)] = data.slug;

      groupUrls.push({
        url: `${BASE_URL}/${data.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  });

  // 3. Process filtered Fixtures
  const fixtureUrls: MetadataRoute.Sitemap = [];

  fixturesSnapshot.forEach((doc) => {
    const fixtureData = doc.data();
    const fixtureId = doc.id;
    const homeTeamId = fixtureData.teams?.home?.id;
    const awayTeamId = fixtureData.teams?.away?.id;

    // Check if the home team has a corresponding group in 11votes
    if (clubIdToSlugMap[homeTeamId]) {
      fixtureUrls.push({
        url: `${BASE_URL}/${clubIdToSlugMap[homeTeamId]}/fixture/${fixtureId}`,
        lastModified: new Date(),
        changeFrequency: "always",
        priority: 0.9,
      });
    }

    // Check if the away team has a corresponding group (only if different slug)
    if (
      clubIdToSlugMap[awayTeamId] &&
      clubIdToSlugMap[awayTeamId] !== clubIdToSlugMap[homeTeamId]
    ) {
      fixtureUrls.push({
        url: `${BASE_URL}/${clubIdToSlugMap[awayTeamId]}/fixture/${fixtureId}`,
        lastModified: new Date(),
        changeFrequency: "always",
        priority: 0.9,
      });
    }
  });

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...groupUrls,
    ...fixtureUrls,
  ];
}
