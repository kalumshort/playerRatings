"use client";

import { Box, Stack, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";
import { ShowcaseClub, ShowcaseEvent } from "@/lib/homepageShowcase";
import DemoFrame from "@/components/client/Home/DemoFrame";
import { EMOJI_OPTIONS } from "@/components/client/Fixture/Components/Events";

/**
 * Event reactions.
 *
 * The events are real — real goals, cards and substitutions from a real
 * finished fixture. The reaction counts hung on them are illustrative, hence
 * the EXAMPLE label.
 *
 * EMOJI_OPTIONS is imported from the Events component rather than retyped, so
 * the eleven shown here can never drift from the eleven the app offers.
 */
const EXAMPLE_REACTIONS: { emoji: string; count: number }[][] = [
  [
    { emoji: "🔥", count: 24 },
    { emoji: "🤯", count: 9 },
  ],
  [
    { emoji: "🤬", count: 12 },
    { emoji: "🤨", count: 5 },
  ],
  [
    { emoji: "🪄", count: 17 },
    { emoji: "🤩", count: 6 },
  ],
];

/** Icon + tint per event type, matching the match feed's own treatment. */
const eventLook = (event: ShowcaseEvent) => {
  if (event.type === "Goal") return { glyph: "⚽", tint: "#7AE582" };
  if (event.type === "Card")
    return {
      glyph: event.detail?.toLowerCase().includes("red") ? "🟥" : "🟨",
      tint: event.detail?.toLowerCase().includes("red") ? "#FF8585" : "#FFD666",
    };
  return { glyph: "🔄", tint: "#93BFEC" };
};

export default function ReactionsDemo({ club }: { club: ShowcaseClub | null }) {
  const events = club?.events ?? [];
  // Goals first — they're the events people actually react to. Falls back to
  // whatever the fixture had if it was a goalless one.
  const ranked = [
    ...events.filter((e) => e.type === "Goal"),
    ...events.filter((e) => e.type !== "Goal"),
  ].slice(0, 3);

  return (
    <DemoFrame club={club}>
      <Typography
        variant="overline"
        sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6, display: "block", mb: 2 }}
      >
        Match feed
      </Typography>

      {ranked.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 4, textAlign: "center" }}
        >
          React to every goal, card and substitution as it happens.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {ranked.map((event, i) => {
            const { glyph, tint } = eventLook(event);
            const reactions = EXAMPLE_REACTIONS[i] ?? [];

            return (
              <Stack key={`${event.time.elapsed}-${event.type}-${i}`} direction="row" spacing={1.5}>
                {/* Minute + icon rail */}
                <Stack alignItems="center" spacing={0.5} sx={{ width: 42, flexShrink: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 900, fontSize: "0.7rem", opacity: 0.6 }}
                  >
                    {event.time.elapsed}&apos;
                  </Typography>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "0.85rem",
                      bgcolor: alpha(tint, 0.18),
                      border: `1px solid ${alpha(tint, 0.45)}`,
                    }}
                  >
                    {glyph}
                  </Box>
                </Stack>

                {/* Event + its reactions */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap sx={{ fontWeight: 800, fontSize: "0.95rem" }}>
                    {event.player?.name || event.type}
                  </Typography>
                  {event.assist?.name && (
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ display: "block", opacity: 0.6, fontWeight: 600 }}
                    >
                      {event.type === "subst" ? "In: " : "Assist: "}
                      {event.assist.name}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap", gap: 0.75 }}>
                    {reactions.map((r, ri) => (
                      <motion.div
                        key={r.emoji}
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: 0.2 + i * 0.15 + ri * 0.1,
                          type: "spring",
                          stiffness: 320,
                        }}
                      >
                        <Box
                          sx={(t) => ({
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 0.9,
                            py: 0.25,
                            borderRadius: 999,
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            bgcolor: alpha(t.palette.primary.main, 0.12),
                            border: `1px solid ${t.palette.divider}`,
                          })}
                        >
                          <span>{r.emoji}</span>
                          <span>{r.count}</span>
                        </Box>
                      </motion.div>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      )}

      {/* The full palette you can pick from */}
      <Box
        sx={(t) => ({
          mt: 2.5,
          pt: 2,
          borderTop: `1px solid ${t.palette.divider}`,
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          justifyContent: "center",
        })}
      >
        {EMOJI_OPTIONS.map((emoji) => (
          <Box
            key={emoji}
            sx={{ fontSize: "1.05rem", opacity: 0.75, lineHeight: 1.4 }}
          >
            {emoji}
          </Box>
        ))}
      </Box>
    </DemoFrame>
  );
}
