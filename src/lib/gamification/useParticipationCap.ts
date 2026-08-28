"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/lib/redux/store";
import { XP_CAPS } from "./xpConfig";

/** The repeatable actions that carry a per-match XP ceiling. */
type CappedField = "moodTaps" | "liveVotes" | "reactions";

const CAP_FOR: Record<CappedField, number> = {
  moodTaps: XP_CAPS.moodTaps,
  liveVotes: XP_CAPS.liveVotes,
  reactions: XP_CAPS.eventReactions,
};

/**
 * Whether this match has already earned all the XP a given action can give.
 *
 * Mood taps, live votes and reactions are deliberately unlimited — repeat
 * tapping the vibe check is the feature (see MoodSelector) — but XP for them
 * caps out. Past the cap the participation marker is pure cost: another
 * document write that cannot change anyone's score. The action itself still
 * goes through; only the XP bookkeeping stops.
 *
 * Reads the same per-match doc the XP engine consumes, so the client's idea of
 * the cap and the server's can't drift.
 */
export function useParticipationCap(
  matchId: string | undefined,
  field: CappedField,
): boolean {
  const count = useSelector((state: RootState) => {
    if (!matchId) return 0;
    const value = (state.userData.matches as any)?.[matchId]?.[field];
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });

  return count >= CAP_FOR[field];
}
