"use client";

import { Box, Button, Chip, Container, Stack, Typography, alpha, useTheme } from "@mui/material";
import { ArrowForward, Bolt } from "@mui/icons-material";
import { motion } from "framer-motion";
import { DirectoryClub } from "@/lib/clubDirectory";
import CrestMarquee from "@/components/client/Home/CrestMarquee";

/**
 * The hero: one claim, one sentence, two buttons, then proof.
 *
 * The old hero carried three stacked paragraphs — a subhead, a "Premier League
 * clubs" line and a CTA caption. The crest marquee below now makes the scale
 * point visually, so only the subhead survives.
 */
export default function Hero({
  clubs,
  onSignUp,
  onBrowse,
}: {
  clubs: DirectoryClub[];
  onSignUp: () => void;
  onBrowse: () => void;
}) {
  const theme = useTheme() as any;

  return (
    <Box sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 4, md: 6 } }}>
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Stack spacing={3} alignItems="center">
            <Chip
              label="THE FAN CONSENSUS NETWORK"
              icon={<Bolt sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                fontWeight: 800,
                borderRadius: 2,
                px: 1,
              }}
            />

            <Typography
              variant="h1"
              sx={{
                // Fluid below md: a flat 3rem made "CLUB'S PULSE" wider than a
                // 375px screen, and that one line was stretching the whole
                // page's scroll width — every section inherited the overflow.
                fontSize: { xs: "clamp(2.25rem, 11vw, 3rem)", md: "5rem" },
                lineHeight: 0.9,
                letterSpacing: -1,
                fontWeight: 900,
              }}
            >
              OWN YOUR <br />
              <Box component="span" sx={{ color: "secondary.main" }}>
                CLUB&apos;S PULSE
              </Box>
            </Typography>

            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 520, fontWeight: 500, lineHeight: 1.5 }}
            >
              Predict it, pick the XI, live every minute, then rate them. Your
              club&apos;s votes become one matchday consensus.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ pt: 1, width: { xs: "100%", sm: "auto" } }}
            >
              <Button
                onClick={onSignUp}
                size="large"
                sx={{
                  ...theme.clay?.button,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 900,
                }}
                endIcon={<ArrowForward />}
              >
                Sign up free
              </Button>
              <Button
                onClick={onBrowse}
                size="large"
                sx={{
                  ...theme.clay?.button,
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 900,
                }}
              >
                Browse clubs
              </Button>
            </Stack>
          </Stack>
        </motion.div>
      </Container>

      <Box sx={{ mt: { xs: 5, md: 7 } }}>
        <CrestMarquee clubs={clubs} />
      </Box>
    </Box>
  );
}
