"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Grid,
  alpha,
  useTheme,
} from "@mui/material";
import { onSnapshot, doc } from "firebase/firestore";
import { clientDB } from "@/lib/firebase/client";
import { motion } from "framer-motion";

// Components

import { handleFixtureMood } from "@/lib/firebase/client-actions";
import MoodAreaChart from "./MoodAreaChart";
import { MOODS } from "./moodConfig";
import ParticleOverlay from "./ParticleOverlay";
import { useClubView } from "@/context/ClubViewProvider";
import { useAuth } from "@/context/AuthContext";

// Config

export const MoodSelector = ({
  groupId,
  fixture,
  currentYear,
  groupData,
  isGuestView,
}: any) => {
  const theme = useTheme();
  const [matchMoods, setMatchMoods] = useState<any>(null);
  const [particles, setParticles] = useState<any[]>([]);
  const { user } = useAuth();

  const matchId = String(fixture.fixture.id);
  const matchFinished = fixture.fixture.status.short === "FT";
  const timeElapsed = fixture.fixture.status.elapsed || 0;

  // 1. LIVE LISTENER (Better than polling)
  useEffect(() => {
    const docRef = doc(
      clientDB,
      `groups/${groupId}/seasons/${currentYear}/fixtureMoods`,
      matchId,
    );
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) setMatchMoods(snap.data());
    });
    return () => unsubscribe();
  }, [groupId, matchId, currentYear]);

  // 2. INTERACTION HANDLER
  const handleMoodClick = async (mood: any, e: React.MouseEvent) => {
    if (isGuestView || !user || matchFinished) return;

    // Trigger local particle animation immediately
    const id = Date.now();
    setParticles((prev) => [
      ...prev,
      { id, emoji: mood.emoji, x: e.clientX, y: e.clientY },
    ]);
    setTimeout(
      () => setParticles((prev) => prev.filter((p) => p.id !== id)),
      1000,
    );

    await handleFixtureMood({
      groupId,
      currentYear,
      matchId,
      timeElapsed,
      moodKey: mood.label,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "28px",
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Grid container>
        {/* ATMOSPHERE CHART */}
        <Grid
          sx={{
            height: 350,
            bgcolor: alpha(theme.palette.background.default, 0.5),
          }}
          size={{ xs: 12, md: 8 }}
        >
          {matchMoods ? (
            <MoodAreaChart matchMoods={matchMoods} />
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              height="100%"
              spacing={1}
            >
              <Typography
                variant="caption"
                sx={{ letterSpacing: 2, opacity: 0.5 }}
              >
                SYNCHRONIZING STADIUM PULSE...
              </Typography>
            </Stack>
          )}
        </Grid>

        {/* INTERACTION PANEL */}
        {!isGuestView && !matchFinished && (
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderLeft: { md: `1px solid ${theme.palette.divider}` },
            }}
          >
            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography variant="h6" fontWeight={900}>
                VIBE CHECK
              </Typography>
              <Typography variant="caption" color="text.secondary">
                TAP TO UPDATE THE LIVE TREND
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
              }}
            >
              {MOODS.map((mood) => (
                <IconButton
                  key={mood.label}
                  component={motion.button}
                  disabled={isGuestView || !user}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleMoodClick(mood, e)}
                  sx={{
                    fontSize: "2rem",
                    width: 70,
                    height: 70,
                    bgcolor: alpha(mood.color, 0.1),
                    border: `2px solid ${alpha(mood.color, 0.2)}`,
                    "&:hover": {
                      borderColor: mood.color,
                      bgcolor: alpha(mood.color, 0.2),
                    },
                  }}
                >
                  {mood.emoji}
                </IconButton>
              ))}
            </Box>
          </Grid>
        )}
      </Grid>
      <ParticleOverlay particles={particles} />
    </Paper>
  );
};
