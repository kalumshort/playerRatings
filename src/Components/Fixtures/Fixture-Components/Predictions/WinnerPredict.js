import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  useTheme,
  Fade,
  alpha,
  Chip,
} from "@mui/material";
import {
  CheckCircle,
  EmojiEvents,
  Groups,
  HourglassEmpty,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

// --- HOOKS & FIREBASE ---
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

  // --- LOGIC GATE: DETERMINING VIEW STATE ---
  // 1. If no user is signed in, force show results (Read-only mode).
  // 2. If user is signed in, show results only after they have voted.
  const showResults = !user || !!usersMatchData?.result;
  const userChoice = usersMatchData?.result;

  const {
    totalVotes = 0,
    draw = 0,
    away = 0,
    home = 0,
  } = matchPredictions?.result || {};

  // Safeguard: Ensure we don't divide by zero for guests viewing empty games
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
      })
    );
  };

  // --- STYLES (Glassmorphism) ---
  const optionCardStyles = (choice) => {
    const isSelected = userChoice === choice;
    const pct = percentages[choice];
    const hasData = totalVotes > 0;

    return {
      flex: 1,
      p: 2,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      cursor: showResults ? "default" : "pointer",
      borderRadius: "16px",
      border: "1px solid",
      borderColor: isSelected
        ? theme.palette.primary.main
        : alpha(theme.palette.divider, 0.1),
      backgroundColor: isSelected
        ? alpha(theme.palette.primary.main, 0.05)
        : alpha(theme.palette.background.paper, 0.2),
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      minHeight: 120,

      // Progress bar background (Only visible if results are being shown and data exists)
      "&::before": {
        content: '""',
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: showResults && hasData ? `${pct}%` : "0%",
        bgcolor: isSelected
          ? alpha(theme.palette.primary.main, 0.2)
          : alpha(theme.palette.text.disabled, 0.1),
        transition: "height 1s ease-out",
        zIndex: 0,
      },

      "&:hover": !showResults && {
        borderColor: theme.palette.primary.main,
        transform: "translateY(-4px)",
        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
        bgcolor: alpha(theme.palette.background.paper, 0.4),
      },
    };
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        textAlign: "center",
        minHeight: "260px",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header Section */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <EmojiEvents color="primary" sx={{ fontSize: 18 }} />
          <Typography
            variant="button"
            sx={{
              letterSpacing: 2,
              fontSize: "0.7rem",
              fontWeight: 900,
              opacity: 0.8,
            }}
          >
            Winner Consensus
          </Typography>
        </Stack>

        {totalVotes > 0 ? (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ opacity: 0.6 }}
          >
            <Groups sx={{ fontSize: 14 }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {totalVotes} {totalVotes === 1 ? "VOTE" : "VOTES"}
            </Typography>
          </Stack>
        ) : (
          <Chip
            size="small"
            icon={<HourglassEmpty style={{ fontSize: "12px" }} />}
            label={user ? "BE THE FIRST" : "AWAITING DATA"}
            variant="outlined"
            sx={{
              height: 20,
              fontSize: "0.6rem",
              fontWeight: 900,
              opacity: 0.5,
            }}
          />
        )}
      </Stack>

      {/* Main Options Grid */}
      <Stack direction="row" spacing={2} sx={{ width: "100%", flexGrow: 1 }}>
        {["home", "draw", "away"].map((type) => (
          <Box
            key={type}
            component={motion.div}
            layout
            onClick={() => handleWinningTeamPredict(type)}
            sx={optionCardStyles(type)}
          >
            <Box sx={{ zIndex: 1, textAlign: "center" }}>
              {type === "draw" ? (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    mb: 1,
                    mx: "auto",
                    borderRadius: "50%",
                    border: `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "1.2rem",
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  }}
                >
                  X
                </Box>
              ) : (
                <Avatar
                  src={fixture.teams[type].logo}
                  sx={{
                    width: 40,
                    height: 40,
                    mb: 1,
                    mx: "auto",
                    filter:
                      showResults && totalVotes === 0 ? "grayscale(1)" : "none",
                  }}
                />
              )}

              <Typography
                variant="caption"
                sx={{ fontWeight: 900, display: "block", fontSize: "0.65rem" }}
              >
                {type.toUpperCase()}
              </Typography>

              <AnimatePresence>
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    sx={{ mt: 0.5 }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: "1.2rem",
                        fontWeight: 900,
                        color:
                          userChoice === type ? "primary.main" : "text.primary",
                      }}
                    >
                      {totalVotes > 0
                        ? `${Math.round(percentages[type])}%`
                        : "-%"}
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Box>
        ))}
      </Stack>

      {/* Footer / Feedback Section */}
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
                <CheckCircle color="primary" sx={{ fontSize: 16 }} />
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ fontWeight: 900, textTransform: "uppercase" }}
                >
                  {totalVotes === 0
                    ? "Vote Recorded"
                    : `Locked In: ${userChoice}`}
                </Typography>
              </Stack>
            ) : (
              <Typography
                variant="caption"
                sx={{ opacity: 0.5, fontStyle: "italic" }}
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
