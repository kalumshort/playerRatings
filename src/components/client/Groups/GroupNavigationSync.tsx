"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
import useGroupData from "@/Hooks/useGroupData";
import useUserData from "@/Hooks/useUserData";

export const GroupNavigationSync = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get current URL path
  const { userData } = useUserData();
  const { groupData }: any = useGroupData();

  const lastNavigatedSlug = useRef<string | null>(null);

  useEffect(() => {
    // 1. PATH GUARD: Only redirect if the user is on the root domain
    if (pathname !== "/") {
      return;
    }

    // 2. DATA GUARD: Wait for Firebase sync
    if (!userData || !userData.activeGroup || !groupData) {
      console.log("[NavSync] Waiting for user/group data to initialize...");
      return;
    }

    const activeGroupId = userData.activeGroup;
    const activeGroupData = groupData[activeGroupId];

    // 3. EXISTENCE CHECK: Ensure the active group is actually in the loaded dictionary
    if (!activeGroupData) {
      console.warn(
        `[NavSync] Active group ${activeGroupId} not found in groupData dictionary.`,
      );
      return;
    }

    // 4. EXECUTION: Navigate if we have a valid slug and haven't just done this
    if (activeGroupData.slug) {
      if (activeGroupData.slug !== lastNavigatedSlug.current) {
        console.log(
          `[NavSync] Redirecting root user to group: /${activeGroupData.slug}`,
        );

        lastNavigatedSlug.current = activeGroupData.slug;

        // Use replace instead of push for the initial landing redirect
        // so the "Back" button doesn't loop them back to the redirector
        router.replace(`/${activeGroupData.slug}`);
      }
    } else {
      console.error(
        "[NavSync] Active group found, but it is missing a slug property.",
      );
    }
  }, [userData, groupData, pathname, router]);

  return null;
};
