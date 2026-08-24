/**
 * Brand contact points, in one place.
 *
 * The footer renders these and the homepage `Organization` JSON-LD claims them
 * via `sameAs`. Both have to agree: a `sameAs` pointing somewhere the site
 * doesn't visibly link is exactly the mismatch Google discounts.
 */

export const CONTACT_EMAIL = "kalum@11votes.com";

export const SOCIALS = {
  x: "https://x.com/11Votes_",
  instagram: "https://www.instagram.com/11votees",
  tiktok: "https://www.tiktok.com/@11votes",
} as const;

/** The X handle, for the `twitter:site` card attribution. */
export const X_HANDLE = "@11Votes_";

/** Every profile the brand owns, for schema.org `sameAs`. */
export const SOCIAL_PROFILE_URLS: string[] = Object.values(SOCIALS);
