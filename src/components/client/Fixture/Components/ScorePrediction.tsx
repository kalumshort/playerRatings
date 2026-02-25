"use client";

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
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

import { handlePredictTeamScore } from "@/lib/firebase/client-actions";
import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/lib/redux/store";
import ScorePredictionResults from "./ScorePredictionResults";

interface ScorePredictionProps {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
  isPreMatch: boolean;
}

export default function ScorePrediction({
  fixture,
  groupId,
  currentYear,
  groupData,
  isPreMatch,
}: ScorePredictionProps) {
  const { user } = useAuth();
  const matchId = String(fixture.id);
  const theme = useTheme() as any;

  const usersMatchData = useSelector(
    (state: RootState) => state.userData?.matches?.[matchId],
  );
  const storedUsersPredictedScore = usersMatchData?.ScorePrediction;

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  const handleTeamScoreSubmit = async () => {
    if (!user || !groupId) return;

    await handlePredictTeamScore({
      matchId,
      score: `${homeScore}-${awayScore}`,
      homeGoals: homeScore,
      awayGoals: awayScore,
      groupId,
      userId: user.uid,
      currentYear,
    });
  };

  if (!isPreMatch || storedUsersPredictedScore || !user) {
    return (
      <ScorePredictionResults
        fixture={fixture}
        storedUsersPredictedScore={storedUsersPredictedScore}
        groupId={groupId}
      />
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // Force the layout to spread across the full height of the parent
        justifyContent: "space-between",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* --- HEADER --- */}
      <Stack direction="row" spacing={1} alignItems="center">
        <SportsSoccerRounded color="primary" sx={{ fontSize: 20 }} />
        <Typography
          variant="button"
          sx={{
            letterSpacing: 1.5,
            fontWeight: 900,
            fontSize: "0.75rem",
          }}
        >
          SCORE PREDICTOR
        </Typography>
      </Stack>

      {/* --- MAIN SCOREBOARD --- */}
      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={{ xs: 1, sm: 2 }}
        sx={{ width: "100%", my: 2 }}
      >
        <TeamScoreInputCompact
          team={fixture.teams.home}
          score={homeScore}
          setScore={setHomeScore}
        />

        <Typography
          variant="h4"
          sx={{ color: "text.disabled", fontWeight: 900, mt: 4 }}
        >
          :
        </Typography>

        <TeamScoreInputCompact
          team={fixture.teams.away}
          score={awayScore}
          setScore={setAwayScore}
        />
      </Stack>

      {/* --- SUBMIT BUTTON --- */}
      <Fade in={true}>
        <Button
          onClick={handleTeamScoreSubmit}
          variant="contained"
          fullWidth
          disabled={!user}
          startIcon={<CheckCircleRounded />}
          sx={{
            fontWeight: 900,
            borderRadius: "16px",
            py: 1.5,
            ...theme.clay?.button, // Use clay style if provided in theme
            bgcolor: theme.palette.primary.main,
            color: "white",
            "&:hover": { bgcolor: theme.palette.primary.dark },
          }}
        >
          CONFIRM {homeScore}-{awayScore}
        </Button>
      </Fade>
    </Paper>
  );
}

const TeamScoreInputCompact = ({ team, score, setScore }: any) => {
  const theme = useTheme() as any;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Avatar
        src={team.logo}
        alt={team.name}
        variant="rounded"
        sx={{
          width: 40,
          height: 40,
          mb: 0.5,
          bgcolor: "white",
          p: 0.5,
          boxShadow: theme.shadows[1],
        }}
      />
      <Typography
        variant="caption"
        noWrap
        sx={{
          maxWidth: "70px",
          mb: 1.5,
          fontWeight: 800,
          color: "text.secondary",
          fontSize: "0.65rem",
        }}
      >
        {team.name.substring(0, 3).toUpperCase()}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton
          onClick={() => setScore((prev: number) => Math.max(0, prev - 1))}
          disabled={score === 0}
          sx={{
            ...theme.clay?.button,
            width: 32,
            height: 32,
            borderRadius: "10px",
            bgcolor: "background.paper",
          }}
        >
          <RemoveRounded fontSize="small" />
        </IconButton>

        <Box
          component={motion.div}
          key={score}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          sx={{
            ...theme.clay?.box,
            width: 40,
            height: 40,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: score > 0 ? "text.primary" : "text.disabled",
            }}
          >
            {score}
          </Typography>
        </Box>

        <IconButton
          onClick={() => setScore((prev: number) => prev + 1)}
          sx={{
            ...theme.clay?.button,
            width: 32,
            height: 32,
            borderRadius: "10px",
            bgcolor: "background.paper",
          }}
        >
          <AddRounded fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};
