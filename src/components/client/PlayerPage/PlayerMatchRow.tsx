"use client";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Paper, Box, Avatar, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { getRatingColor, getResultColor } from "@/lib/utils/football-logic";

export default function PlayerMatchRow({
  fixture,
  ratingData,
  index,
  clubId,
}: any) {
  const theme = useTheme() as any;
  const { clubSlug } = useParams();
  const myClubId = Number(clubId);

  const { opponent, result, rating } = useMemo(() => {
    // Determine who the opponent is
    const isHome = fixture.teams.home.id === myClubId;
    const opponentData = isHome ? fixture.teams.away : fixture.teams.home;

    // Determine Match Result (W/L/D) based on user's club
    const homeWin = fixture.teams.home.winner;
    const awayWin = fixture.teams.away.winner;

    let res = "D"; // Default to Draw
    if (isHome) {
      if (homeWin) res = "W";
      else if (awayWin) res = "L";
    } else {
      if (awayWin) res = "W";
      else if (homeWin) res = "L";
    }

    return {
      opponent: opponentData,
      result: res,
      rating: ratingData.totalRating / (ratingData.totalSubmits || 1),
    };
  }, [fixture, myClubId, ratingData]);

  const statusColor = getResultColor(result, theme);
  const date = new Date(fixture.fixture.timestamp * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/${clubSlug}/fixture/${fixture.id}`}
        style={{ textDecoration: "none" }}
      >
        <Paper
          sx={{
            ...theme.clay?.card,
            display: "flex",
            alignItems: "center",
            p: 2,
            borderLeft: `3px solid ${statusColor}`,
            transition: "transform 0.2s",
            "&:hover": { transform: "translateX(5px)" },
          }}
        >
          <Box sx={{ minWidth: 60, textAlign: "center", mr: 2 }}>
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
            >
              {date.toLocaleDateString("en-GB", { weekday: "short" })}
            </Typography>
            <Typography variant="body2" fontWeight={900}>
              {date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </Typography>
          </Box>

          {/* Opponent Badge */}
          <Avatar
            src={opponent.logo}
            variant="rounded"
            sx={{
              width: 40,
              height: 40,
              mr: 2,
              "& img": { objectFit: "contain" },
            }}
          />

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight={800}>
              vs {opponent.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
            >
              {fixture.score.fulltime.home} - {fixture.score.fulltime.away}
            </Typography>
          </Box>

          <Box
            sx={{
              // Keep your dynamic background color
              bgcolor: getRatingColor(rating),

              // Automatically select black or white text based on the background
              color: theme.palette.getContrastText(getRatingColor(rating)),

              px: 1.5,
              py: 0.5,
              borderRadius: "8px",
              fontWeight: 900,
            }}
          >
            {rating.toFixed(1)}
          </Box>
        </Paper>
      </Link>
    </motion.div>
  );
}
