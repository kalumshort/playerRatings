"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  Typography,
  Box,
  Avatar,
  Grid,
  Button,
  IconButton,
  useTheme,
  Zoom,
  Fade,
  Stack,
  alpha,
} from "@mui/material";
import {
  WhatshotRounded,
  AcUnitRounded,
  SwapHorizRounded,
  CloseRounded,
  TrendingUpRounded,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";

// --- CLEAN IMPORTS ---
import { handleLivePlayerStats } from "@/lib/firebase/client-actions";
import { RootState } from "@/lib/redux/store";
import useAsyncAction from "@/Hooks/useAsyncAction";
import { useAuth } from "@/context/AuthContext";
import { useParticipationCap } from "@/lib/gamification/useParticipationCap";

interface PlayerActionModalProps {
  open: boolean;
  onClose: () => void;
  player: any;
  fixtureId: string | number;
  substitutes: any[];
  elapsedTime: number | string;
  liveData: any; // { totals: { playerId: { hot: X, cold: Y, ... } } }
  groupId: string;
  currentYear: string;
}

export default function PlayerActionModal({
  open,
  onClose,
  player,
  fixtureId,
  substitutes = [],
  elapsedTime = "90",
  liveData,
  groupId,
  currentYear,
}: PlayerActionModalProps) {
  const theme = useTheme() as any;
  const { clubSlug } = useParams();
  const [view, setView] = useState<"main" | "subs">("main");
  const { user } = useAuth();
  // Voting stays unlimited; only the XP marker write stops once capped.
  const liveXpCapped = useParticipationCap(String(fixtureId), "liveVotes");

  // 1. SELECTORS
  const squadData = useSelector(
    (state: RootState) => state.teamSquads.byClubId[clubSlug as string],
  );
  const mainPlayerData = player?.id ? squadData?.[player.id] : null;

  // 2. SORTED SUBS LOGIC
  // Calculates which subs the fans want based on live vote counts
  const sortedSubs = useMemo(() => {
    const playerStats = liveData?.totals?.[player?.id] || {};
    return substitutes
      .filter((sub) => !sub.isSubbedOut)
      .map((sub) => {
        const count = playerStats[`sub_req_${sub.player.id}`] || 0;
        return { ...sub, voteCount: count };
      })
      .sort((a, b) => b.voteCount - a.voteCount);
  }, [substitutes, liveData, player]);

  const topSuggestions = sortedSubs.filter((s) => s.voteCount > 0).slice(0, 2);

  if (!player) return null;

  // 3. HANDLERS
  // The modal used to close before the write, so a failed vote looked exactly
  // like a successful one. Closing is now an onSuccess concern.
  const { run: castVote, pending: isVoting } = useAsyncAction(
    async (type: string, subInId: string | number | null = null) => {
      const commonPayload = {
        groupId,
        currentYear,
        matchId: String(fixtureId),
        timeElapsed: String(elapsedTime),
        playerId: String(player.id),
      };

      // One write for both keys: as two sequential writes, a failure between
      // them counted `sub` without `sub_req_{id}` and corrupted sortedSubs.
      const statKeys =
        type === "sub" && subInId ? ["sub", `sub_req_${subInId}`] : [type];

      await handleLivePlayerStats({
        ...commonPayload,
        statKeys,
        userId: user?.uid,
        xpCapReached: liveXpCapped,
      });
    },
    {
      errorMessage: "Vote didn't go through. Try again.",
      toastId: `player-vote-${fixtureId}`,
      onSuccess: () => {
        onClose();
        setView("main");
      },
    },
  );

  const handleCastVote = (
    type: string,
    subInId: string | number | null = null,
  ) => castVote(type, subInId);

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Zoom}>
      <Box sx={{ p: 3, position: "relative" }}>
        {/* CLOSE */}
        <IconButton
          aria-label="Close player actions"
          onClick={onClose}
          disabled={isVoting}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            bgcolor: "action.hover",
          }}
        >
          <CloseRounded fontSize="small" />
        </IconButton>

        {/* PROFILE HEADER */}
        <Stack alignItems="center" sx={{ mb: 3, mt: 1 }}>
          <Avatar
            src={
              mainPlayerData?.photo ||
              player?.photo ||
              `https://media.api-sports.io/football/players/${player.id}.png`
            }
            sx={{
              width: 90,
              height: 90,
              border: `5px solid white`,
              boxShadow: theme.clay?.card?.boxShadow,
              mb: 2,
            }}
          />
          <Typography variant="h5" fontWeight={900}>
            {mainPlayerData?.name || player?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>
            LIVE MATCH ACTIONS
          </Typography>
        </Stack>

        {view === "main" ? (
          <Fade in>
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <ActionButton
                    label="ON FIRE"
                    color="#E65100"
                    bg="#FFF3E0"
                    border="#FFCC80"
                    icon={<WhatshotRounded sx={{ fontSize: 40 }} />}
                    onClick={() => handleCastVote("hot")}
                    disabled={isVoting}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <ActionButton
                    label="FROZEN"
                    color="#0277BD"
                    bg="#E1F5FE"
                    border="#81D4FA"
                    icon={<AcUnitRounded sx={{ fontSize: 40 }} />}
                    onClick={() => handleCastVote("cold")}
                    disabled={isVoting}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    fullWidth
                    onClick={() => setView("subs")}
                    startIcon={<SwapHorizRounded />}
                  >
                    VOTE TO SUBSTITUTE
                  </Button>
                </Grid>
              </Grid>

              {/* SUGGESTIONS WELL */}
              {topSuggestions.length > 0 && (
                <Box
                  sx={{
                    ...theme.clay?.box,
                    mt: 3,
                    p: 2,
                    borderRadius: "20px",
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <TrendingUpRounded color="success" sx={{ fontSize: 18 }} />
                    <Typography
                      variant="caption"
                      fontWeight={900}
                      letterSpacing={1}
                    >
                      FANS WANT ON:
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {topSuggestions.map((sub) => (
                      <SubItem
                        key={sub.player.id}
                        sub={sub}
                        squadData={squadData}
                        onVote={handleCastVote}
                        disabled={isVoting}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Fade>
        ) : (
          /* SUB LIST VIEW */
          <Fade in>
            <Box>
              <Typography
                variant="subtitle2"
                align="center"
                fontWeight={900}
                sx={{ mb: 2, opacity: 0.6 }}
              >
                WHO COMES ON?
              </Typography>
              <Box sx={{ maxHeight: "350px", overflowY: "auto", px: 1 }}>
                <Stack spacing={1}>
                  {sortedSubs.map((sub) => (
                    <SubItem
                      key={sub.player.id}
                      sub={sub}
                      squadData={squadData}
                      onVote={handleCastVote}
                      disabled={isVoting}
                    />
                  ))}
                </Stack>
              </Box>
              <Button
                fullWidth
                onClick={() => setView("main")}
                sx={{ mt: 2, fontWeight: 800 }}
              >
                BACK
              </Button>
            </Box>
          </Fade>
        )}
      </Box>
    </Dialog>
  );
}

// --- SUB-COMPONENTS ---

const ActionButton = ({
  label,
  color,
  bg,
  border,
  icon,
  onClick,
  disabled,
}: any) => (
  <Button
    fullWidth
    onClick={onClick}
    disabled={disabled}
    sx={(theme: any) => ({
      ...theme.clay?.button,
      height: 110,
      flexDirection: "column",
      bgcolor: bg,
      border: `2px solid ${border}`,
      color: color,
      "&:hover": { bgcolor: bg, opacity: 0.8 },
    })}
  >
    {icon}
    <Typography variant="caption" fontWeight={900} sx={{ mt: 1 }}>
      {label}
    </Typography>
  </Button>
);

const SubItem = ({ sub, squadData, onVote, disabled }: any) => {
  const player = sub.player;
  if (!player) return null;

  return (
    <Button
      fullWidth
      onClick={() => onVote("sub", player.id)}
      disabled={disabled}
      sx={{
        justifyContent: "space-between",
        p: 1,
        borderRadius: "12px",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          src={`https://media.api-sports.io/football/players/${player.id}.png`}
        />
        <Box textAlign="left">
          <Typography variant="body2" fontWeight={800}>
            {player.name}
          </Typography>
        </Box>
      </Stack>
      {sub.voteCount > 0 && (
        <Box
          sx={{
            bgcolor: "success.main",
            color: "white",
            px: 1,
            borderRadius: "6px",
            minWidth: 24,
          }}
        >
          <Typography variant="caption" fontWeight={900}>
            {sub.voteCount}
          </Typography>
        </Box>
      )}
    </Button>
  );
};
