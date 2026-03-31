"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import useGroupData from "@/Hooks/useGroupData";
import useUserData from "@/Hooks/useUserData";

export const GroupNavigationSync = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { userData } = useUserData();
  const { groupData }: any = useGroupData();

  // Keep track of the LAST known active group ID to detect a manual change
  const lastActiveGroupId = useRef<string | null>(null);

  useEffect(() => {
    // 1. DATA GUARD: Ensure we have the necessary data
    if (!userData?.activeGroup || !groupData) return;

    const currentActiveId = userData.activeGroup;
    const activeGroupMetadata = groupData[currentActiveId];

    // Determine if the user actually clicked a "Switch Group" button
    const hasGroupChanged =
      lastActiveGroupId.current !== null &&
      lastActiveGroupId.current !== currentActiveId;

    // 2. LOGIC FOR INITIAL LANDING (at "/")
    if (pathname === "/" && activeGroupMetadata?.slug) {
      console.log("[NavSync] Landing on root, redirecting to active group.");
      lastActiveGroupId.current = currentActiveId;
      router.replace(`/${activeGroupMetadata.slug}`);
      return;
    }

    // 3. LOGIC FOR MANUAL SWITCH (even if on "/profile")
    // If the ID changed, we navigate regardless of the current path
    if (hasGroupChanged && activeGroupMetadata?.slug) {
      console.log(
        `[NavSync] Active group changed to ${currentActiveId}. Switching workspace...`,
      );
      lastActiveGroupId.current = currentActiveId;
      router.push(`/${activeGroupMetadata.slug}`);
      return;
    }

    // 4. SYNC THE REF: If we are just browsing (e.g. at /profile) and no change happened,
    // just make sure our Ref stays up to date with the current ID.
    if (lastActiveGroupId.current === null) {
      lastActiveGroupId.current = currentActiveId;
    }
  }, [userData?.activeGroup, groupData, pathname, router]);

  return null;
};
