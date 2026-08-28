"use client";

import React, { useEffect, useRef } from "react";
import {
  Box,
  Chip,
  FormControl,
  MenuItem,
  Select,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { ScheduleTab, VenueFilter } from "./useScheduleFixtures";

interface ScheduleToolbarProps {
  tab: ScheduleTab;
  onTabChange: (tab: ScheduleTab) => void;
  competition: string;
  competitions: string[];
  onCompetitionChange: (competition: string) => void;
  venue: VenueFilter;
  onVenueChange: (venue: VenueFilter) => void;
  counts: { upcoming: number; results: number; all: number };
  shown: number;
  /**
   * Reports the rendered height so the sticky month headers below can park
   * directly underneath. Measured rather than hardcoded because the filter row
   * wraps on narrow screens, which a fixed offset can't track.
   */
  onHeightChange?: (height: number) => void;
}

export default function ScheduleToolbar({
  tab,
  onTabChange,
  competition,
  competitions,
  onCompetitionChange,
  venue,
  onVenueChange,
  counts,
  shown,
  onHeightChange,
}: ScheduleToolbarProps) {
  // The ref goes on the sticky element itself. Wrapping it in a measured div
  // would make that div the containing block and leave sticky with no range.
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !onHeightChange) return;
    const report = () => onHeightChange(node.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <Box
      ref={ref}
      sx={{
        position: "sticky",
        // Clears the fixed header spacer (64px xs / 80px md, see Header/index).
        top: { xs: 64, md: 80 },
        zIndex: 10,
        bgcolor: "background.default",
        pt: 1,
        pb: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, value) => onTabChange(value as ScheduleTab)}
        variant="fullWidth"
        scrollButtons={false}
        aria-label="Filter fixtures by upcoming or completed"
      >
        <Tab value="upcoming" label={`Upcoming (${counts.upcoming})`} />
        <Tab value="results" label={`Results (${counts.results})`} />
        <Tab value="all" label="All" />
      </Tabs>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 160, flex: "1 1 160px" }}>
          <Select
            value={competition}
            onChange={(e) => onCompetitionChange(e.target.value)}
            displayEmpty
            inputProps={{ "aria-label": "Filter by competition" }}
            sx={{ fontSize: "0.8rem", fontWeight: 700 }}
            renderValue={(selected) =>
              (selected as string) || "All competitions"
            }
          >
            <MenuItem value="">All competitions</MenuItem>
            {competitions.map((name) => (
              <MenuItem
                key={name}
                value={name}
                sx={{ fontWeight: 600, fontSize: "0.85rem" }}
              >
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={venue}
          onChange={(_, value) => value && onVenueChange(value as VenueFilter)}
          aria-label="Filter by home or away"
        >
          <ToggleButton value="all" sx={{ px: 1.5, fontSize: "0.72rem" }}>
            All
          </ToggleButton>
          <ToggleButton value="H" sx={{ px: 1.5, fontSize: "0.72rem" }}>
            Home
          </ToggleButton>
          <ToggleButton value="A" sx={{ px: 1.5, fontSize: "0.72rem" }}>
            Away
          </ToggleButton>
        </ToggleButtonGroup>

        <Chip
          size="small"
          label={`${shown} ${shown === 1 ? "match" : "matches"}`}
          sx={{ fontWeight: 700, fontSize: "0.68rem", ml: "auto" }}
        />
      </Box>
    </Box>
  );
}
