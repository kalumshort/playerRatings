// Structured data builders.
//
// The site had none at all, which is part of why the Terms page was
// outranking the homepage: nothing bound the brand entity to `/`.
//
// Rule for this file, same as the homepage copy: never emit a claim the data
// doesn't support. An AggregateRating with an invented ratingCount is a
// spam signal, so every builder returns `null` when its inputs are missing and
// the caller skips the tag entirely.

import { CONTACT_EMAIL, SOCIAL_PROFILE_URLS } from "@/lib/config/brand";

const BASE_URL = "https://11votes.com";

export type JsonLd = Record<string, unknown>;

/** Serialises for `dangerouslySetInnerHTML`, escaping the XSS-relevant chars. */
export const jsonLdScript = (data: JsonLd | JsonLd[]) => ({
  __html: JSON.stringify(data).replace(/</g, "\\u003c"),
});

/**
 * Homepage only. `WebSite` + `Organization` are what tell Google which URL
 * represents the brand — the direct counter to a legal page outranking `/`.
 */
export const websiteJsonLd = (): JsonLd[] => [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "11Votes",
    description:
      "Fan player ratings, predictions and the consensus XI for every Premier League club.",
    publisher: { "@id": `${BASE_URL}/#organization` },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "11Votes",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/icon.png`,
    },
    // The real profiles, and the same ones the footer links to. `sameAs` is
    // what lets Google tie those accounts to this entity rather than treating
    // them as unrelated pages.
    sameAs: SOCIAL_PROFILE_URLS,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      url: `${BASE_URL}/contact`,
    },
  },
];

export const breadcrumbJsonLd = (
  trail: { name: string; path: string }[],
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((crumb, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: crumb.name,
    item: `${BASE_URL}${crumb.path}`,
  })),
});

export const sportsTeamJsonLd = (club: {
  name: string;
  slug: string;
  logoUrl?: string | null;
}): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "SportsTeam",
  name: club.name,
  sport: "Football",
  url: `${BASE_URL}/${club.slug}`,
  ...(club.logoUrl ? { logo: club.logoUrl } : {}),
});

/** API-Football short status codes that mean the match is over. */
const FINISHED = ["FT", "AET", "PEN"];
const CANCELLED = ["PST", "CANC", "ABD", "AWD", "WO"];

export const sportsEventJsonLd = (args: {
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  /** ISO date string from `fixture.date`. */
  startDate?: string;
  /** API-Football short status, e.g. "FT" / "NS". */
  status?: string;
  venue?: string | null;
  url: string;
  /**
   * API-Football fixture id. Emits a hub-independent `@id`, which is how the
   * two club URLs for one match say "same real-world event, different page"
   * rather than looking like two competing events.
   */
  matchId?: string | number;
}): JsonLd | null => {
  if (!args.startDate) return null;

  const eventStatus = CANCELLED.includes(args.status ?? "")
    ? "https://schema.org/EventCancelled"
    : "https://schema.org/EventScheduled";

  return {
    "@context": "https://schema.org",
    // Deliberately NOT the page URL — the same fixture is published under every
    // club hub that contests it, and each of those pages is a different page
    // about one shared event. A per-page @id would assert the opposite.
    ...(args.matchId
      ? { "@id": `${BASE_URL}/fixture/${args.matchId}#event` }
      : {}),
    "@type": "SportsEvent",
    name: `${args.homeName} vs ${args.awayName}`,
    startDate: args.startDate,
    eventStatus,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${BASE_URL}${args.url}`,
    homeTeam: {
      "@type": "SportsTeam",
      name: args.homeName,
      ...(args.homeLogo ? { logo: args.homeLogo } : {}),
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: args.awayName,
      ...(args.awayLogo ? { logo: args.awayLogo } : {}),
    },
    ...(args.venue
      ? { location: { "@type": "Place", name: args.venue } }
      : {}),
    // Not surfaced as a schema field, but useful to keep the finished check
    // honest if this is extended with a result later.
    ...(FINISHED.includes(args.status ?? "") ? { isAccessibleForFree: true } : {}),
  };
};

/**
 * Player page. The AggregateRating is only attached when there are real votes —
 * `totalSubmits` is the count the rating writes increment, so a player nobody
 * has rated yet gets a plain `Person` with no rating block.
 */
export const playerJsonLd = (args: {
  name: string;
  photo?: string | null;
  clubName?: string | null;
  url: string;
  averageRating?: number | null;
  ratingCount?: number | null;
}): JsonLd => {
  const hasRatings =
    typeof args.averageRating === "number" &&
    typeof args.ratingCount === "number" &&
    args.ratingCount > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: args.name,
    url: `${BASE_URL}${args.url}`,
    ...(args.photo ? { image: args.photo } : {}),
    ...(args.clubName
      ? { memberOf: { "@type": "SportsTeam", name: args.clubName } }
      : {}),
    ...(hasRatings
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(args.averageRating!.toFixed(2)),
            ratingCount: args.ratingCount,
            bestRating: 10,
            worstRating: 1,
          },
        }
      : {}),
  };
};
