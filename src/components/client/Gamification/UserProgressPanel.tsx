"use client";

import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { clientDB } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import useUserData from "@/Hooks/useUserData";
import useGroupData from "@/Hooks/useGroupData";
import { CURRENT_SEASON } from "@/lib/config/season";
import { levelFromXp } from "@/lib/gamification/xpConfig";
import LevelProgress from "./LevelProgress";
import XpBar from "./XpBar";
import ParticleOverlay from "@/components/client/Fixture/Components/FanMoodSelector/ParticleOverlay";

/** Emoji thrown on a level-up. */
const CELEBRATION = ["🎉", "⭐", "🔥", "🏆", "✨", "🎊"];

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
  const [streak, setStreak] = useState(0);
  const [particles, setParticles] = useState<
    { id: number; emoji: string; x: number; y: number }[]
  >([]);

  const cardRef = useRef<HTMLDivElement>(null);
  // Last level actually observed. Starts null so the very first snapshot only
  // records a baseline — without that, every page load would congratulate the
  // fan on a level they reached weeks ago.
  const lastLevel = useRef<number | null>(null);
  // ParticleOverlay keys on this; Date.now() collides when several spawn in
  // the same tick, which silently drops all but one of them.
  const particleId = useRef(0);

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
        setStreak(Number(snap.data()?.currentStreak) || 0);
      },
      (err) => console.error("Season progress listener failed:", err),
    );

    return () => unsubscribe();
  }, [user?.uid, groupId]);

  // --- Level-up celebration ---------------------------------------------
  useEffect(() => {
    const level = levelFromXp(totalXp);

    if (lastLevel.current === null) {
      lastLevel.current = level.level;
      return;
    }
    if (level.level <= lastLevel.current) {
      lastLevel.current = level.level;
      return;
    }

    lastLevel.current = level.level;
    toast.success(`Level ${level.level} — ${level.name}`, {
      id: "level-up",
      duration: 6000,
    });

    // position: fixed with viewport coordinates, so the origin has to be the
    // card's real position rather than a click event.
    const box = cardRef.current?.getBoundingClientRect();
    const originX = box ? box.left + box.width / 2 : window.innerWidth / 2;
    const originY = box ? box.top + box.height / 2 : window.innerHeight / 3;

    const burst = CELEBRATION.map((emoji, i) => ({
      id: ++particleId.current,
      emoji,
      x: originX + (i - CELEBRATION.length / 2) * 24,
      y: originY,
    }));

    setParticles((prev) => [...prev, ...burst]);
    const ids = new Set(burst.map((p) => p.id));
    setTimeout(
      () => setParticles((prev) => prev.filter((p) => !ids.has(p.id))),
      1400,
    );
  }, [totalXp]);

  if (!user) return null;

  const celebration = <ParticleOverlay particles={particles} />;

  if (variant === "bar") {
    // A fan who has signed up but not joined a club has no progress page to
    // send to, so the bar renders without a link rather than to a dead route.
    const slug = activeGroup?.slug;
    return (
      <div ref={cardRef}>
        <XpBar
          totalXp={totalXp}
          href={slug ? `/${slug}/fans` : null}
          onNavigate={onNavigate}
        />
        {celebration}
      </div>
    );
  }

  return (
    <div ref={cardRef}>
      <LevelProgress
        totalXp={totalXp}
        seasonXp={seasonXp}
        matchesParticipated={matches}
        currentStreak={streak}
      />
      {celebration}
    </div>
  );
}
