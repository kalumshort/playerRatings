/**
 * The gtag.js bridge.
 *
 * Everything that reaches Google goes through here, for two reasons: the
 * ordering rules below are easy to get wrong from a component, and having one
 * module makes "what do we send Google?" answerable by reading one file.
 *
 * ORDERING. gtag commands are just `dataLayer` pushes, replayed in array order
 * once the library loads. Two consequences shape this file:
 *
 *   - `consent default` must sit in the array before anything that could send
 *     a hit, or the first hit goes out under the wrong storage permissions.
 *   - `config` must sit before any `event`, or events queued ahead of it have
 *     no configured destination and are dropped on the floor.
 *
 * Neither is enforced by the library, and neither fails loudly. So no command
 * is pushed from an inline <Script> — next/script gives no ordering guarantee
 * against React's effects — and instead `initialise()` pushes the opening
 * sequence itself, from an effect that provably runs first.
 *
 * NO PII. GA4's terms prohibit it and the UK GDPR makes it expensive. Event
 * params here carry match/player/group IDs and enum-ish strings only: never an
 * email, a display name, or the Firebase UID.
 */

import {
  GA_ENABLED,
  GA_MEASUREMENT_ID,
  GA_REQUIRE_CONSENT_TO_LOAD,
} from "./config";
import type { ConsentChoice } from "./consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type GtagCommand = (...args: unknown[]) => void;

/**
 * Deliberately a `function` expression with no declared parameters: gtag.js
 * reads the pushed value as an `arguments` object, and an array is not a
 * reliable substitute. The signature is supplied by the annotation.
 */
export const gtag: GtagCommand = function () {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
};

/**
 * Consent Mode v2 signals.
 *
 * `ad_*` are included even though nothing on the site serves ads yet: the
 * privacy policy already names AdSense, and a tag that starts sending ad
 * signals the day a unit is dropped in — because they were never declared
 * denied — is the failure mode worth pre-empting.
 *
 * `security_storage` stays granted throughout: it covers strictly necessary
 * things like auth and abuse prevention, which consent does not gate.
 */
const DENIED_CONSENT = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  personalization_storage: "denied",
} as const;

const GRANTED_CONSENT = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
  personalization_storage: "granted",
} as const;

let initialised = false;

/**
 * Push the opening command sequence. Idempotent — the caller is an effect, and
 * React runs effects twice in development's StrictMode.
 *
 * Returns whether this call did the work, which is how the caller knows to
 * send the first page_view rather than double-sending it.
 */
export function initialise(consent: ConsentChoice | null): boolean {
  if (initialised || !GA_ENABLED) return false;
  initialised = true;

  gtag("consent", "default", {
    ...DENIED_CONSENT,
    functionality_storage: "granted",
    security_storage: "granted",
    // Holds hits briefly so a stored "granted" read from localStorage lands
    // before the first one goes out, rather than after.
    wait_for_update: 500,
  });

  if (consent === "granted") {
    gtag("consent", "update", GRANTED_CONSENT);
  }

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    // Page views are sent by hand from GoogleAnalytics.tsx. GA4's automatic
    // one fires on script load and on History API pushes, which in an App
    // Router app means it both double-counts the first view and races the
    // route change it is meant to describe.
    send_page_view: false,
  });

  return true;
}

export function isInitialised(): boolean {
  return initialised;
}

/**
 * Relay a consent change to a tag that is already running.
 *
 * Under a hard gate (`GA_REQUIRE_CONSENT_TO_LOAD`) a grant instead causes the
 * script to mount for the first time, and `initialise` carries the state in —
 * so this is a no-op until then, and matters mainly for a later withdrawal.
 */
export function updateConsent(choice: ConsentChoice): void {
  if (!initialised) return;
  gtag("consent", "update", choice === "granted" ? GRANTED_CONSENT : DENIED_CONSENT);
}

/**
 * The last path reported, so the same one is never counted twice.
 *
 * Two effects can legitimately ask for the same page_view on mount — the one
 * that initialises the tag and the one that watches the pathname — and
 * StrictMode doubles both. Deduping here keeps that out of every call site.
 */
let lastPagePath: string | null = null;

export function trackPageView(path: string): void {
  if (!GA_ENABLED || !initialised || path === lastPagePath) return;
  lastPagePath = path;

  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path,
    page_title: document.title,
  });
}

/**
 * Event names.
 *
 * `sign_up`, `login`, `share` and `select_content` are GA4's own recommended
 * names — worth matching exactly, because the standard reports and the
 * Explorations UI understand them for free. The rest are 11Votes-specific and
 * need custom dimensions registering in the GA4 admin before their parameters
 * show up in reports (see the README note in the setup summary).
 */
export type AnalyticsEvent =
  // Voting
  | "rate_player"
  | "vote_motm"
  | "predict_score"
  | "predict_winner"
  | "predict_motm"
  | "submit_lineup"
  // Auth & onboarding
  | "sign_up"
  | "login"
  | "select_club"
  | "join_group"
  // Sharing
  | "share";

/**
 * Fire an event. Safe to call from anywhere, at any time: it no-ops when
 * analytics is disabled, when the visitor has not consented (the tag is not
 * loaded, so nothing is queued), and on the server.
 */
export function trackEvent(
  name: AnalyticsEvent,
  params: Record<string, string | number | boolean | undefined> = {},
): void {
  if (!GA_ENABLED || !initialised) return;

  // Undefined params are dropped rather than sent as the string "undefined",
  // which is what GA4 would otherwise record against the dimension.
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) clean[key] = value;
  }

  gtag("event", name, clean);
}

export { GA_ENABLED, GA_MEASUREMENT_ID, GA_REQUIRE_CONSENT_TO_LOAD };
