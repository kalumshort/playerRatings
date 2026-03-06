"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import useGroupData from "@/Hooks/useGroupData";
import useUserData from "@/Hooks/useUserData";

export const GroupNavigationSync = () => {
  const router = useRouter();
  const { userData } = useUserData();
  const { groupData }: any = useGroupData();

  const lastNavigatedSlug = useRef<string | null>(null);

  useEffect(() => {
    // 1. HARD GUARD: Ensure we have the necessary data
    // If userData or groupData are loading/undefined, abort immediately
    if (!userData || !userData.activeGroup || !groupData) return;

    const activeGroupData = groupData[userData.activeGroup];

    // 2. SAFETY CHECK: Ensure the group exists in our data dictionary
    if (!activeGroupData) return;

    // 3. LOGIC: Navigate only if we have a valid slug and it differs from state
    if (
      activeGroupData.slug &&
      activeGroupData.slug !== lastNavigatedSlug.current
    ) {
      lastNavigatedSlug.current = activeGroupData.slug;
      router.push(`/${activeGroupData.slug}`);
    }
  }, [userData, groupData, router]); // Keep dependencies stable

  return null;
};
