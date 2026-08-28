"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Container,
  Grid,
  IconButton,
  InputBase,
  Paper,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { DirectoryClub } from "@/lib/clubDirectory";

/**
 * The club picker. Condensed from the old two-paragraph section into a single
 * line plus the grid — the grid is the one genuinely real, interactive thing on
 * this page and it should be doing the talking.
 *
 * Cards are smaller and the whole card is the link; the old "Enter" button was
 * a second control for the same destination.
 */
export default function ClubFinder({ clubs }: { clubs: DirectoryClub[] }) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");

  // Every club, always. This used to show clubs.slice(0, 4) until you typed,
  // which hid the one genuinely real thing on the page behind a search box.
  const displayedTeams = clubs.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Container id="clubs" maxWidth="lg" sx={{ scrollMarginTop: 80, py: { xs: 8, md: 12 } }}>
      <Typography
        variant="h4"
        align="center"
        sx={{ fontWeight: 900, letterSpacing: -0.5, mb: 1, fontSize: { xs: "1.75rem", md: "2.25rem" } }}
      >
        Find your club
      </Typography>

      {/* The count comes from the directory, never a literal — the nightly
          reconcile changes which clubs exist when teams go up or down. */}
      <Typography
        align="center"
        sx={{ mb: 4, color: "text.secondary", fontSize: "1.05rem" }}
      >
        {clubs.length > 0 && (
          <Box component="span" sx={{ fontWeight: 800, color: "text.primary" }}>
            All {clubs.length} Premier League clubs.{" "}
          </Box>
        )}
        No account needed to look around.
      </Typography>

      <Paper
        sx={{
          p: 1,
          mb: 5,
          mx: "auto",
          maxWidth: 460,
          display: "flex",
          alignItems: "center",
          borderRadius: "10px",
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
        }}
      >
        <IconButton sx={{ ml: 0.5 }} disabled aria-label="Search clubs">
          <Search />
        </IconButton>
        <InputBase
          placeholder="Search for your club..."
          sx={{ flex: 1, ml: 1, fontWeight: 600, fontSize: "1.05rem" }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Paper>

      <Grid container spacing={2} justifyContent="center">
        <AnimatePresence mode="popLayout">
          {displayedTeams.map((team, index) => (
            <Grid size={{ xs: 4, sm: 3, md: 2 }} key={team.teamId}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                // Capped so the last club in a 20-card grid doesn't wait a
                // full second to appear.
                transition={{ delay: Math.min(index, 8) * 0.04 }}
              >
                <ClubCard team={team} />
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>

      {/* Two different empty states. The directory genuinely can be empty —
          it's rebuilt nightly — and rendering nothing at all looks broken. */}
      {displayedTeams.length === 0 && (
        <Typography
          align="center"
          color="text.secondary"
          sx={{ py: 6, fontSize: "1.05rem" }}
        >
          {clubs.length === 0
            ? "Clubs are being set up for the new season — check back shortly."
            : `No club matches "${searchTerm}".`}
        </Typography>
      )}
    </Container>
  );
}

const ClubCard = ({ team }: { team: DirectoryClub }) => {
  const theme = useTheme() as any;

  return (
    <Link href={`/${team.slug}`} style={{ textDecoration: "none" }}>
      <Paper
        sx={{
          ...theme.clay?.card,
          p: 1.75,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 1,
          height: "100%",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          border: "1px solid transparent",
          "@media (hover: hover)": {
            "&:hover": {
              borderColor: theme.palette.primary.main,
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[2],
            },
          },
        }}
      >
        <Avatar
          src={team.logoUrl}
          alt=""
          sx={{ width: { xs: 44, md: 52 }, height: { xs: 44, md: 52 }, bgcolor: "transparent" }}
          imgProps={{ style: { objectFit: "contain" }, loading: "lazy" }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            lineHeight: 1.25,
            color: "text.primary",
            fontSize: "0.72rem",
          }}
        >
          {team.name}
        </Typography>
      </Paper>
    </Link>
  );
};
