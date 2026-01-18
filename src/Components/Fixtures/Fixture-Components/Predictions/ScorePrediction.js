import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Stack,
  Avatar,
  useTheme,
  Fade,
} from "@mui/material";
import { Add, Remove, SportsSoccer, CheckCircle } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";

// --- HOOKS & FIREBASE (Kept exactly as is) ---
import useGroupData from "../../../../Hooks/useGroupsData";
import { useAuth } from "../../../../Providers/AuthContext";
import useGlobalData from "../../../../Hooks/useGlobalData";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import { handlePredictTeamScore } from "../../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";
import ScorePredictionResults from "../ScorePredictionResults";

export default function ScorePrediction({ fixture }) {
  const dispatch = useDispatch();

  // Data Selectors
  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const globalData = useGlobalData();
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));
  const storedUsersPredictedScore = usersMatchData?.ScorePrediction;

  // Local State
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  // --- HANDLERS ---
  const handleTeamScoreSubmit = async () => {
    if (!user) return;
    await handlePredictTeamScore({
      matchId: fixture.id,
      score: `${homeScore}-${awayScore}`,
      homeGoals: homeScore,
      awayGoals: awayScore,
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

  if (storedUsersPredictedScore || !user) {
    return (
      <ScorePredictionResults
        fixture={fixture}
        storedUsersPredictedScore={storedUsersPredictedScore}
      />
    );
  }

  // --- RENDER: COMPACT PREDICTION UI ---
  return (
    <Paper sx={glassCardStyles} elevation={0}>
      {/* Compact Header */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ mb: 2, opacity: 0.7 }}
      >
        <SportsSoccer sx={{ fontSize: "1rem" }} color="primary" />
        <Typography
          variant="caption"
          sx={{
            letterSpacing: 1,
            fontSize: "0.7rem",
          }}
        >
          SCORE PREDICTOR
        </Typography>
      </Stack>

      {/* Main Scoreboard Area */}
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={1}
        sx={{ width: "100%", mb: 3 }}
      >
        {/* HOME TEAM */}
        <TeamScoreInputCompact
          team={fixture.teams.home}
          score={homeScore}
          setScore={setHomeScore}
        />

        {/* VS Divider (Smaller) */}
        <Typography
          variant="h5"
          sx={{
            color: "text.disabled",
            px: 1,
            pb: 4, // Align with numbers
          }}
        >
          :
        </Typography>

        {/* AWAY TEAM */}
        <TeamScoreInputCompact
          team={fixture.teams.away}
          score={awayScore}
          setScore={setAwayScore}
        />
      </Stack>

      {/* Submit Button (Compact) */}
      <Fade in={true}>
        <Button
          onClick={handleTeamScoreSubmit}
          variant="contained"
          size="small" // Smaller button
          startIcon={<CheckCircle sx={{ fontSize: "1rem !important" }} />}
        >
          CONFIRM {homeScore}-{awayScore}
        </Button>
      </Fade>
    </Paper>
  );
}

// --- SUB-COMPONENT: COMPACT TEAM INPUT ---
const TeamScoreInputCompact = ({ team, score, setScore }) => {
  const theme = useTheme();
  const btnSize = "32px"; // Fixed small size for buttons

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Avatar & Name Stacked tightly */}
      <Avatar
        src={team.logo}
        alt={team.name}
        sx={{
          width: 40, // Smaller avatar
          height: 40,
          mb: 0.5,
          filter:
            theme.palette.mode === "dark"
              ? "drop-shadow(0 0 8px rgba(255,255,255,0.1))"
              : "none",
        }}
      />
      <Typography
        variant="caption"
        noWrap
        sx={{
          maxWidth: "80px",
          mb: 1.5,
          opacity: 0.7,
        }}
      >
        {team.code || team.name.substring(0, 3).toUpperCase()}
      </Typography>

      {/* Horizontal Score Controls */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          bgcolor: theme.palette.background.paper,
          p: 0.5,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Minus Button */}
        <IconButton
          onClick={() => setScore((prev) => Math.max(0, prev - 1))}
          disabled={score === 0}
          sx={{
            width: btnSize,
            height: btnSize,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            opacity: score === 0 ? 0.3 : 1,
            p: 0.5,
          }}
        >
          <Remove fontSize="small" />
        </IconButton>

        {/* Digital Number Display (Smaller) */}
        <Box
          component={motion.div}
          key={score}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          sx={{
            lineHeight: 1,
            minWidth: "40px",
            textAlign: "center",
            color: score > 0 ? "text.primary" : "text.disabled",
            textShadow:
              score > 0 && theme.palette.mode === "dark"
                ? `0 0 15px ${theme.palette.primary.main}60`
                : "none",
          }}
        >
          {score}
        </Box>

        {/* Plus Button */}
        <IconButton
          onClick={() => setScore((prev) => prev + 1)}
          sx={{
            width: btnSize,
            height: btnSize,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 0.5,
            "&:hover": {
              bgcolor: theme.palette.primary.main,
              color: "#000",
              borderColor: "transparent",
            },
          }}
        >
          <Add fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};
