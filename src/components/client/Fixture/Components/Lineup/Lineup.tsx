"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Switch,
  FormControlLabel,
  Fade,
} from "@mui/material";
import { InfoOutlined, Close } from "@mui/icons-material";

// Components & Hooks

import { getLiveLineup } from "./lineupUtils";

import { StatusBadge, StatusLegend } from "./LineupStatusUI";
import useLiveMatchStats from "@/Hooks/useLiveMatchStats";
import PlayerActionModal from "./PlayerActionModal";
import LineupPlayer from "./LineupPlayer";
import { useClubView } from "@/context/ClubViewProvider";

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

  const isMatchLive = ["1H", "HT", "2H", "ET", "P"].includes(
    fixture?.fixture?.status?.short,
  );

  // 1. DATA & STATE
  const { playerStatus, liveStats } = useLiveMatchStats(
    fixtureId,
    elapsed,
    groupId,
    currentYear,
  );
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showLiveStatus, setShowLiveStatus] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

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

  return (
    <Paper
      sx={{
        position: "relative",
      }}
    >
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

      {/* --- THE PITCH --- */}
      <Box
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
            {rowPlayers.map((player) => (
              <Box
                key={player.id}
                sx={{ position: "relative" }}
                onClick={() => {
                  showLiveStatus && setSelectedPlayer(player);
                }}
              >
                <StatusBadge
                  status={playerStatus[String(player.id)]}
                  visible={showLiveStatus}
                />
                <LineupPlayer player={player} fixture={fixture} />
              </Box>
            ))}
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
        {finalSubsList.map((sub) => (
          <Box
            key={sub.player.id}
            sx={{
              position: "relative",
              opacity: sub.isSubbedOut ? 0.4 : 1,
              filter: sub.isSubbedOut ? "grayscale(1)" : "none",
            }}
          >
            <StatusBadge
              status={playerStatus[String(sub.player.id)]}
              visible={showLiveStatus}
            />
            <LineupPlayer player={sub.player} fixture={fixture} />
          </Box>
        ))}
      </Box>

      {!!isGuestView ||
        (!isMatchLive && showLiveStatus && (
          <PlayerActionModal
            open={!!selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            player={selectedPlayer}
            fixtureId={fixtureId}
            substitutes={finalSubsList}
            elapsedTime={elapsed}
            liveData={liveStats}
            groupId={groupId}
            currentYear={currentYear}
          />
        ))}
    </Paper>
  );
}
