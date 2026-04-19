"use client";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Box, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
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

  const { result, rating } = useMemo(() => {
    const isHome = fixture.teams.home.id === myClubId;
    const homeWin = fixture.teams.home.winner;
    const awayWin = fixture.teams.away.winner;

    let res = "D";
    if (isHome) {
      if (homeWin) res = "W";
      else if (awayWin) res = "L";
    } else {
      if (awayWin) res = "W";
      else if (homeWin) res = "L";
    }

    return {
      result: res,
      rating: ratingData.totalRating / (ratingData.totalSubmits || 1),
    };
  }, [fixture, myClubId, ratingData]);

  const resultColor = getResultColor(result, theme);
  const ratingColor = getRatingColor(rating);
  const date = new Date(fixture.fixture.timestamp * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        href={`/${clubSlug}/fixture/${fixture.id}`}
        style={{ textDecoration: "none", display: "block", color: "inherit" }}
      >
        <Box
          sx={(t: any) => ({
            ...t.clay?.card,
            cursor: "pointer",
            overflow: "hidden",
            transition: "transform 0.25s cubic-bezier(0.2, 0, 0, 1)",
            "&:hover": { transform: "translateY(-2px)" },
            "&:active": { transform: "scale(0.98)" },
          })}
        >
          {/* Top row: date | result + rating */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              pt: 1.5,
              pb: 0.75,
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "text.secondary",
                opacity: 0.65,
                letterSpacing: 0.3,
                textTransform: "uppercase",
              }}
            >
              {format(date, "EEE d MMM")}
            </Typography>

            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 900,
                color: resultColor,
                bgcolor: `${resultColor}22`,
                px: 0.9,
                py: 0.3,
                borderRadius: "6px",
                letterSpacing: 0.5,
                flexShrink: 0,
              }}
            >
              {result} · {fixture.score.fulltime.home}-{fixture.score.fulltime.away}
            </Typography>
          </Box>

          {/* Main row: home | score | away */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              pb: 1.75,
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: 1,
                minWidth: 0,
              }}
            >
              <Box
                component="img"
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                sx={{
                  width: 30,
                  height: 30,
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fixture.teams.home.name}
              </Typography>
            </Box>

            <Box
              sx={(t: any) => ({
                ...t.clay?.box,
                flexShrink: 0,
                textAlign: "center",
                minWidth: 84,
                px: 1.75,
                py: 1,
                borderRadius: "14px",
                border: `1px solid ${ratingColor}33`,
              })}
            >
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: "1.75rem",
                  color: ratingColor,
                  lineHeight: 1,
                }}
              >
                {rating.toFixed(1)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.5rem",
                  fontWeight: 700,
                  color: "text.secondary",
                  opacity: 0.55,
                  letterSpacing: 1,
                  mt: 0.5,
                }}
              >
                RATING
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: 1,
                minWidth: 0,
                justifyContent: "flex-end",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "right",
                }}
              >
                {fixture.teams.away.name}
              </Typography>
              <Box
                component="img"
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                sx={{
                  width: 30,
                  height: 30,
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
            </Box>
          </Box>
        </Box>
      </Link>
    </motion.div>
  );
}
