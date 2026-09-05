"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { clientDB } from "@/lib/firebase/client";
import {
  buildLiveTable,
  toTableFixture,
  type LiveTable,
  type TableFixture,
} from "@/lib/league/liveTable";
import type { LeagueStandings } from "@/lib/league/standings";

import LeagueTable from "./LeagueTable";
import TableLegend from "./TableLegend";

interface LiveTableClientProps {
  standings: LeagueStandings;
  /** The table the server already computed, rendered on the first paint. */
  initialLive: LiveTable;
  leagueId: number;
  season: string;
  clubId?: string;
}

/** Matches within this window of now can still move the table. */
const LOOKBACK_SECONDS = 36 * 60 * 60;
const LOOKAHEAD_SECONDS = 60 * 60;

/**
 * The league table, kept current while matches are being played.
 *
 * The server ships a table that already has finished-but-uncounted results
 * folded in. This subscribes to the competition's live window and recomputes
 * over the same official base whenever a score moves, so a goal reaches the
 * table without a refresh.
 *
 * Recomputing from `standings` every time rather than mutating the previous
 * result is deliberate: the overlay is only correct when applied once to a
 * clean base, and re-applying to its own output would double-count.
 */
export default function LiveTableClient({
  standings,
  initialLive,
  leagueId,
  season,
  clubId,
}: LiveTableClientProps) {
  const [fixtures, setFixtures] = useState<TableFixture[] | null>(null);

  // Per-fixture fingerprints, so a snapshot that only moved the clock does not
  // re-render the table. Same trick FixtureListener uses per key.
  const lastJsonRef = useRef<string>("");

  useEffect(() => {
    if (!leagueId || !season) return;

    const now = Math.floor(Date.now() / 1000);
    const fixturesRef = collection(clientDB, "fixtures", season, "fixtures");

    // A number, matching how updateJob writes league.id.
    const windowQuery = query(
      fixturesRef,
      where("leagueId", "==", Number(leagueId)),
      where("timestamp", ">=", now - LOOKBACK_SECONDS),
      where("timestamp", "<=", now + LOOKAHEAD_SECONDS),
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      windowQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((doc) => toTableFixture(doc.data()))
          .filter((fixture): fixture is TableFixture => fixture !== null);

        // Only the fields the table reads — a fingerprint over the whole
        // document would change on every elapsed-minute tick.
        const json = JSON.stringify(
          next.map((f) => [f.fixtureId, f.status, f.goals.home, f.goals.away]),
        );
        if (json === lastJsonRef.current) return;

        lastJsonRef.current = json;
        setFixtures(next);
      },
      (error) => {
        // The server-rendered table stays on screen. A live table that cannot
        // subscribe is worse as a blank page than as a slightly stale one.
        console.error("[LiveTable] snapshot failed:", error);
      },
    );

    return () => unsubscribe();
  }, [leagueId, season]);

  const live = useMemo(
    () => (fixtures === null ? initialLive : buildLiveTable(standings, fixtures)),
    [fixtures, initialLive, standings],
  );

  return (
    <>
      <TableLegend live={live} fetchedAt={standings.fetchedAt} />
      <LeagueTable standings={standings} live={live} clubId={clubId} />
    </>
  );
}
