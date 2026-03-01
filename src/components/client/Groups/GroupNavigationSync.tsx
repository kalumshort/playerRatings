"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import useGroupData from "@/Hooks/useGroupData";
import useUserData from "@/Hooks/useUserData";

export const GroupNavigationSync = () => {
  const router = useRouter();
  const { userData } = useUserData();
  const { groupData }: any = useGroupData();

  // Use a ref to track the last navigated group to prevent infinite loops
  const lastNavigatedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!userData?.activeGroup || !groupData) return;

    const activeGroupData = groupData[userData.activeGroup];

    // Only navigate if we have the slug and it's different from the last one
    if (
      activeGroupData?.slug &&
      activeGroupData.slug !== lastNavigatedSlug.current
    ) {
      lastNavigatedSlug.current = activeGroupData.slug;
      router.push(`/${activeGroupData.slug}`);
    }
  }, [userData?.activeGroup, groupData, router]);

  return null;
};
