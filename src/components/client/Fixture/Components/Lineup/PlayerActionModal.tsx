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
  const handleCastVote = async (
    type: string,
    subInId: string | number | null = null,
  ) => {
    onClose();
    setView("main");

    const commonPayload = {
      groupId,
      currentYear,
      matchId: String(fixtureId),
      timeElapsed: String(elapsedTime),
      playerId: String(player.id),
    };

    try {
      if (type === "sub" && subInId) {
        // Vote for the specific sub combo
        await handleLivePlayerStats({ ...commonPayload, statKey: "sub" });
        await handleLivePlayerStats({
          ...commonPayload,
          statKey: `sub_req_${subInId}`,
        });
      } else {
        // Simple Hot/Cold vote
        await handleLivePlayerStats({ ...commonPayload, statKey: type });
      }
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Zoom}>
      <Box sx={{ p: 3, position: "relative" }}>
        {/* CLOSE */}
        <IconButton
          onClick={onClose}
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

const ActionButton = ({ label, color, bg, border, icon, onClick }: any) => (
  <Button
    fullWidth
    onClick={onClick}
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

const SubItem = ({ sub, squadData, onVote }: any) => {
  console.log(sub, "SubItem Data");
  const player = sub.player;
  if (!player) return null;

  return (
    <Button
      fullWidth
      onClick={() => onVote("sub", player.id)}
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
