"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { clientDB } from "@/lib/firebase/client";
import { castLivePlayerVote } from "@/lib/firebase/client-actions";
import {
  computeHeatBoard,
  emptyHeat,
  overlayStances,
  type LivePlayerCounts,
  type LiveStatsDoc,
  type PlayerHeat,
  type PlayerStance,
  type StanceMap,
} from "@/lib/live/heat";

interface UseLiveMatchStatsArgs {
  fixtureId: string | number;
  elapsed: number | string | null | undefined;
  groupId: string;
  currentYear: string;
  /** Omitted for guests, who can read the crowd but never hold a stance. */
  userId?: string | null;
  /** False on a finished match or in a read-only view: skips the voter listener. */
  canVote?: boolean;
  /** Passed through so a capped user stops paying for dead XP writes. */
  xpCapReached?: boolean;
}

const sameStance = (a?: PlayerStance, b?: PlayerStance) =>
  (a?.mood ?? null) === (b?.mood ?? null) &&
  (a?.subFor ?? null) === (b?.subFor ?? null);

/**
 * Everything the live pitch knows about the crowd.
 *
 * Two listeners: the group's aggregate (what everyone thinks) and, for a signed-in
 * member, their own stance doc (what YOU think). The hook owns the write too,
 * because the optimistic overlay and the write have to agree on what a stance
 * change means — splitting them across a hook and a component is how they drift.
 */
export default function useLiveMatchStats({
  fixtureId,
  elapsed,
  groupId,
  currentYear,
  userId,
  canVote = false,
  xpCapReached = false,
}: UseLiveMatchStatsArgs) {
  const [liveStats, setLiveStats] = useState<LiveStatsDoc>({});
  /** The stances the server has acknowledged. */
  const [confirmed, setConfirmed] = useState<StanceMap>({});
  /** Stances tapped but not yet acknowledged. Painted immediately. */
  const [pending, setPending] = useState<StanceMap>({});

  const basePath = `groups/${groupId}/seasons/${currentYear}/livePlayerStats`;

  // 1. THE CROWD
  useEffect(() => {
    if (!fixtureId || !groupId) return;

    const unsubscribe = onSnapshot(
      doc(clientDB, basePath, String(fixtureId)),
      (snap) => {
        // A match nobody has voted in has no doc at all. Reset rather than
        // holding the previous fixture's numbers when the id changes.
        setLiveStats(snap.exists() ? (snap.data() as LiveStatsDoc) : {});
      },
      (error) => {
        console.error("❌ Live Stats Subscription Error:", error);
      },
    );

    return () => unsubscribe();
  }, [basePath, fixtureId, groupId]);

  // 2. YOUR OWN STANCES
  // Skipped entirely for guests and finished matches — a listener nobody can
  // act on is a socket and a read for nothing.
  useEffect(() => {
    if (!fixtureId || !groupId || !userId || !canVote) {
      setConfirmed({});
      return;
    }

    const unsubscribe = onSnapshot(
      doc(clientDB, basePath, String(fixtureId), "voters", userId),
      (snap) => {
        setConfirmed(snap.exists() ? (snap.data()?.stances ?? {}) : {});
      },
      (error) => {
        console.error("❌ Live Stance Subscription Error:", error);
      },
    );

    return () => unsubscribe();
  }, [basePath, fixtureId, groupId, userId, canVote]);

  // Drop pending entries the server has caught up with. Not required for
  // correctness — overlayStances diffs against `confirmed`, so a matched entry
  // already contributes nothing — but it keeps the map from growing all match.
  useEffect(() => {
    setPending((current) => {
      const stale = Object.keys(current).filter((id) =>
        sameStance(current[id], confirmed[id]),
      );
      if (stale.length === 0) return current;
      const next = { ...current };
      stale.forEach((id) => delete next[id]);
      return next;
    });
  }, [confirmed]);

  const liveCounts: Record<string, LivePlayerCounts> = useMemo(
    () => overlayStances(liveStats.live ?? {}, confirmed, pending),
    [liveStats.live, confirmed, pending],
  );

  const heatBoard = useMemo(
    () => computeHeatBoard(liveStats, elapsed, liveCounts),
    [liveStats, elapsed, liveCounts],
  );

  const myStances = useMemo(
    () => ({ ...confirmed, ...pending }),
    [confirmed, pending],
  );

  const voterCount = Math.max(Number(liveStats.voterCount) || 0, 0);

  /** Heat for a player nobody has voted on, so callers never handle undefined. */
  const heatFor = useCallback(
    (playerId: string | number): PlayerHeat =>
      heatBoard[String(playerId)] ?? emptyHeat(String(playerId), voterCount),
    [heatBoard, voterCount],
  );

  /**
   * Take up a stance on a player. Paints instantly and rolls back on failure —
   * the previous flow held the modal open for the whole round-trip, so every
   * vote cost a visible pause.
   */
  const castStance = useCallback(
    async (playerId: string | number, next: PlayerStance) => {
      if (!userId) throw new Error("Sign in to vote");

      const id = String(playerId);
      setPending((current) => ({ ...current, [id]: next }));

      try {
        await castLivePlayerVote({
          groupId,
          currentYear,
          matchId: String(fixtureId),
          timeElapsed: Number(elapsed) || 0,
          playerId: id,
          stance: next,
          userId,
          xpCapReached,
        });
      } catch (error) {
        setPending((current) => {
          const rolled = { ...current };
          delete rolled[id];
          return rolled;
        });
        throw error;
      }
    },
    [userId, groupId, currentYear, fixtureId, elapsed, xpCapReached],
  );

  return {
    /** Raw document — the Full Time story and the sub list read the timeline. */
    liveStats,
    /** Per-player crowd verdict, keyed by player id. */
    heatBoard,
    heatFor,
    /** This fan's own stances, pending ones included. */
    myStances,
    voterCount,
    castStance,
  };
}
