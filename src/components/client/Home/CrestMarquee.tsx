"use client";

import { Avatar, Box, useTheme } from "@mui/material";
import { DirectoryClub } from "@/lib/clubDirectory";

/**
 * An endlessly scrolling band of every club crest.
 *
 * This replaces two paragraphs of copy that used to claim the same thing in
 * words ("All 20 Premier League clubs"). The crests are the real ones from the
 * nightly-rebuilt directory, so the band is also self-correcting on promotion
 * and relegation.
 *
 * The track is rendered twice and translated by exactly -50%, which is what
 * makes the loop seamless — at the end of the cycle copy B sits precisely where
 * copy A started.
 */
export default function CrestMarquee({ clubs }: { clubs: DirectoryClub[] }) {
  const theme = useTheme();

  // The directory is genuinely empty on a cold season. An empty marquee is a
  // stray horizontal rule, so render nothing at all.
  if (clubs.length === 0) return null;

  // Duplicated for the loop. Keys are prefixed per copy because the same club
  // appears in both halves.
  const track = [
    ...clubs.map((c) => ({ ...c, key: `a-${c.teamId}` })),
    ...clubs.map((c) => ({ ...c, key: `b-${c.teamId}` })),
  ];

  const fade = `linear-gradient(90deg, transparent, ${theme.palette.common.black} 12%, ${theme.palette.common.black} 88%, transparent)`;

  return (
    <Box
      aria-hidden
      sx={{
        // The page must not grow to fit the track. Without this the duplicated
        // row sets the document width and every section inherits a horizontal
        // scrollbar.
        width: "100%",
        overflow: "hidden",
        py: 1,
        maskImage: fade,
        WebkitMaskImage: fade,
        "@keyframes crest-scroll": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 3, md: 5 },
          width: "max-content",
          animation: "crest-scroll 40s linear infinite",
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            // Without the animation the track is still 2x wide; let it scroll
            // by hand rather than clipping half the clubs off.
            overflowX: "auto",
          },
        }}
      >
        {track.map((club) => (
          <Avatar
            key={club.key}
            src={club.logoUrl}
            alt=""
            sx={{
              width: { xs: 34, md: 44 },
              height: { xs: 34, md: 44 },
              bgcolor: "transparent",
              flexShrink: 0,
              // Crests are a riot of clashing colours at this size; knocking
              // the saturation back keeps the band a texture, not a focal
              // point. Fully desaturated at 0.55 they vanished into the dark
              // surface, so keep a little colour and lift the opacity.
              filter: "grayscale(0.75)",
              opacity: 0.75,
            }}
            imgProps={{ style: { objectFit: "contain" }, loading: "lazy" }}
          />
        ))}
      </Box>
    </Box>
  );
}
