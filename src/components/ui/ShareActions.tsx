"use client";

import React, { useEffect } from "react";
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
  /**
   * Low-cardinality label for the analytics `share` event — which card this
   * is, not which match. See ShareImageRequest.contentType.
   */
  contentType?: string;
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
  contentType,
}: ShareActionsProps) {
  const { share, prepare, prewarm, pending } = useShareImage();

  const req = (forceDownload = false) => ({
    node: targetRef.current,
    filename,
    text: shareText,
    url: shareUrl,
    targetWidth,
    forceDownload,
    contentType,
  });

  const run = (forceDownload = false) => share(req(forceDownload));

  // Fetch the card's photos in CORS mode now, while nobody is waiting on them.
  // html2canvas re-requests every image with crossOrigin set and cannot reuse
  // the page's own no-CORS cache entries, so without this the first tap pays
  // for a full second download of every player portrait — which is what pushed
  // the render past navigator.share's activation window on iOS.
  //
  // THE POLL IS NOT PADDING. Two of the three callers put their card inside
  // ShareStage, which is gated on useMounted and so renders null on the first
  // commit — `targetRef.current` is still null when this effect first runs. A
  // one-shot warm would quietly warm nothing and leave the whole mechanism
  // inert, which is the failure it was written to prevent. Retrying until the
  // portal lands costs a handful of null checks.
  useEffect(() => {
    let timer: number | undefined;
    let tries = 0;

    const tick = () => {
      const node = targetRef.current;
      if (node) {
        prewarm(node);
        return;
      }
      // ~2s of grace, then give up: a card that has not mounted by now is not
      // going to, and the render path warms as a fallback anyway.
      if (tries++ < 20) timer = window.setTimeout(tick, 100);
    };

    tick();
    return () => window.clearTimeout(timer);
  }, [prewarm, targetRef]);

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
          // Start rasterising on the press, not on the release. Every
          // millisecond of the render that happens before the click is a
          // millisecond it does not spend out of navigator.share's transient
          // activation window. pointerdown rather than mousedown/touchstart so
          // this fires once on both, and the click still drives the share.
          onPointerDown={() => prepare(req(false))}
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
