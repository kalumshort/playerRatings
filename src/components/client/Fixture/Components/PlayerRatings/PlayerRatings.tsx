"use client";

import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from "@mui/material";

// --- CLEAN IMPORTS ---
import { handleMatchMotmVote } from "@/lib/firebase/client-actions";
import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/lib/redux/store";

// Sub-components

import MotmConfirmDialog from "./MotmConfirmDialog";
import PlayerRatingsCardStack from "./PlayerRatingsCardStack";
import RatingLineup from "./RatingLineup";
import { updateOrSet } from "@/lib/firebase/utils";
import { useClubView } from "@/context/ClubViewProvider";

export default function PlayerRatings({
  fixture,
  groupId,
  currentYear,
  groupData,
  isGuestView,
}: any) {
  const { userId } = useAuth();

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [storedMotmId, setStoredMotmId] = useState<string | null>(null);
  const matchId = String(fixture.id);

  // 1. DATA SELECTORS
  const usersMatchData = useSelector(
    (state: RootState) => state.userData?.matches?.[matchId],
  );

  const isMatchRatingsSubmitted = usersMatchData?.ratingsSubmitted;

  // 2. PLAYER LOGIC (Consolidated)
  // Extracts starters, subs who actually played, and the coach
  const { combinedPlayers, lineupExists } = useMemo(() => {
    const team = fixture.lineups?.find(
      (t: any) => t.team.id === Number(groupData.groupClubId),
    );

    if (!team) return { combinedPlayers: [], lineupExists: false };

    const starters = (team.startXI || []).map((p: any) => ({
      ...p.player,
      isStarter: true,
    }));
    const coach = team.coach
      ? { ...team.coach, id: `coach_${team.coach.id}`, position: "Coach" }
      : null;

    // Find substitutes who actually came on
    const playedSubs = (fixture.events || [])
      .filter(
        (e: any) =>
          e.type === "subst" && e.team.id === Number(groupData.groupClubId),
      )
      .map((e: any) => e.assist); // The 'assist' is the player coming ON

    const combined = [...starters, ...playedSubs, coach].filter(Boolean);
    return { combinedPlayers: combined, lineupExists: starters.length > 0 };
  }, [fixture]);

  // 3. VOTING PROGRESS
  const unratedCount = useMemo(() => {
    const ratedIds = Object.keys(usersMatchData?.players || {});
    return combinedPlayers.filter((p) => !ratedIds.includes(String(p.id)))
      .length;
  }, [combinedPlayers, usersMatchData]);

  const isSubmittable = unratedCount === 0;

  // 4. SUBMISSION HANDLER
  const performSubmission = async (motmId: string | null) => {
    if (!userId) return;
    try {
      if (motmId) {
        await handleMatchMotmVote({
          matchId,
          groupId,
          currentYear,
          userId: userId,
          playerId: String(motmId),
        });
      } else {
        await updateOrSet(
          `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
          matchId,
          {
            ratingsSubmitted: true,
          },
        );
      }
      setOpenConfirmDialog(false);
      alert("Ratings locked in!");
    } catch (err) {
      alert("Submission failed");
    }
  };

  // --- RENDER LOGIC ---

  // A. Game not far enough along
  if (fixture.fixture.status.elapsed < 80) {
    return (
      <Box sx={{ p: 6, textAlign: "center", opacity: 0.5 }}>
        <Typography variant="body2" fontWeight={800}>
          RATINGS OPEN AT 80'
        </Typography>
      </Box>
    );
  }

  // B. Missing Data
  if (!lineupExists) {
    return (
      <Typography align="center" sx={{ p: 4 }}>
        Lineup data pending...
      </Typography>
    );
  }

  // C. VIEW MODE (Submitted or Read Only)
  if (isGuestView || isMatchRatingsSubmitted) {
    return (
      <RatingLineup
        fixture={fixture}
        usersMatchPlayerRatings={usersMatchData?.players}
        groupClubId={Number(groupData.groupClubId)}
      />
    );
  }

  // D. EDIT MODE (Voting)
  return (
    <Box sx={{ width: "100%" }}>
      <PlayerRatingsCardStack
        combinedPlayers={combinedPlayers}
        fixture={fixture}
        groupId={groupId}
        currentYear={currentYear}
        usersMatchPlayerRatings={usersMatchData?.players}
        storedUsersMatchMOTM={storedMotmId}
        userId={userId}
        setStoredMotmId={setStoredMotmId}
        storedMotmId={storedMotmId}
      />

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Button
          variant="contained"
          size="large"
          disabled={!isSubmittable}
          onClick={() =>
            !storedMotmId
              ? setOpenConfirmDialog(true)
              : performSubmission(storedMotmId)
          }
          sx={{ borderRadius: "12px", px: 6, fontWeight: 900 }}
        >
          SUBMIT ALL RATINGS
        </Button>

        <Stack spacing={1} sx={{ mt: 2 }}>
          {unratedCount > 0 && (
            <Typography variant="caption" color="error" fontWeight={800}>
              • {unratedCount} players remaining
            </Typography>
          )}
          {!storedMotmId && (
            <Typography variant="caption" color="warning.main" fontWeight={800}>
              • Select your Man of the Match
            </Typography>
          )}
        </Stack>
      </Box>

      <MotmConfirmDialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        onConfirm={() => performSubmission(null)}
      />
    </Box>
  );
}
