"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { clientDB } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import useUserData from "@/Hooks/useUserData";
import useGroupData from "@/Hooks/useGroupData";
import { CURRENT_SEASON } from "@/lib/config/season";
import LevelProgress from "./LevelProgress";
import XpBar from "./XpBar";

/**
 * The signed-in fan's own progress, live.
 *
 * Reads `userProgress` and `userSeasonProgress` straight from the client: both
 * are world-readable and written only by Cloud Functions, so there is nothing
 * to hide and no server hop to add. Live, because XP lands via a Firestore
 * trigger moments after a match action and watching it move is the point.
 *
 * Renders zeroed rather than nothing for a fan who has not taken part yet —
 * the rows only exist once the trigger or the nightly reconcile has run, and
 * an empty space would read as broken.
 */
export default function UserProgressPanel({
  variant = "full",
  onNavigate,
}: {
  /** "bar" is the slim nav-drawer strip; "full" is the progress page card. */
  variant?: "full" | "bar";
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const { userData } = useUserData();
  const { activeGroup } = useGroupData();
  const groupId = userData?.activeGroup;

  const [totalXp, setTotalXp] = useState(0);
  const [seasonXp, setSeasonXp] = useState(0);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(clientDB, "userProgress", user.uid),
      (snap) => setTotalXp(Number(snap.data()?.totalXp) || 0),
      (err) => console.error("Progress listener failed:", err),
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !groupId) return;

    const rowId = `${CURRENT_SEASON}_${groupId}_${user.uid}`;
    const unsubscribe = onSnapshot(
      doc(clientDB, "userSeasonProgress", rowId),
      (snap) => {
        setSeasonXp(Number(snap.data()?.xp) || 0);
        setMatches(Number(snap.data()?.matchesParticipated) || 0);
      },
      (err) => console.error("Season progress listener failed:", err),
    );

    return () => unsubscribe();
  }, [user?.uid, groupId]);

  if (!user) return null;

  if (variant === "bar") {
    // A fan who has signed up but not joined a club has no progress page to
    // send to, so the bar renders without a link rather than to a dead route.
    const slug = activeGroup?.slug;
    return (
      <XpBar
        totalXp={totalXp}
        href={slug ? `/${slug}/fans` : null}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <LevelProgress
      totalXp={totalXp}
      seasonXp={seasonXp}
      matchesParticipated={matches}
    />
  );
}
