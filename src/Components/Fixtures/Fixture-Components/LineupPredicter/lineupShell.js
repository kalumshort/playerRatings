import React, { useRef, useState } from "react";
import { Box, Typography, Stack, useTheme, Paper, Avatar } from "@mui/material";
import { Download as DownloadIcon, SportsSoccer } from "@mui/icons-material";
import html2canvas from "html2canvas";
import { AsyncButton } from "../../../Inputs/AsyncButton";

// Ensure you point this to your AsyncButton location

export default function LineupShell({
  team, // Object: { "1": { name, photo, subText }, "2": ... }
  formation = "4-3-3",
  formationConfig, // The FORMATIONS object imported from your config file
  title = "My XI", // Optional Title
  enableSave = true,
  themeColor = "#FFF", // Optional accent color
}) {
  const theme = useTheme();
  const lineupRef = useRef();
  const [isSaving, setIsSaving] = useState(false);

  // --- IMAGE SAVER LOGIC (Reusable) ---
  const handleSaveImage = async () => {
    const target = lineupRef.current;
    if (!target) return;

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const styles = getComputedStyle(target);
      const radius = parseFloat(styles.borderRadius) || 0;

      const canvas = await html2canvas(target, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: dpr,
        ignoreElements: (el) => el?.dataset?.nosnap === "true",
      });

      const finalCanvas =
        radius > 0 ? applyRoundMask(canvas, radius * dpr) : canvas;

      const link = document.createElement("a");
      link.href = finalCanvas.toDataURL("image/png");
      link.download = `11Votes-${title.replace(/\s+/g, "-")}-${formation}.png`;
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- HELPER FUNCTIONS FOR CANVAS ---
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

  // --- LAYOUT RESOLUTION ---
  // Fallback to 4-3-3 if formation missing
  const activeLayout =
    formationConfig[formation] || formationConfig["4-3-3"] || [];

  return (
    <Paper
      sx={{
        maxWidth: 450,
        mx: "auto",
        borderRadius: "24px",
        overflow: "hidden",
      }}
    >
      <Box
        ref={lineupRef}
        sx={{
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 15px 40px -10px ${theme.palette.common.black}80`,
          aspectRatio: "0.70",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          // Base Pitch Style
        }}
      >
        {/* HEADER */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ position: "absolute", bottom: 15, right: 15, opacity: 0.8 }}
        >
          <SportsSoccer sx={{ fontSize: 18, color: "white" }} />
          <Typography variant="caption">{formation}</Typography>
        </Stack>

        <PitchLines />

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
              const player = team?.[slotId]; // Access pre-normalized data

              if (!player) return <Box key={slotId} sx={{ width: 60 }} />;

              return (
                <Box
                  key={slotId}
                  sx={{ position: "relative", textAlign: "center" }}
                >
                  <Avatar
                    src={player.photo}
                    alt={player.name}
                    sx={{
                      width: 60,
                      height: 60,
                      border: `2px solid ${themeColor}`,
                    }}
                  />

                  {/* Player Name */}
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",

                      fontWeight: 800,

                      fontSize: "0.65rem",
                      lineHeight: 1,
                      mt: 0.5,
                    }}
                  >
                    {player.name ? player.name.split(" ").pop() : "Player"}
                  </Typography>

                  {/* Optional Subtext (e.g. Vote %) */}
                  {player.subText && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: -5,
                        right: -5,
                        bgcolor: themeColor,
                        color: "#000",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        px: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      {player.subText}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}

        {/* FOOTER */}
        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            left: 10,
            width: "100%",
            textAlign: "left",
            opacity: 0.8,
          }}
        >
          <Typography variant="caption">{title.toUpperCase()}</Typography>
        </Box>

        {/* SAVE BUTTON */}
        {enableSave && (
          <Box
            data-nosnap="true"
            sx={{
              position: "absolute",
              bottom: 20,
              right: 8,
              zIndex: 10,
            }}
          >
            <AsyncButton
              loading={isSaving}
              onClick={handleSaveImage}
              variant="contained"
              startIcon={<DownloadIcon />}
              size="small"
            ></AsyncButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

// Internal Pure Component for the white lines
const PitchLines = () => (
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

        borderRadius: "50%",
      }}
    />
    <Box
      sx={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px" }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "70%",
        height: "18%",

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

        borderRadius: "50%",
      }}
    />
  </Box>
);
