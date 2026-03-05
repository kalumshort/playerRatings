"use client";

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  useTheme,
  Fade,
} from "@mui/material";
import { CheckCircleRounded, EmojiEventsRounded } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/lib/redux/store";
import { handlePredictWinningTeam } from "@/lib/firebase/client-actions";

interface WinnerPredictProps {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
  isPreMatch: boolean;
}

export default function WinnerPredict({
  fixture,
  groupId,
  currentYear,
  groupData,
  isPreMatch,
}: WinnerPredictProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const matchId = String(fixture.id);

  const usersMatchData = useSelector(
    (state: RootState) => state.userData.matches[matchId],
  );

  const matchPredictions = useSelector(
    (state: RootState) => state.predictions.byGroupId[groupId]?.[matchId],
  );

  const userChoice = usersMatchData?.result;
  const showResults = !isPreMatch || !user || !!userChoice;

  const {
    totalVotes = 0,
    draw = 0,
    away = 0,
    home = 0,
  } = matchPredictions?.result || {};

  const percentages = {
    home: totalVotes > 0 ? (home / totalVotes) * 100 : 0,
    draw: totalVotes > 0 ? (draw / totalVotes) * 100 : 0,
    away: totalVotes > 0 ? (away / totalVotes) * 100 : 0,
  };

  const handleWinningTeamPredict = async (choice: string) => {
    if (showResults || !user || !groupId) return;

    await handlePredictWinningTeam({
      matchId,
      choice: choice as "home" | "draw" | "away",
      groupId,
      userId: user.uid,
      currentYear,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // Space items out evenly to fill the parent height
        justifyContent: "space-between",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* --- HEADER --- */}
      <Stack direction="row" spacing={1} alignItems="center">
        <EmojiEventsRounded color="primary" sx={{ fontSize: 20 }} />
        <Typography
          variant="h4"
          sx={{
            letterSpacing: 1.5,
            fontWeight: 900,
            fontSize: "0.75rem",
          }}
        >
          WINNER CONSENSUS
        </Typography>
      </Stack>

      {/* --- OPTIONS GRID --- */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          width: "100%",
          my: 2, // Margin to keep it away from header/footer
          alignItems: "center", // Vertically center the row
          justifyContent: "center",
        }}
      >
        {(["home", "draw", "away"] as const).map((type) => {
          const isSelected = userChoice === type;
          const pct = percentages[type];

          return (
            <Box
              key={type}
              component={motion.div}
              layout
              onClick={() => handleWinningTeamPredict(type)}
              sx={(theme: any) => ({
                // flex: 1 makes them equal width, but we remove the height stretch
                flex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: showResults ? "default" : "pointer",
                borderRadius: "20px",
                overflow: "hidden",
                // Reduced height to prevent vertical "bigness"
                py: 2,
                px: 1,
                transition: "all 0.2s ease",

                ...(showResults || isSelected
                  ? theme.clay?.box
                  : theme.clay?.button),

                border: isSelected
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.divider}`,

                "&:hover": !showResults && {
                  transform: "translateY(-4px)",
                  borderColor: theme.palette.primary.main,
                },
              })}
            >
              {showResults && totalVotes > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: `${pct}%`,
                    bgcolor: isSelected
                      ? `${theme.palette.primary.main}20`
                      : "action.hover",
                    transition: "height 1s cubic-bezier(0.4, 0, 0.2, 1)",
                    zIndex: 0,
                  }}
                />
              )}

              <Box sx={{ zIndex: 1, textAlign: "center", width: "100%" }}>
                {type === "draw" ? (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      mb: 1,
                      mx: "auto",
                      borderRadius: "50%",
                      bgcolor: "background.paper",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "1.1rem",
                      color: "text.secondary",
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    X
                  </Box>
                ) : (
                  <Avatar
                    src={fixture.teams[type].logo}
                    variant="rounded"
                    sx={{
                      width: 40,
                      height: 40,
                      mb: 1,
                      mx: "auto",
                      filter:
                        showResults && totalVotes === 0
                          ? "grayscale(1)"
                          : "none",
                    }}
                  />
                )}

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 900,
                    display: "block",
                    fontSize: "0.65rem",
                    color: "text.secondary",
                  }}
                >
                  {type.toUpperCase()}
                </Typography>

                <AnimatePresence>
                  {showResults && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontSize: "1.1rem",
                          fontWeight: 900,
                          mt: 0.5,
                          color: isSelected ? "primary.main" : "text.primary",
                        }}
                      >
                        {totalVotes > 0 ? `${Math.round(pct)}%` : "-"}
                      </Typography>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* --- FOOTER --- */}
      <Box sx={{ minHeight: "24px" }}>
        {showResults && (
          <Fade in timeout={800}>
            <Box>
              {user ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleRounded color="primary" sx={{ fontSize: 16 }} />
                  <Typography
                    variant="caption"
                    color="primary"
                    sx={{
                      fontWeight: 900,
                      textTransform: "uppercase",
                      fontSize: "0.65rem",
                    }}
                  >
                    {userChoice
                      ? `LOCKED IN: ${userChoice === "draw" ? "DRAW" : fixture.teams[userChoice].name}`
                      : "VOTE RECORDED"}
                  </Typography>
                </Stack>
              ) : (
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.6,
                    fontStyle: "italic",
                    fontSize: "0.65rem",
                  }}
                >
                  Sign in to vote.
                </Typography>
              )}
            </Box>
          </Fade>
        )}
      </Box>
    </Paper>
  );
}
