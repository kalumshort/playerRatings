"use client";

import React from "react";
import { Avatar, Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import { CheckRounded, CloseRounded, SwapHorizRounded } from "@mui/icons-material";

import type { SubVerdict } from "@/lib/live/matchStory";
import type { SquadLookup } from "./HeatXI";

interface SubVerdictsProps {
  verdicts: SubVerdict[];
  squad: SquadLookup;
}

const nameOf = (squad: SquadLookup, id: string | null) =>
  id ? (squad[id]?.name ?? `#${id}`) : null;

const surnameOf = (squad: SquadLookup, id: string | null) => {
  const full = nameOf(squad, id);
  return full ? (full.split(" ").pop() ?? full) : null;
};

/**
 * Did the manager agree with the crowd?
 *
 * The one question the sub mechanic was always implicitly asking and never
 * answered. Every request was counted, shown as a red arrow for a few minutes,
 * and then forgotten — so nobody ever found out whether they had called it.
 */
export default function SubVerdicts({ verdicts, squad }: SubVerdictsProps) {
  if (verdicts.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1.5 }}>
        Did the manager listen?
      </Typography>
      <Stack spacing={1.25}>
        {verdicts.map((verdict) => (
          <VerdictCard key={verdict.playerId} verdict={verdict} squad={squad} />
        ))}
      </Stack>
    </Box>
  );
}

const VerdictCard = ({
  verdict,
  squad,
}: {
  verdict: SubVerdict;
  squad: SquadLookup;
}) => {
  const theme = useTheme() as any;
  const listened = verdict.outcome === "listened";
  const tone = listened ? theme.palette.success.main : theme.palette.heat.subDemand;

  const player = surnameOf(squad, verdict.playerId) ?? "That player";
  const replacement = surnameOf(squad, verdict.replacementId);
  const crowdChoice = surnameOf(squad, verdict.crowdChoiceId);

  // The waiting time is the interesting number, and it can be negative — the
  // crowd sometimes only reaches the threshold after the change is already made.
  const waited = verdict.minutesWaited;
  const timing = !listened
    ? "They played on to the whistle."
    : waited == null
      ? ""
      : waited > 0
        ? `Off ${waited} minute${waited === 1 ? "" : "s"} later, on ${verdict.actualMinute}'.`
        : waited === 0
          ? `Off that very minute.`
          : `Already coming off — the change landed on ${verdict.actualMinute}'.`;

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{
        ...theme.clay?.box,
        p: 1.25,
        borderLeft: `3px solid ${tone}`,
      }}
    >
      <Avatar
        src={
          squad[verdict.playerId]?.photo ||
          `https://media.api-sports.io/football/players/${verdict.playerId}.png`
        }
        sx={{ width: 40, height: 40, bgcolor: "background.default", flexShrink: 0 }}
      />

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={800}>
          {verdict.totalRequests} fan{verdict.totalRequests === 1 ? "" : "s"} wanted{" "}
          {player} off by {verdict.demandMinute}&apos;
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {timing}
        </Typography>

        {listened && replacement && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ mt: 0.5, color: "text.secondary" }}
          >
            <SwapHorizRounded sx={{ fontSize: 14 }} />
            <Typography variant="caption" fontWeight={700}>
              {replacement} came on
              {verdict.matchedChoice
                ? " — exactly who the crowd asked for"
                : crowdChoice
                  ? ` — the crowd wanted ${crowdChoice}`
                  : ""}
            </Typography>
          </Stack>
        )}
      </Box>

      <Box
        aria-hidden
        sx={{
          width: 26,
          height: 26,
          flexShrink: 0,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          color: tone,
          bgcolor: alpha(tone, 0.15),
        }}
      >
        {listened ? (
          <CheckRounded sx={{ fontSize: 16 }} />
        ) : (
          <CloseRounded sx={{ fontSize: 16 }} />
        )}
      </Box>
    </Stack>
  );
};
