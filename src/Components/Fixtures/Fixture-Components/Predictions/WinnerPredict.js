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
import { CheckCircle, EmojiEvents } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";

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

  // Data Selectors
  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const globalData = useGlobalData();
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));

  // FIXED: Ensure we are using this variable consistently
  const storedUsersPredictedResult = usersMatchData?.result;

  // --- HANDLER ---
  const handleWinningTeamPredict = async (choice) => {
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

  // --- CALCULATE STATS ---
  const { totalVotes, draw, away, home } = matchPredictions.result || {};
  const percentages = {
    home: totalVotes ? (home / totalVotes) * 100 : 0,
    draw: totalVotes ? (draw / totalVotes) * 100 : 0,
    away: totalVotes ? (away / totalVotes) * 100 : 0,
  };

  // --- STYLES ---
  const glassCardStyles = {
    // Layout & Spacing only
    p: 3,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "220px",

    // REMOVED: background, backdropFilter, border, borderRadius, overflow, transition
    // These are now inherited automatically from your Global Theme!
  };

  const optionCardStyles = (isSelected) => ({
    flex: 1,
    p: 1.5,
    borderRadius: 2,
    border: `1px solid ${
      isSelected ? theme.palette.primary.main : theme.palette.divider
    }`,
    bgcolor: isSelected
      ? `${theme.palette.primary.main}15`
      : "background.paper",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: storedUsersPredictedResult ? "default" : "pointer",
    transition: "all 0.2s",
    minHeight: 110,
    position: "relative",
    "&:hover": !storedUsersPredictedResult && {
      transform: "translateY(-2px)",
      borderColor: theme.palette.primary.main,
      boxShadow: `0 4px 12px ${theme.palette.primary.main}20`,
    },
  });

  return (
    <Paper sx={glassCardStyles} elevation={0}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ mb: 2, opacity: 0.7 }}
      >
        <EmojiEvents sx={{ fontSize: "1rem" }} color="primary" />
        <Typography variant="caption">WHO WILL WIN?</Typography>
      </Stack>

      {/* 3-Column Layout */}
      <Stack direction="row" spacing={1.5} sx={{ width: "100%" }}>
        {/* HOME OPTION */}
        <Box
          component={storedUsersPredictedResult ? "div" : motion.div} // FIXED HERE
          whileTap={!storedUsersPredictedResult && { scale: 0.95 }}
          onClick={() =>
            !storedUsersPredictedResult && handleWinningTeamPredict("home")
          }
          sx={optionCardStyles(storedUsersPredictedResult === "home")}
        >
          <Avatar
            src={fixture.teams.home.logo}
            sx={{ width: 32, height: 32, mb: 1 }}
          />
          <Typography variant="caption" noWrap>
            HOME
          </Typography>

          {/* Result Overlay */}
          {storedUsersPredictedResult && (
            <ResultPercentage value={percentages.home} />
          )}
        </Box>

        {/* DRAW OPTION */}
        <Box
          component={storedUsersPredictedResult ? "div" : motion.div} // FIXED HERE
          whileTap={!storedUsersPredictedResult && { scale: 0.95 }}
          onClick={() =>
            !storedUsersPredictedResult && handleWinningTeamPredict("draw")
          }
          sx={optionCardStyles(storedUsersPredictedResult === "draw")}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              mb: 1,
              borderRadius: "50%",
              border: `2px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            X
          </Box>
          <Typography variant="caption">DRAW</Typography>

          {/* Result Overlay */}
          {storedUsersPredictedResult && (
            <ResultPercentage value={percentages.draw} />
          )}
        </Box>

        {/* AWAY OPTION */}
        <Box
          component={storedUsersPredictedResult ? "div" : motion.div} // FIXED HERE
          whileTap={!storedUsersPredictedResult && { scale: 0.95 }}
          onClick={() =>
            !storedUsersPredictedResult && handleWinningTeamPredict("away")
          }
          sx={optionCardStyles(storedUsersPredictedResult === "away")}
        >
          <Avatar
            src={fixture.teams.away.logo}
            sx={{ width: 32, height: 32, mb: 1 }}
          />
          <Typography
            variant="caption"
            noWrap
            sx={{
              opacity: 0.8,
            }}
          >
            AWAY
          </Typography>

          {/* Result Overlay */}
          {storedUsersPredictedResult && (
            <ResultPercentage value={percentages.away} />
          )}
        </Box>
      </Stack>

      {/* Voted Confirmation Text */}
      {storedUsersPredictedResult && (
        <Fade in={true}>
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle fontSize="small" color="primary" sx={{ width: 16 }} />
            <Typography variant="caption" color="primary">
              YOU PICKED {storedUsersPredictedResult.toUpperCase()}
            </Typography>
          </Box>
        </Fade>
      )}
    </Paper>
  );
}

// --- SUB-COMPONENT: PERCENTAGE DISPLAY ---
const ResultPercentage = ({ value }) => {
  const theme = useTheme();
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 10 }}
      sx={{ mt: 1, textAlign: "center" }}
    >
      <Typography
        variant="h5"
        sx={{
          lineHeight: 1,
          color: theme.palette.mode === "dark" ? "#fff" : "#000",
        }}
      >
        {value.toFixed(0)}%
      </Typography>
    </Box>
  );
};
