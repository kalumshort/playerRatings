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
import { isLive } from "@/lib/utils/football-logic";

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
  const isMatchLive = isLive(fixture);

  const matchId = String(fixture.fixture.id);

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
    if (isGuestView || !user || !isMatchLive) return;

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
  const showInteractionPanel = !isGuestView && isMatchLive;

  return (
    <Paper
      sx={{
        borderRadius: "12px",
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
          // 2. Dynamically adjust the size based on the panel's visibility
          size={{ xs: 12, md: showInteractionPanel ? 8 : 12 }}
        >
          {matchMoods ? (
            <MoodAreaChart matchMoods={matchMoods} events={fixture?.events} />
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
        {showInteractionPanel && (
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              p: { xs: 2, sm: 3, md: 3 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderLeft: { md: `1px solid ${theme.palette.divider}` },
              minWidth: 0,
            }}
          >
            <Box sx={{ mb: { xs: 2, md: 3 }, textAlign: "center" }}>
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
                gap: { xs: 1.5, md: 2 },
                width: "100%",
                justifyItems: "center",
                maxWidth: 360,
                mx: "auto",
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
                    fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
                    width: "100%",
                    maxWidth: 70,
                    height: "auto",
                    aspectRatio: "1 / 1",
                    p: 0,
                    minWidth: 0,
                    bgcolor: alpha(mood.color, 0.1),
                    border: `1px solid ${alpha(mood.color, 0.2)}`,
                    borderRadius: "50%",
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
