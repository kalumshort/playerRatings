"use client";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Paper,
  Box,
  Avatar,
  Typography,
  useTheme,
  alpha,
  Chip,
  useMediaQuery,
} from "@mui/material";
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

  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < ~600px

  const { opponent, result, rating } = useMemo(() => {
    const isHome = fixture.teams.home.id === myClubId;
    const opponentData = isHome ? fixture.teams.away : fixture.teams.home;

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
      opponent: opponentData,
      result: res,
      rating: ratingData.totalRating / (ratingData.totalSubmits || 1),
    };
  }, [fixture, myClubId, ratingData]);

  const statusColor = getResultColor(result, theme);
  const date = new Date(fixture.fixture.timestamp * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Link
        href={`/${clubSlug}/fixture/${fixture.id}`}
        style={{ textDecoration: "none", display: "block" }}
      >
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            p: { xs: 1.5, sm: 2 },
            gap: { xs: 1.5, sm: 2.5 },
            position: "relative",
            overflow: "hidden",
            transition: "all 0.25s ease",
            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: `0 12px 32px ${alpha(statusColor, 0.18)}`,
            },
          }}
        >
          {/* Result accent bar – thinner on mobile */}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: { xs: 4, sm: 5 },
              bgcolor: statusColor,
              opacity: 0.85,
            }}
          />

          {/* Compact date */}
          <Box
            sx={{
              minWidth: { xs: 54, sm: 72 },
              textAlign: "center",
              py: { xs: 0.75, sm: 1 },
              px: { xs: 1, sm: 1.5 },
              borderRadius: "10px",
              bgcolor: alpha(theme.palette.background.default, 0.35),
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.65rem", sm: "0.75rem" },
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              {date.toLocaleDateString("en-GB", { weekday: "short" })}
            </Typography>
            <Typography
              variant="subtitle2"
              fontWeight={900}
              lineHeight={1}
              sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              {date.getDate()}
              <Typography
                component="span"
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{ ml: 0.5, fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
              >
                {date.toLocaleDateString("en-GB", { month: "short" })}
              </Typography>
            </Typography>
          </Box>

          {/* Smaller logo on mobile */}
          <Avatar
            src={opponent.logo}
            variant="square"
            sx={{
              width: { xs: 36, sm: 48 },
              height: { xs: 36, sm: 48 },
              borderRadius: "10px",
              bgcolor: alpha(theme.palette.background.default, 0.25),
              "& img": { objectFit: "contain", p: 0.5 },
              boxShadow: `0 3px 10px ${alpha("#000", 0.1)}`,
            }}
          />

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              noWrap
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                mb: 0.25,
              }}
            >
              vs {opponent.name}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.75, sm: 1 },
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={`${fixture.score.fulltime.home} - ${fixture.score.fulltime.away}`}
                size="small"
                sx={{
                  fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                  height: { xs: 20, sm: 24 },
                  minWidth: { xs: 60, sm: 72 },
                  fontWeight: 800,
                  borderRadius: "10px",
                  bgcolor: alpha(theme.palette.text.primary, 0.07),
                }}
              />
              <Chip
                label={result}
                size="small"
                color={
                  result === "W"
                    ? "success"
                    : result === "L"
                      ? "error"
                      : "default"
                }
                sx={{
                  fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                  height: { xs: 20, sm: 24 },
                  minWidth: 32,
                  fontWeight: 900,
                  borderRadius: "10px",
                }}
              />
            </Box>
          </Box>

          {/* Smaller rating circle on mobile */}
          <Box
            sx={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: { xs: 52, sm: 64 },
              height: { xs: 52, sm: 64 },
              borderRadius: "50%",
              background: `conic-gradient(${getRatingColor(
                rating,
              )} 0deg, ${alpha(getRatingColor(rating), 0.16)} 360deg)`,
              p: { xs: "2px", sm: "3px" },
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                bgcolor: theme.palette.background.paper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `inset 0 2px 6px ${alpha("#000", 0.08)}`,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={900}
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  color: getRatingColor(rating),
                  lineHeight: 1,
                }}
              >
                {rating.toFixed(1)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Link>
    </motion.div>
  );
}
