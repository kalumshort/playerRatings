"use client";

import React from "react";
import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import {
  Download as DownloadIcon,
  IosShareRounded,
} from "@mui/icons-material";

import { AsyncButton } from "@/components/ui/AsyncButton";
import useShareImage from "@/Hooks/useShareImage";

export interface ShareActionsProps {
  /** The ShareFrame node to capture. */
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
  shareText: string;
  shareUrl?: string;
  /** Also render an explicit save button. */
  showDownload?: boolean;
  align?: "left" | "center" | "right";
  targetWidth?: number;
  sx?: SxProps<Theme>;
}

const JUSTIFY = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
} as const;

/**
 * The share button row.
 *
 * `data-nosnap="true"` is the existing exclusion convention — the renderer's
 * `ignoreElements` drops it — so this row never captures itself even when it
 * sits inside the frame it is capturing.
 *
 * The label is always "Share", never branched on the detected mode: the mode
 * resolves after mount (navigator.canShare does not exist on the server), so
 * mode-dependent copy would either flash or mismatch on hydration. "Share" is
 * truthful whether the result is a share sheet, a clipboard write or a file.
 */
export default function ShareActions({
  targetRef,
  filename,
  shareText,
  shareUrl,
  showDownload = false,
  align = "right",
  targetWidth,
  sx,
}: ShareActionsProps) {
  const { share, pending } = useShareImage();

  const run = (forceDownload = false) =>
    share({
      node: targetRef.current,
      filename,
      text: shareText,
      url: shareUrl,
      targetWidth,
      forceDownload,
    });

  return (
    <Box data-nosnap="true" sx={[{ mt: 1.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <Stack direction="row" spacing={1} justifyContent={JUSTIFY[align]}>
        {showDownload && (
          <AsyncButton
            disabled={pending}
            onClick={() => run(true)}
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<DownloadIcon />}
            sx={{ px: 2 }}
          >
            Save
          </AsyncButton>
        )}

        <AsyncButton
          loading={pending}
          onClick={() => run(false)}
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<IosShareRounded />}
          sx={{ px: 3 }}
        >
          Share
        </AsyncButton>
      </Stack>
    </Box>
  );
}
