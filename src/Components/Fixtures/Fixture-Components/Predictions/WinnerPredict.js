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
} from "@mui/material";
import { CheckCircle, EmojiEvents, Groups } from "@mui/icons-material";
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

  const hasVoted = !!usersMatchData?.result;
  const userChoice = usersMatchData?.result;

  const handleWinningTeamPredict = async (choice) => {
    if (hasVoted) return;

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

  const {
    totalVotes = 0,
    draw = 0,
    away = 0,
    home = 0,
  } = matchPredictions?.result || {};
  const percentages = {
    home: totalVotes ? (home / totalVotes) * 100 : 0,
    draw: totalVotes ? (draw / totalVotes) * 100 : 0,
    away: totalVotes ? (away / totalVotes) * 100 : 0,
  };

  // --- STYLES ---
  const optionCardStyles = (choice) => {
    const isSelected = userChoice === choice;
    const pct = percentages[choice];

    return {
      flex: 1,
      p: 2,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      cursor: hasVoted ? "default" : "pointer",
      borderRadius: "8px",
      border: "1px solid",
      borderColor: isSelected
        ? theme.palette.primary.main
        : "rgba(255,255,255,0.05)",
      backgroundColor: isSelected
        ? alpha(theme.palette.primary.main, 0.1)
        : alpha(theme.palette.background.paper, 0.4),
      overflow: "hidden",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      minHeight: 120,

      // The "Progress" fill behind the content
      "&::before": {
        content: '""',
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: hasVoted ? `${pct}%` : "0%",
        bgcolor: isSelected
          ? alpha(theme.palette.primary.main, 0.2)
          : alpha(theme.palette.text.disabled, 0.1),
        transition: "height 1s ease-out",
        zIndex: 0,
      },

      "&:hover": !hasVoted && {
        borderColor: theme.palette.primary.main,
        transform: "translateY(-4px)",
        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
      },
    };
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        textAlign: "center",
      }}
    >
      {/* Top Consensus Indicator */}
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
            sx={{ letterSpacing: 2, fontSize: "0.7rem", opacity: 0.8 }}
          >
            Winner Consensus
          </Typography>
        </Stack>

        {totalVotes > 0 && (
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ opacity: 0.6 }}
          >
            <Groups sx={{ fontSize: 14 }} />
            <Typography variant="caption">{totalVotes} VOTES</Typography>
          </Stack>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
        {/* HOME */}
        <Box
          component={motion.div}
          layout
          onClick={() => handleWinningTeamPredict("home")}
          sx={optionCardStyles("home")}
        >
          <Box sx={{ zIndex: 1, textAlign: "center" }}>
            <Avatar
              src={fixture.teams.home.logo}
              sx={{
                width: 40,
                height: 40,
                mb: 1,
                mx: "auto",
                filter: hasVoted ? "grayscale(0.5)" : "none",
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, display: "block" }}
            >
              HOME
            </Typography>
            <AnimatePresence>
              {hasVoted && (
                <ResultDisplay
                  value={percentages.home}
                  isSelected={userChoice === "home"}
                />
              )}
            </AnimatePresence>
          </Box>
        </Box>

        {/* DRAW */}
        <Box
          component={motion.div}
          layout
          onClick={() => handleWinningTeamPredict("draw")}
          sx={optionCardStyles("draw")}
        >
          <Box sx={{ zIndex: 1, textAlign: "center" }}>
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
              }}
            >
              X
            </Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, display: "block" }}
            >
              DRAW
            </Typography>
            <AnimatePresence>
              {hasVoted && (
                <ResultDisplay
                  value={percentages.draw}
                  isSelected={userChoice === "draw"}
                />
              )}
            </AnimatePresence>
          </Box>
        </Box>

        {/* AWAY */}
        <Box
          component={motion.div}
          layout
          onClick={() => handleWinningTeamPredict("away")}
          sx={optionCardStyles("away")}
        >
          <Box sx={{ zIndex: 1, textAlign: "center" }}>
            <Avatar
              src={fixture.teams.away.logo}
              sx={{
                width: 40,
                height: 40,
                mb: 1,
                mx: "auto",
                filter: hasVoted ? "grayscale(0.5)" : "none",
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, display: "block" }}
            >
              AWAY
            </Typography>
            <AnimatePresence>
              {hasVoted && (
                <ResultDisplay
                  value={percentages.away}
                  isSelected={userChoice === "away"}
                />
              )}
            </AnimatePresence>
          </Box>
        </Box>
      </Stack>

      {/* Post-Vote Feedback */}
      {hasVoted && (
        <Fade in timeout={800}>
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{ mt: 3 }}
          >
            <CheckCircle color="primary" sx={{ fontSize: 16 }} />
            <Typography
              variant="caption"
              color="primary"
              sx={{ fontWeight: 700, textTransform: "uppercase" }}
            >
              Prediction Locked: {userChoice}
            </Typography>
          </Stack>
        </Fade>
      )}
    </Paper>
  );
}

const ResultDisplay = ({ value, isSelected }) => (
  <Box
    component={motion.div}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    sx={{ mt: 0.5 }}
  >
    <Typography
      variant="h4"
      sx={{
        fontSize: "1.4rem",
        fontWeight: 900,
        color: isSelected ? "primary.main" : "text.primary",
      }}
    >
      {Math.round(value)}%
    </Typography>
  </Box>
);
