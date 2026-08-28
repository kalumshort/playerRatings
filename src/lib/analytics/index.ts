/**
 * Public surface of the analytics module. Call sites import from
 * `@/lib/analytics` and should only ever need `trackEvent`.
 */
export {
  trackEvent,
  trackPageView,
  initialise,
  isInitialised,
  updateConsent,
  gtag,
  type AnalyticsEvent,
} from "./gtag";

export {
  GA_ENABLED,
  GA_MEASUREMENT_ID,
  GA_REQUIRE_CONSENT_TO_LOAD,
} from "./config";

export {
  readStoredConsent,
  storeConsent,
  openCookieSettings,
  CONSENT_STORAGE_KEY,
  CONSENT_REOPEN_EVENT,
  type ConsentChoice,
} from "./consent";
