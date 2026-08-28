"use client";

import React, { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

import {
  CONSENT_REOPEN_EVENT,
  GA_ENABLED,
  GA_MEASUREMENT_ID,
  GA_REQUIRE_CONSENT_TO_LOAD,
  initialise,
  isInitialised,
  readStoredConsent,
  storeConsent,
  trackPageView,
  updateConsent,
  type ConsentChoice,
} from "@/lib/analytics";

import CookieBanner from "./CookieBanner";

/**
 * Google Analytics 4, consent and page-view reporting.
 *
 * Mounted once from the root layout, inside a Suspense boundary — it reads
 * `useSearchParams`, which opts every route above it out of static rendering
 * unless a boundary is in the way.
 *
 * Three states are tracked separately and should not be collapsed:
 *
 *   undefined  localStorage not read yet (first render, and every server
 *              render). Rendering the banner from this state would flash it at
 *              visitors who accepted months ago, so it renders nothing.
 *   null       asked and never answered -> show the banner.
 *   granted /  answered. Under a hard gate only "granted" mounts the script.
 *   denied
 */
function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [consent, setConsent] = useState<ConsentChoice | null | undefined>(
    undefined,
  );
  const [bannerOpen, setBannerOpen] = useState(false);

  const query = searchParams.toString();
  const fullPath = query ? `${pathname}?${query}` : pathname;

  // Read the stored answer after mount. Doing this during render would diverge
  // the server HTML from the client's first paint and break hydration.
  useEffect(() => {
    const stored = readStoredConsent();
    setConsent(stored);
    if (stored === null) setBannerOpen(true);
  }, []);

  // Lets the footer's "Cookie settings" link reopen the banner without a
  // context provider wrapping the whole tree for one boolean.
  useEffect(() => {
    const open = () => setBannerOpen(true);
    window.addEventListener(CONSENT_REOPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, open);
  }, []);

  const scriptAllowed =
    GA_ENABLED && (!GA_REQUIRE_CONSENT_TO_LOAD || consent === "granted");

  // Opening sequence, plus the page_view for whichever page the visitor
  // happened to be on when the tag came up — which, after an accept, is not
  // necessarily the page they landed on.
  useEffect(() => {
    if (!scriptAllowed) return;
    if (initialise(consent ?? null)) trackPageView(fullPath);
  }, [scriptAllowed, consent, fullPath]);

  // Route changes. App Router navigations never reload the document, so
  // without this every visit would report as a single page view.
  useEffect(() => {
    if (!isInitialised()) return;
    trackPageView(fullPath);
  }, [fullPath]);

  const decide = useCallback((choice: ConsentChoice) => {
    storeConsent(choice);
    setConsent(choice);
    setBannerOpen(false);
    // A no-op before the tag exists; the state is carried in by initialise
    // instead. It earns its keep when consent is *withdrawn* — gtag.js is
    // already in memory by then and unmounting the <Script> would not stop it.
    updateConsent(choice);
  }, []);

  return (
    <>
      {scriptAllowed && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      )}

      <CookieBanner
        open={bannerOpen}
        onAccept={() => decide("granted")}
        onReject={() => decide("denied")}
      />
    </>
  );
}

export default function Analytics() {
  // Nothing to mount when analytics is switched off — and with no analytics
  // cookie in play there is nothing to ask consent for either, so the banner
  // goes with it rather than prompting about a tag that will never load.
  if (!GA_ENABLED) return null;
  return <AnalyticsInner />;
}
