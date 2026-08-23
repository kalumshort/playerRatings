"use client";

import React from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";

export interface ShareFrameProps {
  /** The node html2canvas rasterises. Put the ref here, not on the content. */
  frameRef?: React.Ref<HTMLDivElement>;
  /** Small caps, top right — "CONSENSUS XI", "FAN RATINGS", "MY PREDICTIONS". */
  eyebrow?: string;
  /** Big line — usually "Arsenal v Man City". */
  title?: React.ReactNode;
  /** Under the title — competition and kickoff. */
  subtitle?: string;
  /** Bottom-left credit, usually the group name. */
  footerNote?: string;
  /** Fixed CSS width for offscreen cards. Omit to fill the parent. */
  width?: number;
  children: React.ReactNode;
}

/**
 * The branded slab every share image is captured from.
 *
 * `data-share-flatten` opts the root into the renderer's gradient flattening —
 * see src/lib/share/renderNode.ts. Everything else uses theme tokens rather
 * than the raw hexes in app/opengraph-image.tsx, because those are dark-mode
 * only and this frame renders in whatever mode the user is in.
 *
 * THE FOOTER URL IS LOAD-BEARING. On iOS, `navigator.share({ files, text, url })`
 * reaches most targets intact, but WhatsApp and Instagram take the image and
 * silently drop `text` and `url`. The URL burned into the pixels is the only
 * attribution that survives those two.
 */
export default function ShareFrame({
  frameRef,
  eyebrow,
  title,
  subtitle,
  footerNote,
  width,
  children,
}: ShareFrameProps) {
  return (
    <Box
      ref={frameRef}
      data-share-flatten
      sx={(theme: any) => ({
        ...(theme.clay?.card ?? {}),
        width: width ?? "100%",
        p: 2,
        borderRadius: "16px",
        overflow: "hidden",
      })}
    >
      {/* Brand row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: title || subtitle ? 1.5 : 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {/* Same-origin, so no CORS concern in the capture. The 871KB full
              logo stays uninlined — this is the
              icon the header already uses. */}
          <Box
            component="img"
            src="/assets/logo/11Votes_Icon_Blue.png"
            alt=""
            sx={{ width: 20, height: 20, display: "block" }}
          />
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: 2.5,
              color: "primary.main",
            }}
          >
            11VOTES
          </Typography>
        </Stack>

        {eyebrow && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 900,
              letterSpacing: 1.5,
              color: "text.secondary",
            }}
          >
            {eyebrow.toUpperCase()}
          </Typography>
        )}
      </Stack>

      {/* Headline */}
      {(title || subtitle) && (
        <Box sx={{ mb: 1.5 }}>
          {title && (
            <Typography
              variant="h6"
              sx={{ fontWeight: 900, lineHeight: 1.15, letterSpacing: -0.3 }}
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 700 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      {children}

      <Divider sx={{ mt: 2, mb: 1 }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontWeight: 700 }}
        >
          {footerNote ?? ""}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontWeight: 900, letterSpacing: 0.5 }}
        >
          11votes.com
        </Typography>
      </Stack>
    </Box>
  );
}
