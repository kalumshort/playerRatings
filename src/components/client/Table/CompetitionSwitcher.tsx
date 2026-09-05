"use client";

import React from "react";
import { Avatar, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/navigation";

import { isArchivedSeason } from "@/lib/config/season";

interface CompetitionOption {
  leagueId: number | null;
  name: string;
  logo?: string;
  played: number;
}

interface CompetitionSwitcherProps {
  competitions: CompetitionOption[];
  selected: number | null;
  clubSlug: string;
  season: string;
}

/**
 * Picks which of a club's competitions the page is showing.
 *
 * The theme already styles Tabs as a segmented pill on a recessed track, so
 * there is no custom styling here — same as the schedule toolbar's tabs.
 */
export default function CompetitionSwitcher({
  competitions,
  selected,
  clubSlug,
  season,
}: CompetitionSwitcherProps) {
  const router = useRouter();

  const go = (leagueId: number | null) => {
    if (leagueId == null) return;
    const params = new URLSearchParams();
    params.set("league", String(leagueId));
    // The current season stays out of the URL, keeping it canonical — the
    // same rule withSeasonParam applies everywhere else.
    if (isArchivedSeason(season)) params.set("season", season);

    router.push(`/${clubSlug}/table?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs
      value={selected ?? false}
      onChange={(_, value) => go(value)}
      variant="scrollable"
      scrollButtons={false}
      allowScrollButtonsMobile
      TabIndicatorProps={{ style: { display: "none" } }}
      aria-label="Select competition"
    >
      {competitions.map((competition) => (
        <Tab
          key={competition.leagueId ?? competition.name}
          value={competition.leagueId ?? false}
          disableRipple
          iconPosition="start"
          icon={
            competition.logo ? (
              <Avatar
                src={competition.logo}
                alt=""
                sx={{ width: 16, height: 16, bgcolor: "transparent" }}
                imgProps={{ loading: "lazy", decoding: "async" }}
              />
            ) : undefined
          }
          label={competition.name}
          sx={{ minHeight: 40, gap: 0.75 }}
        />
      ))}
    </Tabs>
  );
}
