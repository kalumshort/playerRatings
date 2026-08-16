"use client";

import React from "react";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

import {
  CURRENT_SEASON,
  SELECTABLE_SEASONS,
  formatSeason,
  withSeasonParam,
} from "@/lib/config/season";
import { useClubView } from "@/context/ClubViewProvider";

interface SeasonSwitcherProps {
  /** Server-resolved season. Omit on client-only pages to follow the shared context. */
  season?: string;
}

export default function SeasonSwitcher({ season: seasonProp }: SeasonSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { season: contextSeason } = useClubView();
  const season = seasonProp ?? contextSeason;

  const handleChange = (event: SelectChangeEvent) => {
    const next = event.target.value;
    if (next === season) return;

    // The current season carries no param, keeping canonical URLs clean
    router.push(withSeasonParam(pathname, next), { scroll: false });
  };

  return (
    <Select
      value={season}
      onChange={handleChange}
      size="small"
      variant="outlined"
      aria-label="Select season"
      sx={{
        fontSize: "0.7rem",
        fontWeight: 800,
        height: 26,
        bgcolor: "background.default",
        "& .MuiSelect-select": { py: 0, pl: 1.25 },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
      }}
    >
      {SELECTABLE_SEASONS.map((year) => (
        <MenuItem key={year} value={year} sx={{ fontSize: "0.75rem" }}>
          {formatSeason(year)}
          {year === CURRENT_SEASON ? "" : " (archive)"}
        </MenuItem>
      ))}
    </Select>
  );
}
