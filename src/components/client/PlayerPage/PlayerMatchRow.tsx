// src/app/[clubSlug]/players/[playerId]/PlayerMatchRow.tsx
"use client";
import { getRatingColor, getResultColor } from "@/lib/utils/football-logic";
import {
  Paper,
  Box,
  Avatar,
  Typography,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PlayerMatchRow({
  fixture,
  ratingData,
  index,
  playerId,
  clubId,
}: any) {
  const theme = useTheme() as any;

  const { clubSlug } = useParams();

  const rating = ratingData.totalRating / (ratingData.totalSubmits || 1);

  const clubIdNum = Number(clubId);

  // 1. Result Logic
  const isHome = fixture.teams.home.id === clubIdNum;
  const homeWin = fixture.teams.home.winner;
  const awayWin = fixture.teams.away.winner;

  let result = "D";
  if ((isHome && homeWin) || (!isHome && awayWin)) result = "W";
  else if ((isHome && awayWin) || (!isHome && homeWin)) result = "L";

  const statusColor = getResultColor(result, theme);

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
            borderLeft: `6px solid ${statusColor}`,
            transition: "transform 0.2s",
            "&:hover": { transform: "translateX(5px)" },
          }}
        >
          <Box sx={{ minWidth: 60, textAlign: "center", mr: 2 }}>
            <Typography
              variant="caption"
              fontWeight={800}
              display="block"
              color="text.secondary"
            >
              {new Date(fixture.fixture.timestamp * 1000).toLocaleDateString(
                "en-GB",
                { weekday: "short" },
              )}
            </Typography>
            <Typography variant="body2" fontWeight={900}>
              {new Date(fixture.fixture.timestamp * 1000).toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "short" },
              )}
            </Typography>
          </Box>

          <Avatar
            src={fixture.teams.away.logo}
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
              vs {fixture.teams.away.name}
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
              bgcolor: getRatingColor(rating),
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
