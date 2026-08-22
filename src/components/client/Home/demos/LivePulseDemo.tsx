"use client";

import { Avatar, Box, Stack, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";
import { HomepageShowcase, ShowcasePlayer } from "@/lib/homepageShowcase";
import DemoFrame from "@/components/client/Home/DemoFrame";
import MoodAreaChart from "@/components/client/Fixture/Components/FanMoodSelector/MoodAreaChart";
import { MOODS } from "@/components/client/Fixture/Components/FanMoodSelector/moodConfig";

/**
 * The two live systems in one panel: the stadium pulse, and manager mode.
 *
 * The chart is the production `MoodAreaChart` and the events drawn on it are
 * real, taken from a real finished fixture by getHomepageShowcase(). The mood
 * curve is an illustrative shape — a chart of the handful of real reactions
 * recorded so far would show nothing useful.
 *
 * Every mood in moodConfig.MOODS appears in every bucket. `hopeful` was once
 * missing from all of them, which made that band render as flat zero.
 */
const EXAMPLE_MOOD_ARC: Record<string, Record<string, number>> = {
  "5":  { excited: 12, happy: 28, hopeful: 20, nervous: 15, sad: 2,  angry: 1 },
  "12": { excited: 8,  happy: 24, hopeful: 18, nervous: 22, sad: 6,  angry: 3 },
  "20": { excited: 4,  happy: 14, hopeful: 12, nervous: 30, sad: 14, angry: 8 },
  "28": { excited: 38, happy: 42, hopeful: 16, nervous: 8,  sad: 2,  angry: 1 },
  "36": { excited: 22, happy: 38, hopeful: 19, nervous: 16, sad: 4,  angry: 2 },
  "45": { excited: 14, happy: 28, hopeful: 17, nervous: 24, sad: 10, angry: 5 },
  "52": { excited: 6,  happy: 12, hopeful: 10, nervous: 22, sad: 26, angry: 18 },
  "60": { excited: 4,  happy: 10, hopeful: 9,  nervous: 28, sad: 24, angry: 22 },
  "68": { excited: 8,  happy: 18, hopeful: 21, nervous: 30, sad: 16, angry: 10 },
  "76": { excited: 18, happy: 32, hopeful: 26, nervous: 22, sad: 8,  angry: 4 },
  "84": { excited: 28, happy: 38, hopeful: 22, nervous: 14, sad: 4,  angry: 2 },
  "89": { excited: 56, happy: 30, hopeful: 12, nervous: 6,  sad: 2,  angry: 1 },
  "90": { excited: 62, happy: 28, hopeful: 8,  nervous: 4,  sad: 1,  angry: 1 },
};

const EXAMPLE_SUB_SHOUTS = 7;

export default function LivePulseDemo({
  events,
  squad,
}: {
  events: HomepageShowcase["events"];
  squad: ShowcasePlayer[];
}) {
  // Two different players if the squad allows it, so the hot and cold tiles
  // aren't the same face twice.
  const hotPlayer = squad[0] ?? null;
  const coldPlayer = squad[1] ?? null;

  return (
    <DemoFrame padded={false}>
      {/* --- Vibe check --- */}
      <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2.5, pb: 1 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6, display: "block", mb: 1, pr: 9 }}
        >
          Vibe check
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="space-between">
          {MOODS.map((mood, i) => (
            <motion.div
              key={mood.label}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
            >
              <Box
                sx={{
                  width: { xs: 36, sm: 42 },
                  height: { xs: 36, sm: 42 },
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: { xs: "1.05rem", sm: "1.2rem" },
                  bgcolor: alpha(mood.color, 0.22),
                  border: `1px solid ${alpha(mood.color, 0.5)}`,
                }}
              >
                {mood.emoji}
              </Box>
            </motion.div>
          ))}
        </Stack>
      </Box>

      {/* --- The pulse itself --- */}
      <Box sx={{ height: 300, overflow: "hidden" }}>
        <MoodAreaChart matchMoods={EXAMPLE_MOOD_ARC} events={events} />
      </Box>

      {/* --- Manager mode --- */}
      <Box
        sx={(t) => ({
          px: { xs: 2, md: 2.5 },
          py: 2,
          borderTop: `1px solid ${t.palette.divider}`,
          bgcolor: alpha(t.palette.primary.main, 0.04),
        })}
      >
        <Typography
          variant="overline"
          sx={{ fontWeight: 800, letterSpacing: 2, opacity: 0.6, display: "block", mb: 1.5 }}
        >
          Manager mode
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="stretch">
          <StatusTile player={hotPlayer} glyph="🔥" label="ON FIRE" tint="#FF8A4C" />
          <StatusTile player={coldPlayer} glyph="❄️" label="FROZEN" tint="#6FB6FF" />
          <Box
            sx={(t) => ({
              flex: 1,
              minWidth: 0,
              borderRadius: "10px",
              px: 1.25,
              py: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0.5,
              border: `1px solid ${t.palette.divider}`,
            })}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 900, fontSize: "0.6rem", letterSpacing: 1, opacity: 0.6 }}
            >
              FANS WANT ON
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={(t) => ({
                  px: 0.75,
                  borderRadius: 999,
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  color: t.palette.common.white,
                  bgcolor: t.palette.form.goodSolid,
                })}
              >
                {EXAMPLE_SUB_SHOUTS}
              </Box>
              <Typography variant="caption" noWrap sx={{ fontWeight: 700 }}>
                {squad[2] ? squad[2].name.split(/\s+/).slice(-1)[0] : "sub shouts"}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </DemoFrame>
  );
}

/**
 * A player carrying the bobbing status badge the live pitch puts over their
 * head. Falls back to the glyph alone when the squad read came back empty.
 */
function StatusTile({
  player,
  glyph,
  label,
  tint,
}: {
  player: ShowcasePlayer | null;
  glyph: string;
  label: string;
  tint: string;
}) {
  return (
    <Stack alignItems="center" spacing={0.75} sx={{ width: 62, flexShrink: 0 }}>
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={player?.photo || undefined}
          alt={player?.name || label}
          sx={(t) => ({
            width: 42,
            height: 42,
            bgcolor: t.palette.background.default,
            border: `2px solid ${alpha(tint, 0.8)}`,
            fontWeight: 900,
            fontSize: "0.9rem",
          })}
        >
          {player?.name?.charAt(0) ?? "?"}
        </Avatar>
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", top: -8, right: -8 }}
        >
          <Box
            sx={(t) => ({
              width: 22,
              height: 22,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: "0.7rem",
              bgcolor: t.palette.background.paper,
              border: `1px solid ${alpha(tint, 0.6)}`,
            })}
          >
            {glyph}
          </Box>
        </motion.div>
      </Box>
      <Typography
        variant="caption"
        noWrap
        sx={{ fontWeight: 900, fontSize: "0.55rem", letterSpacing: 0.8, opacity: 0.7 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
