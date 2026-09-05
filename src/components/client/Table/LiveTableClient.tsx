"use client";

import React from "react";

import useLiveLeagueTable from "@/Hooks/useLiveLeagueTable";
import type { LiveTable } from "@/lib/league/liveTable";
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

/**
 * The full league table, kept current while matches are being played.
 *
 * The subscription and the overlay live in useLiveLeagueTable, shared with the
 * club home summary so the two views cannot disagree about the table.
 */
export default function LiveTableClient({
  standings,
  initialLive,
  leagueId,
  season,
  clubId,
}: LiveTableClientProps) {
  const live = useLiveLeagueTable(standings, initialLive, leagueId, season);

  return (
    <>
      <TableLegend live={live ?? initialLive} fetchedAt={standings.fetchedAt} />
      <LeagueTable
        standings={standings}
        live={live ?? initialLive}
        clubId={clubId}
      />
    </>
  );
}
