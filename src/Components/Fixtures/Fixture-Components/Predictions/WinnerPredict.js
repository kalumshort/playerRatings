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
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

// --- HOOKS ---
import { handlePredictWinningTeam } from "../../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";
import { selectPredictionsByMatchId } from "../../../../Selectors/predictionsSelectors";
import useGroupData from "../../../../Hooks/useGroupsData";
import { useAuth } from "../../../../Providers/AuthContext";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import useGlobalData from "../../../../Hooks/useGlobalData";

export default function WinnerPredict({ fixture }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const globalData = useGlobalData();

  const usersMatchData = useSelector(selectUserMatchData(fixture.id));
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));

  const showResults = !user || !!usersMatchData?.result;
  const userChoice = usersMatchData?.result;

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

  const handleWinningTeamPredict = async (choice) => {
    if (showResults || !user) return;

    await handlePredictWinningTeam({
      matchId: fixture.id,
      choice: choice,
      groupId: activeGroup.groupId,
      userId: user.uid,
      currentYear: globalData.currentYear,
    });

    dispatch(
      fetchMatchPredictions({
        matchId: fixture.id,
        groupId: activeGroup.groupId,
        currentYear: globalData.currentYear,
      }),
    );
  };

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 3,
        textAlign: "center",
        minHeight: "260px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      {/* --- HEADER --- */}

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <EmojiEventsRounded color="primary" sx={{ fontSize: 20 }} />
        <Typography
          variant="button"
          sx={{
            letterSpacing: 1.5,
            opacity: 0.8,
            fontWeight: 900,
            fontSize: "0.75rem",
          }}
        >
          WINNER CONSENSUS
        </Typography>
      </Stack>

      {/* --- OPTIONS GRID --- */}
      <Stack direction="row" spacing={2} sx={{ width: "100%", flexGrow: 1 }}>
        {["home", "draw", "away"].map((type) => {
          const isSelected = userChoice === type;
          const pct = percentages[type];

          return (
            <Box
              key={type}
              component={motion.div}
              layout
              onClick={() => handleWinningTeamPredict(type)}
              sx={(theme) => ({
                flex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: showResults ? "default" : "pointer",
                borderRadius: "20px",
                overflow: "hidden",
                minHeight: 130,
                transition: "all 0.2s ease",

                // 2. Dynamic Clay State
                // If selected or results shown -> Pressed Box (Inset)
                // If interactive -> Floating Button (Outset)
                ...(showResults || isSelected
                  ? theme.clay.box
                  : theme.clay.button),

                // Active Border
                border: isSelected
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.divider}`,

                "&:hover": !showResults && {
                  transform: "translateY(-4px)",
                  borderColor: theme.palette.primary.main,
                },
              })}
            >
              {/* Progress Fill Background */}
              {showResults && totalVotes > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: `${pct}%`,
                    bgcolor: isSelected
                      ? `${theme.palette.primary.main}20` // Faint highlight
                      : "action.hover",
                    transition: "height 1s cubic-bezier(0.4, 0, 0.2, 1)",
                    zIndex: 0,
                  }}
                />
              )}

              {/* Content Layer */}
              <Box sx={{ zIndex: 1, textAlign: "center", width: "100%" }}>
                {type === "draw" ? (
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      mb: 1.5,
                      mx: "auto",
                      borderRadius: "50%",
                      bgcolor: "background.paper",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "1.2rem",
                      color: "text.secondary",
                      border: "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    X
                  </Box>
                ) : (
                  <Avatar
                    src={fixture.teams[type].logo}
                    sx={{
                      borderRadius: "8px",
                      width: 45,
                      height: 45,
                      mb: 1.5,
                      mx: "auto",
                      // Grayscale if results are shown but no votes yet
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
                    fontSize: "0.7rem",
                    color: "text.secondary",
                    textTransform: "uppercase",
                  }}
                >
                  {type === "draw" ? "DRAW" : type}
                </Typography>

                <AnimatePresence>
                  {showResults && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontSize: "1.4rem",
                          fontWeight: 900,
                          mt: 0.5,
                          color: isSelected ? "primary.main" : "text.primary",
                        }}
                      >
                        {totalVotes > 0
                          ? `${Math.round(percentages[type])}%`
                          : "-"}
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
      {showResults && (
        <Fade in timeout={800}>
          <Box sx={{ mt: 3 }}>
            {user ? (
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={1}
              >
                <CheckCircleRounded color="primary" sx={{ fontSize: 18 }} />
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {totalVotes === 0
                    ? "Vote Recorded"
                    : `LOCKED IN: ${userChoice}`}
                </Typography>
              </Stack>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  opacity: 0.6,
                  fontStyle: "italic",
                  color: "text.secondary",
                }}
              >
                Sign in to add your vote to the consensus.
              </Typography>
            )}
          </Box>
        </Fade>
      )}
    </Paper>
  );
}
