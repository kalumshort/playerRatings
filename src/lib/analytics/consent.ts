/**
 * Cookie consent state.
 *
 * Stored in localStorage rather than a cookie on purpose: the choice is only
 * ever read in the browser to decide whether to load a script, and nothing on
 * the server branches on it. A cookie would be sent on every request for no
 * benefit — and, since the banner is the thing that keeps us from setting
 * non-essential cookies, storing the answer in one is a poor look.
 *
 * The key is versioned. If the set of vendors ever widens, bumping the suffix
 * re-asks everyone rather than silently reusing consent given for a narrower
 * purpose.
 */

export type ConsentChoice = "granted" | "denied";

export const CONSENT_STORAGE_KEY = "11votes:cookie-consent:v1";

/** Fired on `window` to reopen the banner from anywhere (e.g. the footer). */
export const CONSENT_REOPEN_EVENT = "11votes:open-cookie-settings";

/**
 * `null` means "never asked" — which is what shows the banner. Every access is
 * wrapped: Safari private mode and hardened browser settings throw on
 * localStorage rather than returning null, and a thrown analytics helper must
 * never take a page down with it.
 */
export function readStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function storeConsent(choice: ConsentChoice): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    /* Declining to persist is survivable: the banner reappears next visit. */
  }
}

/** Reopen the consent banner. Wired to the footer's "Cookie settings" link. */
export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_REOPEN_EVENT));
}
