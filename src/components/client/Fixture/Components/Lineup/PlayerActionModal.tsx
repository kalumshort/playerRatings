"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  Typography,
  Box,
  Avatar,
  Grid,
  Button,
  ButtonBase,
  IconButton,
  LinearProgress,
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
  CheckCircleRounded,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { motion, useReducedMotion } from "framer-motion";

// --- CLEAN IMPORTS ---
import { RootState } from "@/lib/redux/store";
import useAsyncAction from "@/Hooks/useAsyncAction";
import { selectActiveSquadMapped } from "@/lib/redux/selectors/squadSelectors";
import ParticleOverlay from "../FanMoodSelector/ParticleOverlay";
import {
  HEAT_TIERS,
  type PlayerHeat,
  type PlayerStance,
  type StanceMood,
} from "@/lib/live/heat";

interface PlayerActionModalProps {
  open: boolean;
  onClose: () => void;
  player: any;
  substitutes: any[];
  /** Raw aggregate — the sub list reads its own `sub_req_*` counters. */
  liveData: any;
  heat?: PlayerHeat;
  /** This fan's current stance on this player, pending writes included. */
  stance?: PlayerStance;
  castStance: (playerId: string | number, next: PlayerStance) => Promise<void>;
  clubId: string | number;
  currentYear: string;
}

