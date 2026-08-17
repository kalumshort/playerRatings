"use client";

import React, { useMemo } from "react";
import { Box, Button, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { Fixture } from "@/types/football";
import { formatKickoff, relativeKickoff } from "@/lib/utils/date-format";
import useMounted from "@/Hooks/useMounted";
import {
  getClubSide,
  getFixtureContext,
  getFixtureStatus,
  getMatchId,
} from "./fixtureDisplay";

interface NextMatchCardProps {
  fixture: Fixture;
  clubId: number;
  onSelect: (matchId: string) => void;
}

/**
 * The hero at the top of the Upcoming tab. It exists so the schedule opens on
 * an answer to "when do we play next" — which previously required reading a
 * reverse-chronological list that had silently scrolled itself to the middle.
 */
export default function NextMatchCard({
  fixture,
  clubId,
  onSelect,
}: NextMatchCardProps) {
  const mounted = useMounted();

  const isLive = getFixtureStatus(fixture) === "inplay";
  const side = getClubSide(fixture, clubId);
  const { dayMonth, time } = useMemo(
    () => formatKickoff(fixture.fixture.timestamp),
    [fixture.fixture.timestamp],
  );
  const relative = mounted ? relativeKickoff(fixture.fixture.timestamp) : null;
  const context = getFixtureContext(fixture);

  return (
    <Box sx={(t) => ({ ...t.clay.card, p: { xs: 2, md: 3 }, mb: 2 })}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: isLive ? "error.main" : "text.secondary",
            opacity: isLive ? 1 : 0.5,
            letterSpacing: 1,
          }}
        >
          {isLive ? "LIVE NOW" : "NEXT MATCH"}
        </Typography>
        <Typography
          suppressHydrationWarning
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "text.secondary",
            opacity: 0.7,
          }}
        >
          {relative ?? dayMonth}
          {side ? ` · ${side === "H" ? "Home" : "Away"}` : ""}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1.5, md: 3 },
          mb: 2,
        }}
      >
        <TeamBlock team={fixture.teams.home} isClub={side === "H"} />

        <Box sx={{ textAlign: "center", flexShrink: 0 }}>
          <Typography
            suppressHydrationWarning
            sx={{
              fontWeight: 900,
              fontSize: { xs: "1.4rem", md: "1.75rem" },
              lineHeight: 1,
              color: isLive ? "primary.main" : "text.primary",
            }}
          >
            {isLive
              ? `${fixture.goals.home} – ${fixture.goals.away}`
              : time}
          </Typography>
          <Typography
            suppressHydrationWarning
            sx={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "text.secondary",
              opacity: 0.55,
              letterSpacing: 0.5,
              mt: 0.75,
            }}
          >
            {isLive ? `${fixture.fixture.status.elapsed}'` : dayMonth}
          </Typography>
        </Box>

        <TeamBlock team={fixture.teams.away} isClub={side === "A"} />
      </Box>

      {context && (
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "text.secondary",
            opacity: 0.55,
            textAlign: "center",
            mb: 2,
          }}
        >
          {[fixture.league?.name, context].filter(Boolean).join(" · ")}
        </Typography>
      )}

      <Button
        fullWidth
        variant="contained"
        endIcon={<ArrowForwardRoundedIcon />}
        onClick={() => onSelect(getMatchId(fixture))}
        sx={{ borderRadius: 2 }}
      >
        {isLive ? "Follow the match" : "Predict the lineup"}
      </Button>
    </Box>
  );
}

function TeamBlock({
  team,
  isClub,
}: {
  team: Fixture["teams"]["home"];
  isClub: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        flex: 1,
        minWidth: 0,
      }}
    >
      <Box
        component="img"
        loading="lazy"
        decoding="async"
        src={team.logo}
        alt={team.name}
        sx={{ width: { xs: 44, md: 56 }, height: { xs: 44, md: 56 }, objectFit: "contain" }}
      />
      <Typography
        sx={{
          fontWeight: isClub ? 900 : 700,
          opacity: isClub ? 1 : 0.75,
          fontSize: "0.8rem",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
      >
        {team.name}
      </Typography>
    </Box>
  );
}
