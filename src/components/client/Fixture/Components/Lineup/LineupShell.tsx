"use client";

import React, { useRef, useState } from "react";
import { Box, Typography, Stack, useTheme } from "@mui/material";
import { Download as DownloadIcon, SportsSoccer } from "@mui/icons-material";
import html2canvas from "html2canvas";
import { AsyncButton } from "@/components/ui/AsyncButton";
import { toast } from "sonner";

import Pitch from "./Pitch";
import { PitchPlayer, type PitchPlayerStatus } from "./PitchPlayer";
import { DEFAULT_FORMATION } from "./formations";

export interface LineupShellPlayer {
  name: string;
  photo: string;
  subText?: string;
  status?: PitchPlayerStatus;
  fullName?: string;
}

interface LineupShellProps {
  team: Record<string, LineupShellPlayer>;
  formation: string;
  title?: string;
  enableSave?: boolean;
  /** Rendered above the pitch — score banners, segmented controls. */
  header?: React.ReactNode;
}

export default function LineupShell({
  team,
  formation = DEFAULT_FORMATION,
  title = "My XI",
  enableSave = true,
  header,
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
        backgroundColor: theme.palette.background.paper,
        useCORS: true,
        allowTaint: false,
        scale: dpr,
        ignoreElements: (el) => {
          return el instanceof HTMLElement && el.dataset.nosnap === "true";
        },
        // html2canvas parses radial-gradient but its rasteriser doesn't
        // reliably match the browser, and it renders no box-shadow at all.
        // Flattening to the gradient's solid end-stop is deterministic and
        // costs nothing visually.
        onclone: (doc) => {
          const surface = doc.querySelector<HTMLElement>("[data-pitch-surface]");
          if (surface) {
            surface.style.background = theme.palette.background.paper;
          }
        },
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png", 1.0);
      link.download = `11Votes-${title.replace(/\s+/g, "-")}.png`;
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
      toast.error("Couldn't save the image. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 450, mx: "auto", position: "relative" }}>
      {header}

      <Pitch
        formation={formation}
        surfaceRef={lineupRef}
        renderSlot={({ slotId }) => {
          const player = team?.[slotId];
          if (!player) return null;

          return (
            <PitchPlayer
              name={player.name}
              fullName={player.fullName ?? player.name}
              photo={player.photo}
              badge={player.subText}
              status={player.status ?? "default"}
              size={55}
            />
          );
        }}
        footer={
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 3, pb: 2 }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {title.toUpperCase()}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <SportsSoccer sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {formation}
              </Typography>
            </Stack>
          </Stack>
        }
      />

      {/* FLOATING ACTION BUTTON (Not captured in screenshot) */}
      {enableSave && (
        <Box data-nosnap="true" sx={{ textAlign: "right", mt: 1.5 }}>
          <AsyncButton
            loading={isSaving}
            onClick={handleSaveImage}
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            sx={{ px: 3 }}
            size="small"
          >
            Download
          </AsyncButton>
        </Box>
      )}
    </Box>
  );
}
