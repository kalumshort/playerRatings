"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";

import { formatKickoff } from "@/lib/utils/date-format";

interface ShareFixtureLineProps {
  fixture: any;
  /** Hide the scoreline for a pre-match card. Defaults to showing it. */
  showScore?: boolean;
}

/** Crest, name, score, name, crest — the header both result cards open with. */
export default function ShareFixtureLine({
  fixture,
  showScore = true,
}: ShareFixtureLineProps) {
  const home = fixture?.teams?.home;
  const away = fixture?.teams?.away;
  if (!home || !away) return null;

  const homeGoals = fixture?.goals?.home;
  const awayGoals = fixture?.goals?.away;
  const hasScore =
    showScore && Number.isFinite(Number(homeGoals)) && Number.isFinite(Number(awayGoals));

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
      <TeamSide name={home.name} logo={home.logo} align="right" />

      <Typography
        sx={{
          fontWeight: 900,
          fontSize: 30,
          lineHeight: 1,
          letterSpacing: -1,
          whiteSpace: "nowrap",
        }}
      >
        {hasScore ? `${homeGoals} – ${awayGoals}` : "v"}
      </Typography>

      <TeamSide name={away.name} logo={away.logo} align="left" />
    </Stack>
  );
}

const TeamSide = ({
  name,
  logo,
  align,
}: {
  name: string;
  logo?: string;
  align: "left" | "right";
}) => (
  // Both sides pack towards the scoreline in the middle. `flex-end` on BOTH is
  // not a typo: the away side is `row-reverse`, so its main axis runs right to
  // left and flex-END is the visual LEFT edge. Under the `flex-start` this used
  // to have, the away crest and name were thrown against the right edge of the
  // card while the home side stayed glued to the score.
  <Stack
    direction={align === "right" ? "row" : "row-reverse"}
    alignItems="center"
    spacing={1}
    sx={{ flex: 1, justifyContent: "flex-end", minWidth: 0 }}
  >
    <Typography
      variant="body2"
      sx={{
        fontWeight: 800,
        textAlign: align,
        lineHeight: 1.2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </Typography>
    {/* A plain <img>, not next/image: the renderer rewrites api-sports URLs onto
        /_next/image inside the html2canvas clone, and next/image's own srcset
        would fight that. */}
    <Box
      component="img"
      src={logo}
      alt=""
      sx={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
    />
  </Stack>
);

/** "Premier League · Regular Season - 3 · Sat 23 Aug" */
export function fixtureSubtitle(fixture: any): string {
  const league = fixture?.league?.name;
  const round = fixture?.league?.round;
  const { dayMonth } = formatKickoff(fixture?.fixture?.timestamp);
  return [league, round, dayMonth].filter(Boolean).join(" · ");
}

/** "Arsenal v Man City" */
export function fixtureTitle(fixture: any): string {
  const home = fixture?.teams?.home?.name;
  const away = fixture?.teams?.away?.name;
  return home && away ? `${home} v ${away}` : "";
}
