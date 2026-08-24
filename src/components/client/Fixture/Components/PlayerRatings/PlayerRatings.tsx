"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Typography, Stack } from "@mui/material";

// --- CLEAN IMPORTS ---
import { handleMatchMotmVote } from "@/lib/firebase/client-actions";
import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/lib/redux/store";

// Sub-components

import MotmConfirmDialog from "./MotmConfirmDialog";
import PlayerRatingsCardStack from "./PlayerRatingsCardStack";
import RatingLineup from "./RatingLineup";
import { setDocument } from "@/lib/firebase/utils";
import { isFinished, isLive } from "@/lib/utils/football-logic";
import { AsyncButton } from "@/components/ui/AsyncButton";
import useAsyncAction from "@/Hooks/useAsyncAction";

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

  // 1b. MOTM PICK PERSISTENCE
  // The pick used to live only in component state, so a refresh partway through
  // voting lost it silently while the individual ratings survived. It's parked
  // on the user's own match doc as `pendingMotm` until submission promotes it
  // to the real `motmVote`; users/** is fully self-writable, so no rules change.
  const pendingMotm: string | null = usersMatchData?.pendingMotm ?? null;

  const hasSeededMotmRef = useRef(false);
  useEffect(() => {
    if (hasSeededMotmRef.current || !pendingMotm) return;
    hasSeededMotmRef.current = true;
    setStoredMotmId(pendingMotm);
  }, [pendingMotm]);

  // Stable identity: this is passed through the card stack to React.memo'd cards.
  const handleSelectMotm = useCallback(
    (playerId: string | null) => {
      setStoredMotmId(playerId);
      if (!userId) return;

      // Fire-and-forget. A failure here costs the user nothing they can see —
      // the pick still works for this session, it just won't survive a reload —
      // so it deliberately doesn't get a toast or a pending spinner.
      setDocument(
        `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
        matchId,
        { pendingMotm: playerId },
      ).catch((err) =>
        console.warn("[PlayerRatings] Could not persist MOTM pick:", err),
      );
    },
    [userId, groupId, currentYear, matchId],
  );

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
    // Narrowed from [fixture], which both recomputed on every live tick AND
    // omitted groupData.groupClubId — read in the body, so switching club left
    // this stale.
  }, [fixture?.lineups, fixture?.events, groupData?.groupClubId]);

  // 3. VOTING PROGRESS
  const unratedCount = useMemo(() => {
    const ratedIds = Object.keys(usersMatchData?.players || {});
    return combinedPlayers.filter((p) => !ratedIds.includes(String(p.id)))
      .length;
  }, [combinedPlayers, usersMatchData]);

  const isSubmittable = unratedCount === 0;

  // 4. SUBMISSION HANDLER
  // Closing the dialog is an onSuccess concern — on failure it must stay open
  // so the user can retry rather than being dropped back with no explanation.
  const { run: performSubmission, pending: isSubmitting } = useAsyncAction(
    async (motmId: string | null) => {
      if (!userId) return;
      if (motmId) {
        await handleMatchMotmVote({
          matchId,
          groupId,
          currentYear,
          userId: userId,
          playerId: String(motmId),
        });
      } else {
        // setDocument, not updateOrSet: this only ever adds a field, and
        // updateOrSet spends an extra getDoc deciding between update and set.
        await setDocument(
          `users/${userId}/groups/${groupId}/seasons/${currentYear}/matches`,
          matchId,
          { ratingsSubmitted: true },
        );
      }
    },
    {
      successMessage: "Ratings submitted. Thanks for voting!",
      errorMessage: "You've already submitted your ratings for this match.",
      onSuccess: () => setOpenConfirmDialog(false),
    },
  );

  // --- RENDER LOGIC ---

  // A. Game not far enough along.
  // Goes through getFixtureState rather than reading `elapsed` raw: `elapsed`
  // is null on any fixture without a live clock, and `null < 80` is true, which
  // pinned finished matches on "RATINGS OPEN AT 80'" with no way to open them.
  const elapsed = fixture?.fixture?.status?.elapsed ?? 0;
  const canRate = isFinished(fixture) || (isLive(fixture) && elapsed >= 80);

  if (!canRate) {
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
        // `motmVote` is the submitted pick; `pendingMotm` covers the guest /
        // never-submitted case where the parked pick is all there is.
        usersMotmId={usersMatchData?.motmVote ?? pendingMotm}
        groupClubId={Number(groupData.groupClubId)}
        groupName={groupData?.name}
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
        setStoredMotmId={handleSelectMotm}
        storedMotmId={storedMotmId}
      />

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <AsyncButton
          variant="contained"
          size="large"
          loading={isSubmitting}
          disabled={!isSubmittable || isSubmitting}
          onClick={() =>
            !storedMotmId
              ? setOpenConfirmDialog(true)
              : performSubmission(storedMotmId)
          }
          sx={{ borderRadius: "12px", px: 6, fontWeight: 900 }}
        >
          SUBMIT ALL RATINGS
        </AsyncButton>

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
        loading={isSubmitting}
        onClose={() => setOpenConfirmDialog(false)}
        onConfirm={() => performSubmission(null)}
      />
    </Box>
  );
}
