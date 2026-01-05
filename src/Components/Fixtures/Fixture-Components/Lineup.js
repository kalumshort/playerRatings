import React, { useState } from "react";
import "./Lineup.css";
import LineupPlayer from "./LineupPlayer";
import useGroupData from "../../../Hooks/useGroupsData";
import PlayerActionModal from "./PlayerActionModal";
import useLiveMatchStats from "../../../Hooks/useLiveMatchStats";

// 1. IMPORT ICONS & MUI COMPONENTS
import { Whatshot, AcUnit, ArrowDownward } from "@mui/icons-material";
import { FormControlLabel, Switch, Box, Typography } from "@mui/material";

export default function Lineup({ fixture }) {
  const { currentGroup } = useGroupData();
  const groupClubId = Number(currentGroup?.groupClubId);
  const fixtureId = fixture?.fixture?.id;
  const elapsed = fixture?.fixture?.status?.elapsed;

  // --- USE THE HOOK ---
  const { playerStatus, liveStats } = useLiveMatchStats(fixtureId, elapsed);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- TOGGLE STATE ---
  const [showLiveStatus, setShowLiveStatus] = useState(true);

  const lineup =
    fixture?.lineups?.find((team) => team.team.id === groupClubId)?.startXI ||
    [];
  const subs =
    fixture?.lineups?.find((team) => team.team.id === groupClubId)
      ?.substitutes || [];

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
    // 1. If toggle is OFF, return nothing immediately
    if (!showLiveStatus) return null;

    const status = playerStatus[String(playerId)];
    if (!status) return null;

    // Priority 1: Sub Out (Most Urgent)
    if (status.wantsSubOut) {
      return (
        <div className="status-icon sub-out">
          <ArrowDownward sx={{ fontSize: 16, color: "white" }} />
        </div>
      );
    }
    // Priority 2: Hot
    if (status.isHot) {
      return (
        <div className="status-icon hot">
          <Whatshot sx={{ fontSize: 16, color: "white" }} />
        </div>
      );
    }
    // Priority 3: Cold
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
      {/* CSS IN JS FOR CLEAN ANIMATION */}
      <style>
        {`
          /* 1. THE CONTAINER (Badges) */
          .status-icon {
            position: absolute;
            top: -20px; /* Slight overlap with bottom of avatar */
            left: 50%;
            transform: translateX(-50%); /* Perfectly Centered */
            
            width: 26px;
            height: 26px;
            border-radius: 50%;
            
            display: flex;
            align-items: center;
            justify-content: center;
            
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            border: 2px solid white; /* Clean white border defines edges */
            z-index: 1000;
            
            /* The Bobbing Animation */
            animation: bob 2s ease-in-out infinite;
          }

          /* 2. COLORS */
          .status-icon.hot {
            background: linear-gradient(135deg, #ff9800, #f44336);
          }
          
          .status-icon.cold {
            background: linear-gradient(135deg, #4fc3f7, #0288d1);
          }
          
          .status-icon.sub-out {
            background: #d32f2f;
            animation: bob 2s ease-in-out infinite, pulseRed 1.5s infinite; /* Double animation for urgency */
          }

          /* 3. ANIMATIONS */
          @keyframes bob {
            0%   { transform: translate(-50%, 0px); }
            50%  { transform: translate(-50%, -4px); } /* Moves UP */
            100% { transform: translate(-50%, 0px); }
          }
          
          @keyframes pulseRed {
             0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7); }
             70% { box-shadow: 0 0 0 6px rgba(211, 47, 47, 0); }
             100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
          }

          /* WRAPPER */
          .player-wrapper {
            position: relative;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
        `}
      </style>

      {/* --- LIVE TOGGLE (Top Right) --- */}
      {lineup.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 16,
            zIndex: 10,
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
                color="secondary" // Or use your theme accent color
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

      {lineup.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Lineup Loading...
        </div>
      ) : (
        <div style={{ position: "relative", paddingTop: "40px" }}>
          {/* THE PITCH */}
          <div className="pitch" style={{ padding: "15px 0px" }}>
            {lineup
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
                  style={{ gap: "15px", marginBottom: "15px" }}
                >
                  {rowPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="player-wrapper"
                      onClick={() => handlePlayerClick(player)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* RENDER CLEAN ICON */}
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
            {subs.map((substitute) => (
              <div
                key={substitute.player.id}
                className="player-wrapper"
                onClick={() => handlePlayerClick(substitute.player)}
                style={{ cursor: "pointer" }}
              >
                {/* Substitutes can have icons too */}
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
        substitutes={subs}
        elapsedTime={elapsed}
        liveData={liveStats}
      />
    </div>
  );
}
