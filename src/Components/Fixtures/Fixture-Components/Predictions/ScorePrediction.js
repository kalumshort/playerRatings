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
import {
  AddRounded,
  RemoveRounded,
  SportsSoccerRounded,
  CheckCircleRounded,
} from "@mui/icons-material"; // Rounded Icons
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";

// --- HOOKS ---
import useGroupData from "../../../../Hooks/useGroupsData";
import { useAuth } from "../../../../Providers/AuthContext";
import useGlobalData from "../../../../Hooks/useGlobalData";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import { handlePredictTeamScore } from "../../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";
import ScorePredictionResults from "../ScorePredictionResults";

export default function ScorePrediction({ fixture }) {
  const dispatch = useDispatch();

  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const globalData = useGlobalData();
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));
  const storedUsersPredictedScore = usersMatchData?.ScorePrediction;

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

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

  if (storedUsersPredictedScore || !user) {
    return (
      <ScorePredictionResults
        fixture={fixture}
        storedUsersPredictedScore={storedUsersPredictedScore}
      />
    );
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "220px",
      })}
    >
      {/* Header */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <SportsSoccerRounded color="primary" sx={{ fontSize: 20 }} />
        <Typography
          variant="button"
          sx={{
            letterSpacing: 1.5,
            opacity: 0.8,
            fontWeight: 900,
            fontSize: "0.75rem",
          }}
        >
          SCORE PREDICTOR
        </Typography>
      </Stack>

      {/* Main Scoreboard */}
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={2}
        sx={{ width: "100%", mb: 3 }}
      >
        <TeamScoreInputCompact
          team={fixture.teams.home}
          score={homeScore}
          setScore={setHomeScore}
        />

        <Typography
          variant="h4"
          sx={{
            color: "text.disabled",
            fontWeight: 300,
            pb: 2, // Visual alignment
          }}
        >
          :
        </Typography>

        <TeamScoreInputCompact
          team={fixture.teams.away}
          score={awayScore}
          setScore={setAwayScore}
        />
      </Stack>

      {/* Submit Button */}
      <Fade in={true}>
        <Button
          onClick={handleTeamScoreSubmit}
          variant="contained"
          size="large"
          startIcon={<CheckCircleRounded />}
          sx={{
            // The Theme already handles the Clay Button styling for "contained"
            minWidth: 200,
            fontWeight: 900,
          }}
        >
          CONFIRM {homeScore}-{awayScore}
        </Button>
      </Fade>
    </Paper>
  );
}

// --- SUB-COMPONENT ---
const TeamScoreInputCompact = ({ team, score, setScore }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {/* Avatar */}
      <Avatar
        src={team.logo}
        alt={team.name}
        sx={{
          width: 48,
          height: 48,
          mb: 1,
          border: `2px solid ${theme.palette.background.default}`,
          boxShadow: theme.clay.card.boxShadow, // Floating Sphere
        }}
      />
      <Typography
        variant="caption"
        noWrap
        sx={{
          maxWidth: "80px",
          mb: 2,
          fontWeight: 800,
          color: "text.secondary",
        }}
      >
        {team.code || team.name.substring(0, 3).toUpperCase()}
      </Typography>

      {/* Score Controls */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={(theme) => ({
          // Container background matches card, just layout here
          p: 0.5,
        })}
      >
        {/* MINUS (Floating Clay Button) */}
        <IconButton
          onClick={() => setScore((prev) => Math.max(0, prev - 1))}
          disabled={score === 0}
          sx={(theme) => ({
            ...theme.clay.button,
            width: 36,
            height: 36,
            borderRadius: "12px",
            // Disabled state handled by opacity automatically
          })}
        >
          <RemoveRounded fontSize="small" />
        </IconButton>

        {/* SCORE DISPLAY (Pressed Clay Well) */}
        <Box
          component={motion.div}
          key={score}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          sx={(theme) => ({
            ...theme.clay.box, // Inset Shadow
            width: 48,
            height: 48,
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
          })}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: score > 0 ? "text.primary" : "text.disabled",
            }}
          >
            {score}
          </Typography>
        </Box>

        {/* PLUS (Floating Clay Button) */}
        <IconButton
          onClick={() => setScore((prev) => prev + 1)}
          sx={(theme) => ({
            ...theme.clay.button,
            width: 36,
            height: 36,
            borderRadius: "12px",
            "&:hover": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
            },
          })}
        >
          <AddRounded fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};
