"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useStore } from "react-redux";
import { selectUserAccountData } from "@/lib/redux/selectors/userSelectors";
import type { RootState } from "@/lib/redux/store";

/**
 * Follows a deliberate group switch into the new club's workspace.
 *
 * Deliberately does NOT redirect a signed-in fan who lands on "/". Two other
 * things already do that — the server `redirect()` in app/page.tsx and
 * RootPage's own effect — and a third racing them is what hung the app: going
 * /club -> / -> /club fired a client `replace()` at the same destination the
 * server redirect was already navigating to, and the page never committed.
 * The server handles the normal case; RootPage's effect covers the one the
 * server can't see (a live session whose cookie has expired).
 *
 * Subscribes to the userData slice ONLY, and reads the group dictionary
 * imperatively. The club layout writes the groupData slice during its render
 * phase (see GroupClientInitializer), so subscribing to that slice from up
 * here — this component is mounted for the whole session — means being
 * re-rendered mid-render of another component. The switch it watches for lives
 * in userData anyway; groupData is just the id -> slug lookup, and by the time
 * a fan can pick a club it is necessarily already populated.
 */
export const GroupNavigationSync = () => {
  const router = useRouter();
  const store = useStore<RootState>();
  const userData: any = useSelector(selectUserAccountData);

  // Keep track of the LAST known active group ID to detect a manual change
  const lastActiveGroupId = useRef<string | null>(null);

  useEffect(() => {
    // 1. DATA GUARD: Ensure we have the necessary data
    const currentActiveId = userData?.activeGroup;
    if (!currentActiveId) return;

    // 2. SEED: the first pass only records where we started. Without this every
    // mount would look like a switch.
    if (lastActiveGroupId.current === null) {
      lastActiveGroupId.current = currentActiveId;
      return;
    }

    if (lastActiveGroupId.current === currentActiveId) return;

    // 3. MANUAL SWITCH: the fan picked a different club, from wherever they
    // happened to be (including /profile). Follow them into it.
    const slug = (store.getState().groupData as any)?.byGroupId?.[
      currentActiveId
    ]?.slug;
    if (!slug) return;

    lastActiveGroupId.current = currentActiveId;
    router.push(`/${slug}`);
    // The root layout resolves the header logo's target server-side, and Next
    // reuses that shared segment across a client navigation — without a
    // refresh the logo would keep pointing at the club they just left.
    router.refresh();
  }, [userData?.activeGroup, router, store]);

  return null;
};
