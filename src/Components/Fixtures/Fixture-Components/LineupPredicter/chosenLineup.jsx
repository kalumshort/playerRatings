import React, { useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  useTheme,
  Tooltip,
} from "@mui/material";
import { Download as DownloadIcon, SportsSoccer } from "@mui/icons-material";
import html2canvas from "html2canvas";

// --- EXISTING IMPORTS ---

import whiteLogo from "../../../../assets/logo/11votes-nobg-clear-white.png";
import LineupPlayer from "../LineupPlayer";
import { FORMATIONS } from "./LineupPredictor";

export default function ChosenLineup({
  squadData,
  chosenTeam,
  formation = "4-3-3",
}) {
  const theme = useTheme();
  const lineupRef = useRef();

  // --- IMAGE SAVER LOGIC ---
  const handleSaveImage = async () => {
    const target = lineupRef.current;
    if (!target) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const styles = getComputedStyle(target);
    const radius = parseFloat(styles.borderRadius) || 0;

    const canvas = await html2canvas(target, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scale: dpr,
      ignoreElements: (el) => el?.dataset?.nosnap === "true", // hide buttons
    });

    const finalCanvas =
      radius > 0 ? applyRoundMask(canvas, radius * dpr) : canvas;

    const imgData = finalCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = `11Votes-My-XI-${formation}.png`;
    link.click();
  };

  function applyRoundMask(srcCanvas, r) {
    const masked = document.createElement("canvas");
    masked.width = srcCanvas.width;
    masked.height = srcCanvas.height;
    const ctx = masked.getContext("2d");
    ctx.drawImage(srcCanvas, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    roundRect(ctx, 0, 0, masked.width, masked.height, r);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    return masked;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  // --- LAYOUT ---
  const activeLayout = FORMATIONS[formation] || FORMATIONS["4-3-3"];

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mb: 3 }}>
      {/* --- THE PITCH CONTAINER (Ref for Screenshot) --- */}
      <Box
        ref={lineupRef}
        sx={{
          position: "relative",
          // Dark Green Gradient

          border: `2px solid ${theme.palette.divider}`,
          overflow: "hidden",
          boxShadow: `0 15px 40px -10px ${theme.palette.common.black}80`,
          aspectRatio: "0.85", // Matches DroppablePitch
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          py: 2,
        }}
      >
        {/* WATERMARK LOGO */}
        <Box
          component="img"
          src={whiteLogo}
          alt="11Votes"
          sx={{
            height: 60,
            position: "absolute",
            top: 20,
            right: 20,
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />

        {/* HEADER (Inside image) */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ position: "absolute", top: 20, left: 20, opacity: 0.9 }}
        >
          <SportsSoccer sx={{ fontSize: 18 }} />
          <Typography
            variant="caption"
            sx={{
              fontFamily: "Space Mono",
              fontWeight: "bold",
              letterSpacing: 1,
            }}
          >
            {formation}
          </Typography>
        </Stack>

        {/* VISUAL FIELD LINES */}
        <PitchLines theme={theme} />

        {/* PLAYERS LAYER */}
        {activeLayout.map((row) => (
          <Box
            key={row.rowId}
            sx={{
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              zIndex: 2,
              position: "relative",
              height: "100%",
            }}
          >
            {row.slots.map((slotId) => {
              // Retrieve player ID from the chosenTeam map
              const playerId = chosenTeam?.[slotId];
              const player = squadData?.[playerId];

              // Render spacer if no player (shouldn't happen in view mode usually)
              if (!player) return <Box key={slotId} sx={{ width: 60 }} />;

              return (
                <Box
                  key={slotId}
                  sx={{ width: 60, display: "flex", justifyContent: "center" }}
                >
                  <LineupPlayer
                    player={player}
                    showPlayerName={true}
                    // Optional: Disable drag props here since it's a static view
                    draggable={false}
                  />
                </Box>
              );
            })}
          </Box>
        ))}

        {/* FOOTER (Social Handle or App Name) */}
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            width: "100%",
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: "VT323",
              fontSize: "1.2rem",
              letterSpacing: 2,
            }}
          >
            11VOTES.COM
          </Typography>
        </Box>

        {/* SAVE BUTTON (Hidden from screenshot via data-nosnap) */}
        <Box
          data-nosnap="true"
          sx={{ position: "absolute", bottom: 15, right: 15, zIndex: 10 }}
        >
          <Tooltip title="Download Image">
            <IconButton
              onClick={handleSaveImage}
              sx={{
                backdropFilter: "blur(4px)",
                "&:hover": { bgcolor: "primary.main", color: "black" },
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}

// --- PITCH LINES (Self-contained to ensure it renders correctly in screenshot) ---
const PitchLines = ({ theme }) => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
    }}
  >
    <Box
      sx={{
        position: "absolute",
        top: "-10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "40%",
        height: "25%",
        border:
          theme.palette.mode === "dark"
            ? "2px solid rgba(255,255,255,0.15)"
            : "2px solid rgba(81, 81, 81, 1)",
        borderRadius: "50%",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "70%",
        height: "18%",
        border:
          theme.palette.mode === "dark"
            ? "2px solid rgba(255,255,255,0.15)"
            : "2px solid rgba(81, 81, 81, 1)",
        borderBottom: "none",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "35%",
        height: "7%",
        border:
          theme.palette.mode === "dark"
            ? "2px solid rgba(255,255,255,0.15)"
            : "2px solid rgba(81, 81, 81, 1)",
        borderBottom: "none",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: "12%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 4,
        height: 4,
        border:
          theme.palette.mode === "dark"
            ? "2px solid rgba(255,255,255,0.15)"
            : "2px solid rgba(255,255,255,0.15)",
        borderRadius: "50%",
      }}
    />
  </Box>
);
