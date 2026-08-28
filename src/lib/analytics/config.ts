/**
 * Google Analytics 4 configuration.
 *
 * The measurement ID is the one Firebase already provisions for this project,
 * so there is no second property to keep in sync — GA4 web streams created by
 * Firebase are ordinary streams, and gtag.js reports into them exactly as it
 * would into a standalone one. `NEXT_PUBLIC_GA_MEASUREMENT_ID` exists as an
 * override for the day web analytics wants its own property; until then it is
 * unset everywhere and the Firebase value is used.
 */
export const GA_MEASUREMENT_ID: string =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
  "";

/**
 * Analytics is production-only by default. Local page loads and every `next
 * dev` hot reload would otherwise land in the same property as real traffic,
 * and there is no way to filter them out after the fact. Set
 * `NEXT_PUBLIC_GA_DEBUG=true` in `.env.local` to opt a dev session in when you
 * are actually testing the tagging.
 */
export const GA_ENABLED: boolean =
  Boolean(GA_MEASUREMENT_ID) &&
  (process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_GA_DEBUG === "true");

/**
 * Whether gtag.js is withheld until the visitor accepts.
 *
 * true  — nothing is requested from googletagmanager.com until consent is
 *         granted. The strictest reading of UK PECR / the EU ePrivacy
 *         directive, and what the banner promises. Visitors who decline
 *         produce no data at all.
 * false — "advanced" Consent Mode: the tag loads immediately with every
 *         storage signal denied, so no cookies are set but Google still
 *         receives cookieless pings it uses to model the declining traffic.
 *
 * Flip this only with the privacy policy wording updated to match.
 */
export const GA_REQUIRE_CONSENT_TO_LOAD = true;
