"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { clientDB } from "@/lib/firebase/client";
import {
  buildLiveTable,
  toTableFixture,
  type LiveTable,
  type TableFixture,
} from "@/lib/league/liveTable";
import type { LeagueStandings } from "@/lib/league/standings";

/** Matches within this window of now can still move the table. */
const LOOKBACK_SECONDS = 36 * 60 * 60;
const LOOKAHEAD_SECONDS = 60 * 60;

/**
 * Keeps a league table current while its matches are being played.
 *
 * The server ships a table that already has finished-but-uncounted results
 * folded in; this subscribes to the competition's live window and recomputes
 * over the same official base whenever a score moves, so a goal reaches the
 * table without a refresh.
 *
 * Shared by the full table and the club home summary, so one page open on
 * both would still be one subscription's worth of work each — and, more to the
 * point, so the two can never disagree about what the table says.
 *
 * @param standings The official table, as stored.
 * @param initialLive What the server already computed, used until the first
 *   snapshot lands so the first paint is never blank or stale.
 * @param leagueId The competition to watch.
 * @param season The season to watch.
 */
export default function useLiveLeagueTable(
  standings: LeagueStandings | null,
  initialLive: LiveTable | null,
  leagueId: number | null,
  season: string,
): LiveTable | null {
  const [fixtures, setFixtures] = useState<TableFixture[] | null>(null);

  // A fingerprint of only the fields the table reads, so a snapshot that moved
  // nothing but the clock does not re-render it.
  const lastJsonRef = useRef<string>("");

  useEffect(() => {
    if (!leagueId || !season) return;

    // A new competition or season is a different subscription; forget what the
    // last one had seen or its fingerprint would suppress the first snapshot.
    lastJsonRef.current = "";
    setFixtures(null);

    const now = Math.floor(Date.now() / 1000);
    const fixturesRef = collection(clientDB, "fixtures", season, "fixtures");

    // A number, matching how updateJob writes league.id.
    const windowQuery = query(
      fixturesRef,
      where("leagueId", "==", Number(leagueId)),
      where("timestamp", ">=", now - LOOKBACK_SECONDS),
      where("timestamp", "<=", now + LOOKAHEAD_SECONDS),
    );

    const unsubscribe = onSnapshot(
      windowQuery,
      (snapshot) => {
        // An empty result straight from the local cache is not information —
        // it means the cache is cold, not that nothing is being played. Taking
        // it would blank the table the server just rendered and then restore
        // it a moment later when the network answered, which reads as a flash
        // of the live indicator disappearing.
        if (snapshot.metadata.fromCache && snapshot.empty) return;

        const next = snapshot.docs
          .map((doc) => toTableFixture(doc.data()))
          .filter((fixture): fixture is TableFixture => fixture !== null);

        const json = JSON.stringify(
          next.map((f) => [f.fixtureId, f.status, f.goals.home, f.goals.away, f.elapsed]),
        );
        if (json === lastJsonRef.current) return;

        lastJsonRef.current = json;
        setFixtures(next);
      },
      (error) => {
        // The server-rendered table stays on screen. A live table that cannot
        // subscribe is worse as a blank page than as a slightly stale one.
        console.error("[useLiveLeagueTable] snapshot failed:", error);
      },
    );

    return () => unsubscribe();
  }, [leagueId, season]);

  return useMemo(() => {
    if (!standings) return null;
    // Always recomputed from the official base, never from the previous
    // result: the overlay is only correct applied once to a clean table, and
    // re-applying to its own output would double-count.
    return fixtures === null ? initialLive : buildLiveTable(standings, fixtures);
  }, [fixtures, initialLive, standings]);
}
