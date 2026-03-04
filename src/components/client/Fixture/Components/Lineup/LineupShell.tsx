"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  useTheme,
  Paper,
  Avatar,
  alpha,
} from "@mui/material";
import { Download as DownloadIcon, SportsSoccer } from "@mui/icons-material";
import html2canvas from "html2canvas";
import { AsyncButton } from "@/components/ui/AsyncButton";

interface LineupShellProps {
  team: Record<string, { name: string; photo: string; subText?: string }>;
  formation: string;
  formationConfig: any;
  title?: string;
  enableSave?: boolean;
}

export default function LineupShell({
  team,
  formation = "4-3-3",
  formationConfig,
  title = "My XI",
  enableSave = true,
}: LineupShellProps) {
  const theme = useTheme() as any;
  const lineupRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- IMAGE SAVER LOGIC ---
  const handleSaveImage = async () => {
    const target = lineupRef.current;
    if (!target) return;

    setIsSaving(true);
    try {
      // Small delay to ensure any layout shifts settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      const dpr = Math.min(2, window.devicePixelRatio || 1);

      const canvas = await html2canvas(target, {
        backgroundColor: theme.palette.primary.main,
        useCORS: true,
        allowTaint: false,
        scale: dpr,
        // THE FIX: Type guard to check for HTMLElement
        ignoreElements: (el) => {
          return el instanceof HTMLElement && el.dataset.nosnap === "true";
        },
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png", 1.0);
      link.download = `11Votes-${title.replace(/\s+/g, "-")}.png`;
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeLayout =
    formationConfig[formation] || formationConfig["4-3-3 Holding"] || [];

  return (
    <Box sx={{ maxWidth: 450, mx: "auto", position: "relative" }}>
      <Paper
        ref={lineupRef}
        elevation={10}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          aspectRatio: "0.72",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          // The "Grass" Pitch Effect
          background: `linear-gradient(180deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        }}
      >
        <PitchLines />

        {/* PLAYERS LAYER */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            py: 2,
            zIndex: 2,
          }}
        >
          {activeLayout.map((row: any) => (
            <Box
              key={row.rowId}
              sx={{
                display: "flex",
                justifyContent: "space-evenly",
                alignItems: "center",
                width: "100%",
              }}
            >
              {row.slots.map((slotId: number) => {
                const player = team?.[slotId];

                if (!player) return <Box key={slotId} sx={{ width: 65 }} />;

                return (
                  <Box
                    key={slotId}
                    sx={{
                      position: "relative",
                      textAlign: "center",
                      width: 70,
                    }}
                  >
                    <Avatar
                      src={player.photo}
                      sx={{
                        width: 55,
                        height: 55,
                        mx: "auto",
                        border: `3px solid white`,
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                        bgcolor: "background.paper",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: 900,
                        fontSize: "0.65rem",
                        color: "white",
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                        mt: 0.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {player.name}
                    </Typography>

                    {player.subText && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -5,
                          right: 0,
                          bgcolor: "secondary.main",
                          color: "white",
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          px: 0.6,
                          borderRadius: 1,
                          boxShadow: 2,
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
        </Box>

        {/* WATERMARK & INFO */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 3, pb: 2, zIndex: 3 }}
        >
          <Typography
            variant="caption"
            sx={{ color: "white", opacity: 0.8, fontWeight: 900 }}
          >
            {title.toUpperCase()}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <SportsSoccer sx={{ fontSize: 14, color: "white" }} />
            <Typography
              variant="caption"
              sx={{ color: "white", fontWeight: 900 }}
            >
              {formation}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* FLOATING ACTION BUTTON (Not captured in screenshot) */}
      {enableSave && (
        <Box data-nosnap="true" style={{ textAlign: "right", marginTop: 12 }}>
          <AsyncButton
            loading={isSaving}
            onClick={handleSaveImage}
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            sx={{ borderRadius: "50px", fontWeight: 900, px: 3 }}
            size="small"
          >
            Download
          </AsyncButton>
        </Box>
      )}
    </Box>
  );
}

// --- PURE CSS PITCH LINES ---
const PitchLines = () => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
      opacity: 0.3,
    }}
  >
    {/* Penalty Area Top */}
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "50%",
        height: "15%",
        border: "2px solid white",
        borderTop: 0,
      }}
    />
    {/* Center Circle */}
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "30%",
        aspectRatio: "1",
        borderRadius: "50%",
        border: "2px solid white",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        height: "2px",
        bgcolor: "white",
      }}
    />
    {/* Penalty Area Bottom */}
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "50%",
        height: "15%",
        border: "2px solid white",
        borderBottom: 0,
      }}
    />
  </Box>
);
