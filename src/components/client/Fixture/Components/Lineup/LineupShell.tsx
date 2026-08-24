"use client";

import React, { useRef } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { SportsSoccer } from "@mui/icons-material";

import ShareFrame from "@/components/ui/ShareFrame";
import ShareActions from "@/components/ui/ShareActions";
import { fixtureSubtitle, fixtureTitle } from "@/components/ui/ShareFixtureLine";

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
  /**
   * Supplies the share frame's matchup line. Optional: without it the frame
   * falls back to `title`, so an unthreaded caller still renders correctly.
   */
  fixture?: any;
  /** Frame eyebrow. Defaults to `title`. */
  eyebrow?: string;
  /** Body text for the share sheet. */
  shareText?: string;
}

/**
 * A read-only pitch, wrapped in a branded frame, with share actions.
 *
 * The capture target used to be the bare `Pitch` surface, which meant the PNG
 * carried no branding beyond a small footer caption and dropped the score
 * banner by construction. It is now the whole `ShareFrame`, so a shared image
 * says what match it is and where it came from.
 *
 * CONSEQUENCE FOR CALLERS: `header` is now INSIDE the captured region. That is
 * usually what you want — LineupPredictorUserSquad's score banner is the story
 * of the image. Anything interactive in a `header` must carry
 * `data-nosnap="true"` or it will be rasterised into the PNG.
 */
export default function LineupShell({
  team,
  formation = DEFAULT_FORMATION,
  title = "My XI",
  enableSave = true,
  header,
  fixture,
  eyebrow,
  shareText,
}: LineupShellProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const matchup = fixture ? fixtureTitle(fixture) : "";
  const subtitle = fixture ? fixtureSubtitle(fixture) : undefined;

  return (
    <Box sx={{ maxWidth: 450, mx: "auto", position: "relative" }}>
      <ShareFrame
        frameRef={frameRef}
        eyebrow={eyebrow ?? title}
        title={matchup || title}
        subtitle={subtitle}
      >
        {header}

        <Pitch
          formation={formation}
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
      </ShareFrame>

      {enableSave && (
        <ShareActions
          targetRef={frameRef}
          filename={`11Votes-${title.replace(/\s+/g, "-")}.png`}
          shareText={
            shareText ?? (matchup ? `My XI for ${matchup}.` : `My XI on 11Votes.`)
          }
          showDownload
        />
      )}
    </Box>
  );
}
