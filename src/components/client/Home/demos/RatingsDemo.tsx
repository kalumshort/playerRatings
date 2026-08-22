"use client";

import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Trophy } from "lucide-react";
import { ShowcasePlayer } from "@/lib/homepageShowcase";
import DemoFrame from "@/components/client/Home/DemoFrame";
import { getRatingColor } from "@/lib/utils/football-logic";

/**
 * Player ratings and the Fan Man of the Match.
 *
 * The gauge is a static replica of ClayRatingInput and the crown a static
 * replica of FanMOTMHighlight — both without Redux. Colours come from the real
 * `getRatingColor` ramp so the homepage can't drift from the app's own scale.
 *
 * The winner is a real player from a real squad. The vote share is illustrative
 * — the largest real MOTM result to date is a handful of votes.
 */
const EXAMPLE_RATING = 8.5;
const EXAMPLE_TEAM_AVG = 7.8;
const EXAMPLE_MOTM_SHARE = 38;

export default function RatingsDemo({ player }: { player: ShowcasePlayer | null }) {
  const theme = useTheme() as any;

  // Mirror FanMOTMHighlight rather than re-inventing its palette: the demo
  // should look like the thing it is demonstrating.
  const goldStart = theme.palette.motm?.goldStart || "#FFE27A";
  const goldEnd = theme.palette.motm?.goldEnd || "#F5B300";
  const trophyColor = theme.palette.motm?.bronze || theme.palette.common.white;
  const ratingColor = getRatingColor(EXAMPLE_RATING);

  return (
    <DemoFrame padded={false}>
      {/* --- MOTM crown --- */}
      <Box
        sx={{
          position: "relative",
          px: { xs: 3, md: 4 },
          pt: 5,
          pb: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: `radial-gradient(circle at 50% 0%, ${alpha(
            theme.palette.primary.main,
            0.18,
          )} 0%, ${theme.palette.background.paper} 65%)`,
        }}
      >
        <Chip
          label={`${EXAMPLE_MOTM_SHARE}% OF VOTES`}
          size="small"
          sx={{
            position: "absolute",
            top: 52,
            right: 18,
            fontWeight: 800,
            letterSpacing: 1,
            fontSize: "0.65rem",
          }}
        />

        <Box sx={{ position: "relative", mb: 1.5 }}>
          <Avatar
            src={player?.photo || undefined}
            alt={player?.name || "Man of the Match"}
            sx={{
              width: 104,
              height: 104,
              bgcolor: alpha(theme.palette.primary.main, 0.18),
              color: "primary.main",
              fontSize: "2.2rem",
              fontWeight: 900,
            }}
          >
            {player?.name?.charAt(0) ?? <Trophy size={40} />}
          </Avatar>
          <Box
            sx={{
              position: "absolute",
              bottom: -6,
              right: -6,
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(145deg, ${goldStart} 0%, ${goldEnd} 100%)`,
              boxShadow: `0 4px 12px ${alpha(goldEnd, 0.4)}`,
            }}
          >
            <Trophy size={20} color={trophyColor} strokeWidth={2.5} />
          </Box>
        </Box>

        <Typography
          variant="overline"
          sx={{ color: "primary.main", letterSpacing: 3, mb: 0.25, fontWeight: 900 }}
        >
          Man of the Match
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          {player?.name ?? "Voted by the fans"}
        </Typography>
      </Box>

      {/* --- The rating input --- */}
      <Box
        sx={(t) => ({
          px: { xs: 3, md: 4 },
          py: 2.5,
          borderTop: `1px solid ${t.palette.divider}`,
        })}
      >
        <Stack direction="row" alignItems="center" spacing={2.5} justifyContent="center">
          <GaugeKey glyph="−" />

          <Box sx={{ position: "relative", display: "grid", placeItems: "center" }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={92}
              thickness={3}
              sx={{ color: alpha(theme.palette.text.primary, 0.08) }}
            />
            <CircularProgress
              variant="determinate"
              value={EXAMPLE_RATING * 10}
              size={92}
              thickness={3}
              sx={{
                color: ratingColor,
                position: "absolute",
                // The track and the value must start from the same point.
                "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
              }}
            />
            <Typography
              sx={{
                position: "absolute",
                fontWeight: 900,
                fontSize: "1.7rem",
                color: ratingColor,
                // The ramp is pastel and fails contrast on a light surface, so
                // outline the glyph the way the real input does.
                ...(theme.palette.mode === "light"
                  ? {
                      WebkitTextStrokeWidth: "1px",
                      WebkitTextStrokeColor: "#18181B",
                      paintOrder: "stroke fill",
                    }
                  : {}),
              }}
            >
              {EXAMPLE_RATING.toFixed(1)}
            </Typography>
          </Box>

          <GaugeKey glyph="+" />
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <ResultTile label="YOUR VOTE" value={EXAMPLE_RATING.toFixed(1)} tint={ratingColor} />
          <ResultTile
            label="TEAM AVG"
            value={EXAMPLE_TEAM_AVG.toFixed(1)}
            tint={getRatingColor(EXAMPLE_TEAM_AVG)}
          />
        </Stack>
      </Box>
    </DemoFrame>
  );
}

const GaugeKey = ({ glyph }: { glyph: string }) => (
  <Box
    sx={(t) => ({
      width: 32,
      height: 32,
      borderRadius: "8px",
      display: "grid",
      placeItems: "center",
      fontWeight: 900,
      fontSize: "1.1rem",
      color: "text.secondary",
      border: `1px solid ${t.palette.divider}`,
    })}
  >
    {glyph}
  </Box>
);

function ResultTile({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <Box
      sx={(t) => ({
        flex: 1,
        borderRadius: "10px",
        px: 1.5,
        py: 1,
        textAlign: "center",
        border: `1px solid ${t.palette.divider}`,
        bgcolor: alpha(tint, 0.1),
      })}
    >
      <Typography
        variant="caption"
        sx={{ display: "block", fontWeight: 900, fontSize: "0.6rem", letterSpacing: 1, opacity: 0.65 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900, fontSize: "1.15rem" }}>{value}</Typography>
    </Box>
  );
}
