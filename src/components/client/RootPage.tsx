"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useAuth } from "@/context/AuthContext";
import useGroupData from "@/Hooks/useGroupData";
import { selectIsUserLoaded } from "@/lib/redux/selectors/userSelectors";

// Components
import { Spinner } from "@/components/ui/Spinner";
import HomePage from "@/components/client/HomePage";
import ClubSelectionPage from "@/components/client/ClubSelectionPage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServerHomeGroup {
  slug: string;
}

interface ServerUserData {
  userHomeGroup?: ServerHomeGroup | null;
}

interface RootPageProps {
  initialIsLoggedIn: boolean;
  serverUserData: ServerUserData | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RootPage({
  initialIsLoggedIn,
  serverUserData,
}: RootPageProps) {
  const { user, userLoading } = useAuth();
  const { userHomeGroup, groupDataLoaded, groupDataLoading } = useGroupData();
  const userDataLoaded = useSelector(selectIsUserLoaded);
  const router = useRouter();

  // Prevent the redirect from firing more than once, even if deps change.
  const hasRedirected = useRef(false);

  // ── 1. Redirect Effect ──────────────────────────────────────────────────────
  // Prefer the live client slug (post-hydration) over the server snapshot.
  // We guard with a ref so navigating back doesn't trigger a second replace().
  useEffect(() => {
    if (hasRedirected.current) return;

    const slug = userHomeGroup?.slug ?? serverUserData?.userHomeGroup?.slug;

    if (user && slug) {
      hasRedirected.current = true;
      router.replace(`/${slug}`);
    }
  }, [user, userHomeGroup, serverUserData, router]);

  // ── 2. Auth Loading Guard ───────────────────────────────────────────────────
  // Show a context-aware spinner while Firebase resolves the session.
  // If the server already confirmed a login, use "Syncing" so returning users
  // don't see a generic "Verifying" flash.
  if (userLoading) {
    return initialIsLoggedIn ? (
      <Spinner text="Syncing your football profile..." />
    ) : (
      <Spinner text="Verifying session..." />
    );
  }

  // ── 3. Unauthenticated Guard ────────────────────────────────────────────────
  // We check BOTH the resolved client user AND the server flag to guard against
  // the race where the client auth hasn't hydrated yet but the server already
  // confirmed a session — prevents a logged-in user briefly seeing <HomePage />.
  if (!user && !initialIsLoggedIn) {
    return <HomePage />;
  }

  // ── 4. Smart Data Guard ─────────────────────────────────────────────────────
  // If the server already told us there's no slug, skip the client-sync spinner
  // and go straight to club selection — no need to wait for Redux to catch up.
  const serverConfirmedNoSlug =
    serverUserData != null && !serverUserData.userHomeGroup?.slug;

  // "Not started" is distinct from "loading" — on the very first render the
  // Redux store is empty so both groupDataLoading and groupDataLoaded are false.
  // Without this check, the component falls through for one frame and renders
  // stale/empty content before the loading flags flip to true.
  const storeNotReady = !groupDataLoaded && !groupDataLoading;
  const isSyncingClientData =
    storeNotReady || groupDataLoading || !userDataLoaded;

  if (isSyncingClientData && !serverConfirmedNoSlug) {
    return <Spinner text="Syncing your club preferences..." />;
  }

  // ── 5. Club Selection ───────────────────────────────────────────────────────
  // Reached when either:
  //   A) The server confirmed there is no home group slug, or
  //   B) The client listeners finished and also found no slug.
  const finalSlug = userHomeGroup?.slug ?? serverUserData?.userHomeGroup?.slug;

  if (!finalSlug) {
    return <ClubSelectionPage />;
  }

  // ── 6. Redirecting Fallback ─────────────────────────────────────────────────
  // We have a slug and the redirect effect has been scheduled. This spinner
  // should only show for one frame. If the user is somehow stuck here it means
  // router.replace() never resolved — surface an actionable message rather than
  // silently hanging.
  return <Spinner text="Redirecting to your hub..." />;
}
