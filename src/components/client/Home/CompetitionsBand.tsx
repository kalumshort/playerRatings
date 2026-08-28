"use client";

import { Avatar, Box, Container, Stack, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";

/**
 * "You join a Premier League club, but you follow every match it plays."
 *
 * This was the single most misread thing about the product and the old page
 * only said it obliquely, inside a feature tile ("Every fixture, league and
 * cup"). The nightly job fetches fixtures per *team*, not per league, so a
 * club's hub genuinely carries its cup and European nights too.
 *
 * Logos come from the same API-Football CDN as the club crests, so there is no
 * asset to keep and next.config's remotePatterns already allows the host.
 */
const COMPETITIONS = [
  { id: 39, name: "Premier League" },
  { id: 45, name: "FA Cup" },
  { id: 48, name: "EFL Cup" },
  { id: 2, name: "Champions League" },
  { id: 3, name: "Europa League" },
];

const logoFor = (id: number) =>
  `https://media.api-sports.io/football/leagues/${id}.png`;

export default function CompetitionsBand() {
  return (
    <Box
      sx={(t) => ({
        py: { xs: 8, md: 11 },
        bgcolor: alpha(t.palette.secondary.main, 0.05),
        borderTop: `1px solid ${t.palette.divider}`,
        borderBottom: `1px solid ${t.palette.divider}`,
      })}
    >
      <Container maxWidth="md" sx={{ textAlign: "center" }}>
        <Stack spacing={2} alignItems="center">
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, letterSpacing: -0.5, fontSize: { xs: "1.75rem", md: "2.25rem" } }}
          >
            One club. Every competition.
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ fontSize: "1.1rem", maxWidth: 520, lineHeight: 1.6 }}
          >
            Join a Premier League club and follow every match it plays — not just
            the league ones.
          </Typography>

          <Stack
            direction="row"
            spacing={{ xs: 2, sm: 4 }}
            justifyContent="center"
            sx={{ pt: 3, flexWrap: "wrap", gap: { xs: 2, sm: 0 } }}
          >
            {COMPETITIONS.map((comp, i) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                <Stack alignItems="center" spacing={1} sx={{ width: 88 }}>
                  <Box
                    sx={(t) => ({
                      width: 54,
                      height: 54,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: t.palette.background.paper,
                      border: `1px solid ${t.palette.divider}`,
                    })}
                  >
                    <Avatar
                      src={logoFor(comp.id)}
                      alt={comp.name}
                      sx={{ width: 32, height: 32, bgcolor: "transparent" }}
                      imgProps={{ style: { objectFit: "contain" }, loading: "lazy" }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, fontSize: "0.7rem", lineHeight: 1.3 }}
                  >
                    {comp.name}
                  </Typography>
                </Stack>
              </motion.div>
            ))}
          </Stack>

          <Typography
            variant="body2"
            sx={{ pt: 3, color: "text.secondary", opacity: 0.8, maxWidth: 480 }}
          >
            You follow one club at a time. Switching is a transfer, with a 30-day
            wait — which is what keeps a consensus honest.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
