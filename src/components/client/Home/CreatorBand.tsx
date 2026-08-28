"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";

/**
 * The one thing on the homepage aimed at someone who already has a community
 * around them, rather than someone looking for a club hub to join.
 *
 * Deliberately a teaser, not the pitch: the detail lives on /private-clubs.
 * Placed after ClubFinder so it reads as "…or, if you already have a
 * following, here is the other way in" rather than interrupting the join flow.
 */
export default function CreatorBand() {
  const theme = useTheme() as any;

  return (
    <Box
      sx={(t) => ({
        py: { xs: 8, md: 11 },
        bgcolor: alpha(t.palette.primary.main, 0.05),
        borderTop: `1px solid ${t.palette.divider}`,
      })}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <Stack spacing={2.5} alignItems="center" sx={{ textAlign: "center" }}>
            <Box
              sx={(t) => ({
                px: 1.25,
                py: 0.5,
                borderRadius: 2,
                bgcolor: alpha(t.palette.primary.main, 0.14),
                color: "text.primary",
                fontSize: "0.7rem",
                fontWeight: 900,
                letterSpacing: 2,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
              })}
            >
              <Lock size={13} />
              FOR COMMUNITIES
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                letterSpacing: -0.5,
                fontSize: { xs: "1.75rem", md: "2.25rem" },
              }}
            >
              Give your community a club of its own
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ fontSize: "1.1rem", maxWidth: 580, lineHeight: 1.6 }}
            >
              Follow one Premier League side? A private club gives your
              community its own members-only home — its own player ratings, a
              consensus XI, a live mood curve and a full ratings card after
              every match. Your members&apos; numbers, nobody else&apos;s.
            </Typography>

            <Button
              component={Link}
              href="/private-clubs"
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{
                ...theme.clay?.button,
                mt: 1,
                px: 4,
                py: 1.5,
                fontWeight: 900,
                fontSize: "1rem",
              }}
            >
              See how private clubs work
            </Button>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}
