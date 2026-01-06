import React, { useState, useMemo } from "react";
import "./Lineup.css";
import LineupPlayer from "./LineupPlayer";
import useGroupData from "../../../Hooks/useGroupsData";
import PlayerActionModal from "./PlayerActionModal";
import useLiveMatchStats from "../../../Hooks/useLiveMatchStats";

// 1. IMPORT ICONS & MUI COMPONENTS
import {
  Whatshot,
  AcUnit,
  ArrowDownward,
  InfoOutlined,
  Close,
} from "@mui/icons-material";
import {
  FormControlLabel,
  Switch,
  Box,
  Typography,
  IconButton,
  Paper,
} from "@mui/material";

export default function Lineup({ fixture }) {
  const { currentGroup } = useGroupData();
  const groupClubId = Number(currentGroup?.groupClubId);
  const fixtureId = fixture?.fixture?.id;
  const elapsed = fixture?.fixture?.status?.elapsed;

  // --- USE THE HOOK ---
  const { playerStatus, liveStats } = useLiveMatchStats(fixtureId, elapsed);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- UI STATES ---
  const [showLiveStatus, setShowLiveStatus] = useState(true);
  const [showLegend, setShowLegend] = useState(false);

  // --- CALCULATE LIVE LINEUP (Handle Subs) ---
  const liveLineupData = useMemo(() => {
    // 1. EXTRACT DATA INSIDE MEMO (Fixes dependency warning)
    const teamLineupData = fixture?.lineups?.find(
      (team) => team.team.id === groupClubId
    );
    const startXI = teamLineupData?.startXI || [];
    const allSubs = teamLineupData?.substitutes || [];
    const events = fixture?.events || [];

    // 2. CLONE & PREPARE
    let currentPlayers = JSON.parse(JSON.stringify(startXI));
    let subbedOutList = [];

    const subEvents = events.filter(
      (e) => e.team.id === groupClubId && e.type === "subst"
    );

    // 3. APPLY SUBS
    subEvents.forEach((event) => {
      const playerOffId = event.player.id;
      const playerOnId = event.assist.id;

      const index = currentPlayers.findIndex(
        (p) => p.player.id === playerOffId
      );

      if (index !== -1) {
        const playerOnDetails = allSubs.find((s) => s.player.id === playerOnId);

        if (playerOnDetails) {
          subbedOutList.push({
            ...currentPlayers[index],
            isSubbedOut: true,
          });

          currentPlayers[index] = {
            ...playerOnDetails,
            player: {
              ...playerOnDetails.player,
              grid: currentPlayers[index].player.grid,
            },
          };
        }
      }
    });

    const pitchPlayerIds = new Set(currentPlayers.map((p) => p.player.id));
    const unusedSubs = allSubs.filter((s) => !pitchPlayerIds.has(s.player.id));
    const finalSubsList = [...unusedSubs, ...subbedOutList];

    return { activeXI: currentPlayers, finalSubsList };
  }, [fixture, groupClubId]); // Dependencies are now stable props

  // --- DETERMINE DISPLAY DATA ---
  // We re-derive startXI/allSubs here just for the "Toggle OFF" view
  // (This is cheap and safe to do outside memo for rendering logic)
  const rawLineupData = fixture?.lineups?.find(
    (team) => team.team.id === groupClubId
  );
  const fallbackXI = rawLineupData?.startXI || [];
  const fallbackSubs = rawLineupData?.substitutes || [];

  const displayedLineup = showLiveStatus ? liveLineupData.activeXI : fallbackXI;
  const displayedSubs = showLiveStatus
    ? liveLineupData.finalSubsList
    : fallbackSubs;

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  // --- RENDER CLEAN ICONS ---
  const getStatusIcon = (playerId) => {
    if (!showLiveStatus) return null;

    const status = playerStatus[String(playerId)];
    if (!status) return null;

    if (status.wantsSubOut) {
      return (
        <div className="status-icon sub-out">
          <ArrowDownward sx={{ fontSize: 16, color: "white" }} />
        </div>
      );
    }
    if (status.isHot) {
      return (
        <div className="status-icon hot">
          <Whatshot sx={{ fontSize: 16, color: "white" }} />
        </div>
      );
    }
    if (status.isCold) {
      return (
        <div className="status-icon cold">
          <AcUnit sx={{ fontSize: 16, color: "white" }} />
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="lineup-container containerMargin"
      style={{ position: "relative" }}
    >
      <style>
        {`
          /* 1. THE CONTAINER (Badges) */
          .status-icon {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
            z-index: 1000;
            animation: bob 2s ease-in-out infinite;
          }

          .status-icon.hot { background: linear-gradient(135deg, #ff9800, #f44336); }
          .status-icon.cold { background: linear-gradient(135deg, #4fc3f7, #0288d1); }
          .status-icon.sub-out { 
            background: #d32f2f;
            animation: bob 2s ease-in-out infinite, pulseRed 1.5s infinite; 
          }

          @keyframes bob {
            0%   { transform: translate(-50%, 0px); }
            50%  { transform: translate(-50%, -4px); }
            100% { transform: translate(-50%, 0px); }
          }
          @keyframes pulseRed {
             0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7); }
             70% { box-shadow: 0 0 0 6px rgba(211, 47, 47, 0); }
             100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
          }
          .player-wrapper {
            position: relative;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          /* Key Item Row */
          .key-row {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
          }
          .key-badge {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid white;
            margin-right: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `}
      </style>

      {/* --- LIVE TOGGLE (Top Right) --- */}
      {displayedLineup.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 16,
            zIndex: 20,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            borderRadius: "20px",
            pr: 1,
            pl: 2,
            py: 0.5,
          }}
        >
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
                sx={{ color: "white", fontWeight: "bold", letterSpacing: 1 }}
              >
                LIVE
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>
      )}

      {/* --- LEGEND / KEY (Top Left) --- */}
      {displayedLineup.length > 0 && showLiveStatus && (
        <Box sx={{ position: "absolute", top: 0, left: 16, zIndex: 20 }}>
          {/* Toggle Button */}
          {!showLegend ? (
            <Box
              onClick={() => setShowLegend(true)}
              sx={{
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(4px)",
                borderRadius: "20px",
                px: 1.5,
                py: 0.5,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <InfoOutlined sx={{ color: "white", fontSize: 16, mr: 0.5 }} />
              <Typography
                variant="caption"
                sx={{ color: "white", fontWeight: "bold" }}
              >
                KEY
              </Typography>
            </Box>
          ) : (
            /* Expanded Legend */
            <Paper
              elevation={4}
              sx={{
                background: "rgba(20,20,20,0.9)",
                backdropFilter: "blur(10px)",
                borderRadius: "16px",
                p: 2,
                border: "1px solid rgba(255,255,255,0.1)",
                minWidth: "160px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Status Key
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowLegend(false)}
                  sx={{ p: 0.5, color: "white" }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>

              <div className="key-row">
                <div
                  className="key-badge"
                  style={{
                    background: "linear-gradient(135deg, #ff9800, #f44336)",
                  }}
                >
                  <Whatshot sx={{ fontSize: 12, color: "white" }} />
                </div>
                <Typography variant="caption" sx={{ color: "white" }}>
                  Top Performer
                </Typography>
              </div>

              <div className="key-row">
                <div
                  className="key-badge"
                  style={{
                    background: "linear-gradient(135deg, #4fc3f7, #0288d1)",
                  }}
                >
                  <AcUnit sx={{ fontSize: 12, color: "white" }} />
                </div>
                <Typography variant="caption" sx={{ color: "white" }}>
                  Struggling
                </Typography>
              </div>

              <div className="key-row" style={{ marginBottom: 0 }}>
                <div className="key-badge" style={{ background: "#d32f2f" }}>
                  <ArrowDownward sx={{ fontSize: 12, color: "white" }} />
                </div>
                <Typography variant="caption" sx={{ color: "white" }}>
                  Fans want Sub
                </Typography>
              </div>
            </Paper>
          )}
        </Box>
      )}

      {displayedLineup.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Lineup Loading...
        </div>
      ) : (
        <div style={{ position: "relative", paddingTop: "50px" }}>
          {/* THE PITCH */}
          <div className="pitch" style={{ padding: "15px 0px" }}>
            {displayedLineup
              .reduce((rows, { player }) => {
                const [row] = player.grid.split(":").map(Number);
                if (!rows[row]) rows[row] = [];
                rows[row].push(player);
                return rows;
              }, [])
              .reverse()
              .map((rowPlayers, rowIndex) => (
                <div
                  key={rowIndex}
                  className="row"
                  style={{ gap: "15px", marginBottom: "26px" }}
                >
                  {rowPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="player-wrapper"
                      onClick={() => handlePlayerClick(player)}
                      style={{ cursor: "pointer" }}
                    >
                      {getStatusIcon(player.id)}
                      <LineupPlayer player={player} fixture={fixture} />
                    </div>
                  ))}
                </div>
              ))}
          </div>

          <h2
            className="heading2"
            style={{ textAlign: "center", marginTop: "20px" }}
          >
            Substitutes
          </h2>

          <div className="subs-container" style={{ gap: "10px" }}>
            {displayedSubs.map((substitute) => (
              <div
                key={substitute.player.id}
                className="player-wrapper"
                onClick={() => handlePlayerClick(substitute.player)}
                style={{
                  cursor: "pointer",
                  opacity: substitute.isSubbedOut ? 0.5 : 1,
                  filter: substitute.isSubbedOut ? "grayscale(100%)" : "none",
                }}
              >
                {getStatusIcon(substitute.player.id)}
                <LineupPlayer player={substitute.player} fixture={fixture} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL */}
      <PlayerActionModal
        open={isModalOpen}
        onClose={handleCloseModal}
        player={selectedPlayer}
        fixtureId={fixtureId}
        substitutes={displayedSubs}
        elapsedTime={elapsed}
        liveData={liveStats}
      />
    </div>
  );
}
