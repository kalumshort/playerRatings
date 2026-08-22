"use client";

import { Box, Stack, Typography, alpha } from "@mui/material";
import { ShowcasePlayer } from "@/lib/homepageShowcase";
import DemoFrame from "@/components/client/Home/DemoFrame";
import Pitch from "@/components/client/Fixture/Components/Lineup/Pitch";
import PitchPlayer, {
  type PitchPlayerStatus,
} from "@/components/client/Fixture/Components/Lineup/PitchPlayer";
import {
  FORMATIONS,
  POSITION_BY_ROW,
} from "@/components/client/Fixture/Components/Lineup/formations";

/**
 * The lineup predictor, shown as a graded XI.
 *
 * Renders the production `Pitch` and `PitchPlayer` rather than a mock-up, so
 * the hit/miss rings on the homepage are literally the ones the app draws —
 * including the rule that colour is never used without a glyph.
 *
 * Players are real squad members. Which of them "started" is illustrative, so
 * the panel carries the EXAMPLE label like the others.
 */
const DEMO_FORMATION = "4-2-3-1 Wide";

/** Three slots called wrong, giving the 8/11 in the banner. */
const EXAMPLE_MISSED_SLOTS = new Set([7, 6, 3]);

const surname = (name: string) => name.trim().split(/\s+/).slice(-1)[0] || name;

/** Non-interactive twin of EmptyPitchSlot, for slots a thin squad can't fill. */
const EmptySlotMark = () => (
  <Box
    aria-hidden
    sx={(t) => ({
      width: 38,
      height: 38,
      borderRadius: "50%",
      border: `2px dashed ${alpha(t.palette.primary.main, 0.35)}`,
      backgroundColor: alpha(t.palette.primary.main, 0.06),
    })}
  />
);

export default function LineupDemo({ squad }: { squad: ShowcasePlayer[] }) {
  const layout = FORMATIONS[DEMO_FORMATION] ?? [];

  // Fill each slot with a squad player whose position suits the row it sits in,
  // falling back to anyone still unused. Squad data is partial often enough
  // (and position strings are free text) that a strict match would leave holes.
  const assigned = new Map<number, ShowcasePlayer>();
  const used = new Set<string>();

  const take = (position: string) => {
    const match = squad.find((p) => !used.has(p.id) && p.position === position);
    const pick = match ?? squad.find((p) => !used.has(p.id));
    if (pick) used.add(pick.id);
    return pick;
  };

  layout.forEach((row) => {
    row.slots.forEach((slotId) => {
      const player = take(POSITION_BY_ROW[row.rowId] ?? "Midfielder");
      if (player) assigned.set(slotId, player);
    });
  });

  const filled = assigned.size;
  const hits = [...assigned.keys()].filter(
    (slotId) => !EXAMPLE_MISSED_SLOTS.has(slotId),
  ).length;

  return (
    <DemoFrame padded={false}>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>
        {/* Accuracy banner — mirrors LineupPredictorUserSquad's post-match head */}
        <Stack spacing={0.5} sx={{ mb: 1.5, pr: 9 }}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6, lineHeight: 1.4 }}
          >
            Your XI vs the real XI
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography sx={{ fontWeight: 900, fontSize: "2rem", lineHeight: 1 }}>
              {hits}/{filled || 11}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.65, fontWeight: 600 }}>
              starters called
            </Typography>
          </Stack>
          <Box
            sx={(t) => ({
              height: 5,
              borderRadius: 999,
              bgcolor: alpha(t.palette.primary.main, 0.12),
              overflow: "hidden",
            })}
          >
            <Box
              sx={(t) => ({
                height: "100%",
                width: `${(hits / (filled || 11)) * 100}%`,
                borderRadius: 999,
                bgcolor: t.palette.form.goodSolid,
              })}
            />
          </Box>
        </Stack>

        <Pitch
          formation={DEMO_FORMATION}
          slotWidth={52}
          aspectRatio={0.78}
          renderSlot={({ slotId }) => {
            const player = assigned.get(slotId);

            // A thin squad genuinely can't fill an XI. Mirror the builder's
            // dashed empty slot, but statically — the real EmptyPitchSlot is a
            // button, and a focusable no-op button on a marketing page is just
            // a keyboard trap.
            if (!player) return <EmptySlotMark />;

            const status: PitchPlayerStatus = EXAMPLE_MISSED_SLOTS.has(slotId)
              ? "miss"
              : "hit";

            return (
              <PitchPlayer
                name={surname(player.name)}
                fullName={player.name}
                photo={player.photo || undefined}
                size={38}
                status={status}
              />
            );
          }}
          footer={
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ px: 1.5, pb: 1.25 }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 900, letterSpacing: 1, opacity: 0.7 }}
              >
                {DEMO_FORMATION.toUpperCase()}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.55, fontWeight: 600 }}>
                1 of 19 formations
              </Typography>
            </Stack>
          }
        />
      </Box>
    </DemoFrame>
  );
}
