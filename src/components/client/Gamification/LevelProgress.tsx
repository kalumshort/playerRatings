"use client";

import { Box, Chip, Paper, Stack, Typography, alpha, useTheme } from "@mui/material";
import { levelFromXp, MAX_MATCH_XP } from "@/lib/gamification/xpConfig";

/**
 * A fan's level and how far into it they are.
 *
 * The level is derived from XP here rather than read from storage, so retuning
 * the thresholds can never leave someone displaying a level they no longer
 * hold.
 */
export default function LevelProgress({
  totalXp,
  seasonXp,
  matchesParticipated,
  compact = false,
}: {
  totalXp: number;
  seasonXp: number;
  matchesParticipated: number;
  /** Drops the season stats row, for tighter surfaces. */
  compact?: boolean;
}) {
  const theme = useTheme() as any;
  const level = levelFromXp(totalXp);

  const toNext = level.nextXp !== null ? level.nextXp - totalXp : 0;

  return (
    <Paper sx={{ ...theme.clay?.card, p: { xs: 2.5, md: 3 } }}>
      {/* Sized to survive a 280px drawer: the middle column is the only thing
          allowed to shrink, and the level name wraps rather than truncating —
          losing half of "Fan Favourite" to an ellipsis is worse than two
          lines. Without minWidth:0 the row refuses to shrink at all and the
          XP chip spills outside the card. */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ mb: 1.5, gap: 1 }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            fontSize: "1rem",
            color: theme.palette.motm?.bronze ?? theme.palette.common.white,
            background: `linear-gradient(145deg, ${
              theme.palette.motm?.goldStart ?? "#FFE27A"
            } 0%, ${theme.palette.motm?.goldEnd ?? "#F5B300"} 100%)`,
          }}
        >
          {level.level}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontWeight: 900,
              letterSpacing: 1.5,
              opacity: 0.6,
              lineHeight: 1.3,
            }}
          >
            LEVEL
          </Typography>
          <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", lineHeight: 1.2 }}>
            {level.name}
          </Typography>
        </Box>

        <Chip
          label={`${totalXp.toLocaleString()} XP`}
          size="small"
          sx={{
            flexShrink: 0,
            fontWeight: 900,
            fontSize: "0.7rem",
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            color: "text.primary",
          }}
        />
      </Stack>

      <Box
        sx={{
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${Math.round(level.progress * 100)}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(
              theme.palette.primary.light,
              0.9,
            )})`,
            transition: "width .4s ease",
          }}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{ display: "block", mt: 1, color: "text.secondary", fontWeight: 600 }}
      >
        {level.nextXp !== null
          ? // Framed in matches rather than raw XP: "3 more matchdays" is a
            // target a fan can act on, "410 XP" is not.
            `${toNext.toLocaleString()} XP to the next level — about ${Math.max(
              1,
              Math.ceil(toNext / MAX_MATCH_XP),
            )} more matchday${Math.ceil(toNext / MAX_MATCH_XP) === 1 ? "" : "s"}`
          : "Top level reached. Nothing left to climb."}
      </Typography>

      {!compact && (
        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <Stat label="SEASON" value={`${seasonXp.toLocaleString()} XP`} />
          <Stat label="MATCHES" value={String(matchesParticipated)} />
        </Stack>
      )}
    </Paper>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={(t) => ({
      flex: 1,
      minWidth: 0,
      borderRadius: "10px",
      px: 1,
      py: 1,
      textAlign: "center",
      border: `1px solid ${t.palette.divider}`,
    })}
  >
    <Typography
      variant="caption"
      noWrap
      sx={{
        display: "block",
        fontWeight: 900,
        fontSize: "0.6rem",
        letterSpacing: 1,
        opacity: 0.65,
      }}
    >
      {label}
    </Typography>
    {/* nowrap: at drawer width "640 XP" was breaking across two lines and
        knocking the two tiles out of alignment. */}
    <Typography
      noWrap
      sx={{ fontWeight: 900, fontSize: "1.05rem", lineHeight: 1.3 }}
    >
      {value}
    </Typography>
  </Box>
);
