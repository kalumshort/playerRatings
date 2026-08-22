"use client";

import React from "react";
import { Box, Chip, Grid, Stack, Typography, alpha } from "@mui/material";
import { motion } from "framer-motion";

/**
 * One feature: a short headline, one sentence, a row of hard specifics, and a
 * live demo panel.
 *
 * The `specs` chips exist to keep the body copy to a single sentence. Concrete
 * numbers — "19 formations", "opens at 80'" — read better as scannable chips
 * than as clauses, and this page's whole problem was clauses.
 */
export interface FeatureRowProps {
  eyebrow: string;
  title: string;
  body: string;
  /** Short factual chips. Every one must map to something the app does. */
  specs?: string[];
  demo: React.ReactNode;
  /** Puts the demo on the left. Alternated down the page by the caller. */
  reverse?: boolean;
}

export default function FeatureRow({
  eyebrow,
  title,
  body,
  specs = [],
  demo,
  reverse = false,
}: FeatureRowProps) {
  return (
    <Grid
      container
      spacing={{ xs: 4, md: 8 }}
      alignItems="center"
      direction={reverse ? "row-reverse" : "row"}
    >
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, x: reverse ? 30 : -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <Stack spacing={2}>
            {/* A tinted pill, not coloured text. `primary.main` is #93BFEC —
                as an overline on the light surface (#ECECF0) that's ~1.7:1 and
                genuinely unreadable. On a tint with `text.primary` it works in
                both modes without a mode branch. */}
            <Box
              sx={(t) => ({
                alignSelf: "flex-start",
                px: 1.25,
                py: 0.5,
                borderRadius: 2,
                bgcolor: alpha(t.palette.primary.main, 0.14),
                color: "text.primary",
                fontSize: "0.7rem",
                fontWeight: 900,
                letterSpacing: 2,
                lineHeight: 1.4,
              })}
            >
              {eyebrow}
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "1.85rem", md: "2.6rem" },
                letterSpacing: -0.5,
                lineHeight: 1.1,
              }}
            >
              {title}
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ fontSize: "1.1rem", lineHeight: 1.6, maxWidth: 460 }}
            >
              {body}
            </Typography>

            {specs.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  pt: 0.5,
                  maxWidth: 480,
                }}
              >
                {specs.map((spec) => (
                  // Outlined, so the specs read as a different kind of thing
                  // from the eyebrow pill above them rather than a second row
                  // of the same badge.
                  <Chip
                    key={spec}
                    label={spec}
                    size="small"
                    variant="outlined"
                    sx={(t) => ({
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      borderColor: t.palette.divider,
                      color: "text.secondary",
                      bgcolor: "transparent",
                    })}
                  />
                ))}
              </Box>
            )}
          </Stack>
        </motion.div>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          {demo}
        </motion.div>
      </Grid>
    </Grid>
  );
}