export default function PlayerActionModal({
  open,
  onClose,
  player,
  substitutes = [],
  liveData,
  heat,
  stance,
  castStance,
  clubId,
  currentYear,
}: PlayerActionModalProps) {
  const theme = useTheme() as any;
  const reduce = useReducedMotion();
  const [view, setView] = useState<"main" | "subs">("main");
  const [particles, setParticles] = useState<any[]>([]);

  // 1. SELECTORS
  // Was `state.teamSquads.byClubId[clubSlug]?.[player.id]`. The slice keys by
  // NUMERIC club id and nests by year, and the bucket holds
  // { activeSquad, seasonSquad } — never players by id — so that lookup
  // resolved to undefined on every single render and the modal always fell
  // through to the api-sports CDN photo. This is the selector every other
  // consumer already goes through.
  const squadData = useSelector((state: RootState) =>
    selectActiveSquadMapped(state, clubId, currentYear),
  );
  const mainPlayerData = player?.id ? squadData?.[String(player.id)] : null;

  const mood: StanceMood = stance?.mood ?? null;
  const mySubFor = stance?.subFor ?? null;

  // 2. SORTED SUBS LOGIC
  // Which replacements the crowd wants on for THIS player.
  const sortedSubs = useMemo(() => {
    const playerStats = liveData?.live?.[String(player?.id)] ?? {};
    return substitutes
      .filter((sub) => !sub.isSubbedOut)
      .map((sub) => ({
        ...sub,
        voteCount: playerStats[`sub_req_${sub.player.id}`] || 0,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);
  }, [substitutes, liveData, player?.id]);

  const topSuggestions = sortedSubs.filter((s) => s.voteCount > 0).slice(0, 2);

  // Reopening on a different player should never inherit the last one's view.
  useEffect(() => {
    if (open) setView("main");
  }, [open, player?.id]);

  // 3. HANDLERS
  // Must stay above the `!player` bail-out below. This modal is mounted for the
  // life of the lineup with `player={selectedPlayer}`, so it first renders with
  // no player and only gets one on a tap — an early return here meant the hook
  // count grew on that tap, which React refuses ("Rendered more hooks than
  // during the previous render") and the club error boundary then swallowed
  // into "Couldn't load this club".
  const { run: submit, pending: isVoting } = useAsyncAction(
    async (next: PlayerStance) => {
      if (!player) return;
      await castStance(player.id, next);
    },
    {
      errorMessage: "Vote didn't go through. Try again.",
      toastId: `player-vote-${player?.id ?? "none"}`,
    },
  );

  const burst = (emoji: string, e?: React.MouseEvent) => {
    if (reduce) return;
    const id = Date.now() + Math.random();
    setParticles((prev) => [
      ...prev,
      { id, emoji, x: e?.clientX ?? window.innerWidth / 2, y: e?.clientY ?? 200 },
    ]);
    setTimeout(
      () => setParticles((prev) => prev.filter((p) => p.id !== id)),
      1200,
    );
  };

  /**
   * Tapping the stance you already hold clears it. A held opinion you cannot
   * take back is not an opinion, and the old counter model had no way to.
   *
   * The write is fired but NOT awaited before closing: the hook paints the
   * change on the pitch immediately and rolls it back if the write fails.
   * Previously the modal stayed open for the whole round-trip, so every vote
   * cost a visible pause on a page that is otherwise real-time.
   */
  const setMood = (next: StanceMood, e?: React.MouseEvent) => {
    const resolved = mood === next ? null : next;
    if (resolved) burst(resolved === "hot" ? "🔥" : "❄️", e);
    void submit({ mood: resolved, subFor: mySubFor });
    onClose();
  };

  const setSubFor = (subInId: string | number | null, e?: React.MouseEvent) => {
    const resolved =
      mySubFor === String(subInId) ? null : subInId == null ? null : String(subInId);
    if (resolved) burst("🔄", e);
    void submit({ mood, subFor: resolved });
    onClose();
  };

  // Every hook above this line, unconditionally.
  if (!player) return null;

  const engaged = Math.max(heat?.engaged ?? 0, 1);
  const support = heat?.support ?? 0;
  const doubt = heat?.doubt ?? 0;
  const split = support + doubt;

  return (
    <>
      <ParticleOverlay particles={particles} />
      <Dialog open={open} onClose={onClose} TransitionComponent={Zoom} fullWidth maxWidth="xs">
        <Box sx={{ p: 3, position: "relative" }}>
          {/* CLOSE */}
          <IconButton
            aria-label="Close player actions"
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
          <Stack alignItems="center" sx={{ mb: 2, mt: 1 }}>
            <Avatar
              src={
                mainPlayerData?.photo ||
                player?.photo ||
                `https://media.api-sports.io/football/players/${player.id}.png`
              }
              sx={{
                width: 90,
                height: 90,
                bgcolor: "background.default",
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: theme.clay?.card?.boxShadow,
                mb: 2,
              }}
            />
            <Typography variant="h5" fontWeight={900} align="center">
              {mainPlayerData?.name || player?.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={800}
            >
              {heat && heat.tier !== "neutral"
                ? HEAT_TIERS[heat.tier].label.toUpperCase()
                : "LIVE MATCH ACTIONS"}
            </Typography>
          </Stack>

          {/* WHAT THE ROOM THINKS */}
          {/* Counts alone said nothing — 4 votes is a landslide in a club of six
              and noise in a club of ninety. The denominator is the point. */}
          {split > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" fontWeight={900} sx={{ color: theme.palette.heat.hotSolid }}>
                  {Math.round((support / engaged) * 100)}% ON FIRE
                </Typography>
                <Typography variant="caption" fontWeight={900} sx={{ color: theme.palette.heat.coldSolid }}>
                  {Math.round((doubt / engaged) * 100)}% FROZEN
                </Typography>
              </Stack>
              <Box
                sx={{
                  display: "flex",
                  height: 8,
                  borderRadius: 999,
                  overflow: "hidden",
                  bgcolor: alpha(theme.palette.text.primary, 0.1),
                }}
              >
                <Box
                  sx={{
                    width: `${(support / split) * 100}%`,
                    bgcolor: theme.palette.heat.hotSolid,
                    transition: "width .4s ease",
                  }}
                />
                <Box sx={{ flex: 1, bgcolor: theme.palette.heat.coldSolid }} />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                {split} of {engaged} {engaged === 1 ? "fan has" : "fans have"} called it
              </Typography>
            </Box>
          )}

          {view === "main" ? (
            <Fade in>
              <Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <ActionButton
                      label={mood === "hot" ? "TAP TO UNDO" : "ON FIRE"}
                      tone="hot"
                      active={mood === "hot"}
                      icon={<WhatshotRounded sx={{ fontSize: 40 }} />}
                      onClick={(e: React.MouseEvent) => setMood("hot", e)}
                      disabled={isVoting}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <ActionButton
                      label={mood === "cold" ? "TAP TO UNDO" : "FROZEN"}
                      tone="cold"
                      active={mood === "cold"}
                      icon={<AcUnitRounded sx={{ fontSize: 40 }} />}
                      onClick={(e: React.MouseEvent) => setMood("cold", e)}
                      disabled={isVoting}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      fullWidth
                      onClick={() => setView("subs")}
                      startIcon={<SwapHorizRounded />}
                      sx={{ fontWeight: 800 }}
                    >
                      {mySubFor ? "CHANGE YOUR SUB" : "VOTE TO SUBSTITUTE"}
                    </Button>
                  </Grid>
                </Grid>

                {/* HOW CLOSE THE CROWD IS TO FORCING THE CALL */}
                {heat && heat.subOut > 0 && (
                  <SubPressure heat={heat} />
                )}

                {/* SUGGESTIONS WELL */}
                {topSuggestions.length > 0 && (
                  <Box
                    sx={{
                      ...theme.clay?.box,
                      mt: 2.5,
                      p: 2,
                      borderRadius: "20px",
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
                          engaged={engaged}
                          chosen={mySubFor === String(sub.player.id)}
                          onVote={setSubFor}
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
                        engaged={engaged}
                        chosen={mySubFor === String(sub.player.id)}
                        onVote={setSubFor}
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
    </>
  );
}

// --- SUB-COMPONENTS ---

/**
 * Colours come from `theme.palette.heat` rather than the hardcoded #E65100 /
 * #FFF3E0 / #0277BD they used to be — those were light-mode pastels painted
 * onto whatever surface the dialog happened to have, so in dark mode this was
 * two glowing white slabs.
 */
const ActionButton = ({
  label,
  tone,
  active,
  icon,
  onClick,
  disabled,
}: any) => {
  const theme = useTheme() as any;
  const reduce = useReducedMotion();
  const { heat } = theme.palette;

  const solid = tone === "hot" ? heat.hotSolid : heat.coldSolid;
  const tint = tone === "hot" ? heat.hotTint : heat.coldTint;
  const ink = tone === "hot" ? heat.hotInk : heat.coldInk;
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component={motion.div}
      whileTap={reduce ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
    >
      <Button
        fullWidth
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        sx={{
          ...theme.clay?.button,
          height: 110,
          flexDirection: "column",
          // Active reads as filled, not merely outlined: the stance you hold is
          // the loudest thing in the dialog.
          background: active ? solid : isDark ? alpha(solid, 0.14) : tint,
          border: `2px solid ${active ? solid : alpha(solid, 0.45)}`,
          color: active ? theme.palette.common.white : isDark ? solid : ink,
          transition: "background .2s ease, border-color .2s ease, color .2s ease",
          "&:hover": {
            background: active ? solid : alpha(solid, isDark ? 0.24 : 0.18),
            borderColor: solid,
          },
        }}
      >
        {icon}
        <Typography variant="caption" fontWeight={900} sx={{ mt: 1 }}>
          {label}
        </Typography>
      </Button>
    </Box>
  );
};

/** The crowd gathering, as a bar with a number of votes still to go. */
const SubPressure = ({ heat }: { heat: PlayerHeat }) => {
  const theme = useTheme() as any;
  const demand = theme.palette.heat.subDemand;

  return (
    <Box sx={{ mt: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography variant="caption" fontWeight={900} letterSpacing={0.5}>
          {heat.subDemanded ? "THE CROWD HAVE DECIDED" : "PRESSURE TO SUBSTITUTE"}
        </Typography>
        <Typography variant="caption" fontWeight={900} sx={{ color: demand }}>
          {heat.subOut}/{Math.max(heat.engaged, 1)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.round(heat.subPressure * 100)}
        sx={{
          height: 8,
          borderRadius: 999,
          bgcolor: alpha(demand, 0.15),
          "& .MuiLinearProgress-bar": { bgcolor: demand, borderRadius: 999 },
        }}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: "block" }}
      >
        {heat.subDemanded
          ? "Enough fans want them off."
          : `${heat.subRemaining} more ${heat.subRemaining === 1 ? "fan" : "fans"} to force the call.`}
      </Typography>
    </Box>
  );
};

const SubItem = ({
  sub,
  squadData,
  engaged,
  chosen,
  onVote,
  disabled,
}: any) => {
  const theme = useTheme() as any;
  const player = sub.player;
  if (!player) return null;

  const squadPlayer = squadData?.[String(player.id)];
  const pct = Math.round((sub.voteCount / Math.max(engaged, 1)) * 100);

  return (
    <ButtonBase
      onClick={(e) => onVote(player.id, e)}
      disabled={disabled}
      focusRipple={false}
      aria-pressed={chosen}
      aria-label={`Bring on ${player.name}${chosen ? ". Currently your pick — activate to undo" : ""}`}
      sx={{
        width: "100%",
        justifyContent: "space-between",
        p: 1,
        borderRadius: "12px",
        border: `2px solid ${chosen ? theme.palette.success.main : "transparent"}`,
        bgcolor: chosen ? alpha(theme.palette.success.main, 0.12) : "transparent",
        transition: "background-color .15s ease, border-color .15s ease",
        "@media (hover: hover)": {
          "&:hover": { bgcolor: "action.hover" },
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar
          src={
            squadPlayer?.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
          sx={{ bgcolor: "background.default" }}
        />
        <Box textAlign="left" sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={800} noWrap>
            {squadPlayer?.name || player.name}
          </Typography>
          {sub.voteCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {pct}% of fans want them on
            </Typography>
          )}
        </Box>
      </Stack>

      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
        {chosen && (
          <CheckCircleRounded sx={{ fontSize: 18, color: "success.main" }} />
        )}
        {sub.voteCount > 0 && (
          <Box
            sx={{
              bgcolor: "success.main",
              color: theme.palette.getContrastText(theme.palette.success.main),
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
      </Stack>
    </ButtonBase>
  );
};
