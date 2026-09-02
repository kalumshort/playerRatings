"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";

// Components & Hooks

import { getLiveLineup } from "./lineupUtils";

import { StatusBadge, StatusLegend } from "./LineupStatusUI";
import LiveVerdictBar from "./LiveVerdictBar";
import useLiveMatchStats from "@/Hooks/useLiveMatchStats";
import PlayerActionModal from "./PlayerActionModal";
import LineupPlayer from "./LineupPlayer";
import { isLive } from "@/lib/utils/football-logic";
import { useAuth } from "@/context/AuthContext";
import { useParticipationCap } from "@/lib/gamification/useParticipationCap";

export default function Lineup({
  fixture,
  groupId,
  currentYear,
  groupData,
  isGuestView,
}: {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
  isGuestView: boolean;
}) {
  const fixtureId = fixture?.fixture?.id;
  const elapsed = fixture?.fixture?.status?.elapsed;
  const clubId = groupData?.groupClubId;
  const { user } = useAuth();
  const reduce = useReducedMotion();

  // Was a local ["1H","HT","2H","ET","P"] list — one of four that had drifted
  // apart across the fixture page. A match in BT, SUSP, INT or LIVE is in play
  // and now says so here too.
  const isMatchLive = isLive(fixture);

  // Voting stays unlimited; only the XP marker write stops once capped.
  const liveXpCapped = useParticipationCap(String(fixtureId), "liveVotes");

  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showLiveStatus, setShowLiveStatus] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  // Live actions are exactly that: hot/cold/sub votes are writes against the
  // in-play match, so they belong to a match in play and to a member.
  //
  // `showLiveStatus` is deliberately NOT part of this any more. It is a display
  // switch for the badges, but ANDing it in here meant hiding the badges also
  // silently killed every tap target on the pitch — a fan who wanted a clean
  // view lost the ability to vote and was told nothing.
  const canVoteLive = !isGuestView && isMatchLive && Boolean(user?.uid);

  // 1. DATA & STATE
  const { heatFor, heatBoard, liveStats, myStances, voterCount, castStance } =
    useLiveMatchStats({
      fixtureId,
      elapsed,
      groupId,
      currentYear,
      userId: user?.uid,
      canVote: canVoteLive,
      xpCapReached: liveXpCapped,
    });

  // 2. LIVE LINEUP CALCULATION
  const { activeXI, finalSubsList } = useMemo(() => {
    const teamData = fixture?.lineups?.find(
      (t: any) => t.team.id === Number(clubId),
    );

    if (showLiveStatus) {
      return getLiveLineup(teamData, fixture?.events || [], clubId);
    } else {
      return {
        activeXI: teamData?.startXI || [],
        finalSubsList: teamData?.substitutes || [],
      };
    }
    // Narrowed from [fixture]: the listener now dispatches only changed keys,
    // so lineups/events keep their identity across an elapsed-only tick and
    // this no longer recomputes once a minute during a live match.
  }, [fixture?.lineups, fixture?.events, clubId, showLiveStatus]);

  // 3. PITCH GRID ORGANIZER
  // A Map rather than a sparse array indexed by row number. The old version
  // crashed on a null `grid`, left holes that `rowPlayers.map` could hit, and
  // keyed rows by their post-reverse index, which shifts when a row empties.
  // Sorted descending to keep the previous ordering (GK at the bottom).
  const rows = useMemo(() => {
    const byRow = new Map<number, any[]>();
    activeXI.forEach(({ player }: any) => {
      const parsed = parseInt(String(player?.grid ?? "").split(":")[0], 10);
      const rowIdx = Number.isFinite(parsed) ? parsed : 0;
      if (!byRow.has(rowIdx)) byRow.set(rowIdx, []);
      byRow.get(rowIdx)!.push(player);
    });
    return [...byRow.entries()].sort((a, b) => b[0] - a[0]);
  }, [activeXI]);

  // Names for the verdict headline, from whoever is on the teamsheet.
  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    activeXI.forEach(({ player }: any) => {
      if (player?.id) map[String(player.id)] = player.name?.split(" ").pop() ?? player.name;
    });
    finalSubsList.forEach((sub: any) => {
      const p = sub?.player;
      if (p?.id) map[String(p.id)] = p.name?.split(" ").pop() ?? p.name;
    });
    return map;
  }, [activeXI, finalSubsList]);

  const openPlayer = (player: any) => {
    if (canVoteLive) setSelectedPlayer(player);
  };

  // Entrance only, and only when the whole panel mounts. Every child inherits
  // these, so the XI arrives row by row instead of snapping in as a block.
  const pitchVariants = reduce
    ? undefined
    : {
        hidden: {},
        shown: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
      };
  const tokenVariants = reduce
    ? undefined
    : {
        hidden: { opacity: 0, y: 10, scale: 0.9 },
        shown: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring" as const, stiffness: 380, damping: 26 },
        },
      };

  return (
    <Paper sx={{ position: "relative" }}>
      {/* --- TOP CONTROLS --- */}
      <Box
        sx={{
          position: "absolute",
          top: 30,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          zIndex: 10,
          px: 1,
        }}
      >
        <StatusLegend
          open={showLegend}
          setOpen={setShowLegend}
          active={showLiveStatus}
        />

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={showLiveStatus}
              onChange={(e) => setShowLiveStatus(e.target.checked)}
              color="secondary"
            />
          }
          label={
            <Typography
              variant="caption"
              sx={{ color: "white", fontWeight: 900 }}
            >
              LIVE
            </Typography>
          }
          sx={{
            bgcolor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            borderRadius: "20px",
            pr: 1,
            pl: 2,
            m: 0,
          }}
        />
      </Box>

      <Box sx={{ pt: 9, px: 1 }}>
        {isMatchLive && (
          <LiveVerdictBar
            heatBoard={heatBoard}
            voterCount={voterCount}
            nameById={nameById}
            showHint={canVoteLive && Object.keys(myStances).length === 0}
          />
        )}
      </Box>

      {/* --- THE PITCH --- */}
      {/* One LayoutGroup over pitch AND bench: a substitution unmounts a token
          on one and mounts it on the other, and a shared layoutId turns that
          into the player actually travelling between them. */}
      <LayoutGroup id={`lineup-${fixtureId}`}>
        <Box
          component={motion.div}
          variants={pitchVariants}
          initial="hidden"
          animate="shown"
          className="pitch"
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            py: 4,
            maxWidth: 600,
            mx: "auto",
          }}
        >
          {rows.map(([rowIdx, rowPlayers]) => (
            <Box
              key={rowIdx}
              sx={{
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <AnimatePresence initial={false}>
                {rowPlayers.map((player) => (
                  <Box
                    component={motion.div}
                    key={player.id}
                    layoutId={`player-${player.id}`}
                    variants={tokenVariants}
                    exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
                    sx={{ position: "relative" }}
                  >
                    <StatusBadge
                      heat={heatFor(player.id)}
                      visible={showLiveStatus && isMatchLive}
                    />
                    <LineupPlayer
                      player={player}
                      fixture={fixture}
                      interactive={canVoteLive}
                      onClick={() => openPlayer(player)}
                      heat={isMatchLive ? heatFor(player.id) : undefined}
                      stance={myStances[String(player.id)]}
                    />
                  </Box>
                ))}
              </AnimatePresence>
            </Box>
          ))}
        </Box>

        {/* --- SUBSTITUTES --- */}
        <Typography variant="h6" align="center" sx={{ my: 3, fontWeight: 900 }}>
          Substitutes
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2,
            pb: 4,
          }}
        >
          <AnimatePresence initial={false}>
            {finalSubsList.map((sub) => (
              <Box
                component={motion.div}
                key={sub.player.id}
                layoutId={`player-${sub.player.id}`}
                initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: sub.isSubbedOut ? 0.4 : 1,
                  scale: 1,
                }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
                sx={{
                  position: "relative",
                  filter: sub.isSubbedOut ? "grayscale(1)" : "none",
                }}
              >
                <StatusBadge
                  heat={heatFor(sub.player.id)}
                  visible={showLiveStatus && isMatchLive && !sub.isSubbedOut}
                />
                <LineupPlayer
                  player={sub.player}
                  fixture={fixture}
                  // A player already off cannot be rated or asked off again.
                  interactive={canVoteLive && !sub.isSubbedOut}
                  onClick={() => openPlayer(sub.player)}
                  heat={isMatchLive ? heatFor(sub.player.id) : undefined}
                  stance={myStances[String(sub.player.id)]}
                />
              </Box>
            ))}
          </AnimatePresence>
        </Box>
      </LayoutGroup>

      {canVoteLive && (
        <PlayerActionModal
          open={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          player={selectedPlayer}
          substitutes={finalSubsList}
          liveData={liveStats}
          heat={selectedPlayer ? heatFor(selectedPlayer.id) : undefined}
          stance={
            selectedPlayer ? myStances[String(selectedPlayer.id)] : undefined
          }
          castStance={castStance}
          clubId={clubId}
          currentYear={currentYear}
        />
      )}
    </Paper>
  );
}
