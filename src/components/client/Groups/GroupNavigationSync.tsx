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
    let settled = false;
    let deferred: ReturnType<typeof setTimeout> | undefined;

    const slugForActiveGroup = () =>
      (store.getState().groupData as any)?.byGroupId?.[currentActiveId]?.slug;

    const follow = (slug: string) => {
      settled = true;
      lastActiveGroupId.current = currentActiveId;
      router.push(`/${slug}`);
      // The root layout resolves the header logo's target server-side, and Next
      // reuses that shared segment across a client navigation — without a
      // refresh the logo would keep pointing at the club they just left.
      router.refresh();
    };

    const knownSlug = slugForActiveGroup();
    if (knownSlug) {
      follow(knownSlug);
      return;
    }

    // The club isn't in the dictionary yet. A transfer flips activeGroup
    // server-side, and that user snapshot beats the joinedGroups -> groups
    // round trip that introduces the new club, so this is the normal ordering
    // rather than an edge case. Bailing out here stranded the fan on the club
    // they just left: the effect re-runs on an activeGroup change, and that
    // change had already been consumed. Watch the store instead and follow the
    // moment the slug lands.
    const unsubscribe = store.subscribe(() => {
      if (settled) return;

      const slug = slugForActiveGroup();
      if (!slug) return;

      unsubscribe();
      // A dispatch can land mid-render of another component (the club layout
      // seeds groupData during its render pass), and this listener runs inside
      // that dispatch. Navigating from there would touch the router while React
      // is rendering, so hand the switch to the next task instead.
      deferred = setTimeout(() => follow(slug), 0);
    });

    return () => {
      settled = true;
      unsubscribe();
      if (deferred) clearTimeout(deferred);
    };
  }, [userData?.activeGroup, router, store]);

  return null;
};
