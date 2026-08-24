"use client";

import React from "react";
import { createPortal } from "react-dom";

import useMounted from "@/Hooks/useMounted";

interface ShareStageProps {
  /** CSS width of the card. The PNG is upscaled from this to 1080px. */
  width?: number;
  children: React.ReactNode;
}

/**
 * Hosts a share card offscreen — laid out, painted, and ready to capture.
 *
 * Two decisions here, both of which look like over-engineering until they bite:
 *
 * PORTALLED TO <body>, not absolutely positioned inside the owning component.
 * `position: fixed` resolves against any transformed ancestor (framer-motion's
 * `layout`, the masonry columns on the desktop hub), and an ancestor with
 * `overflow: hidden` clips the html2canvas render. A portal has neither
 * problem. React context — theme, Redux store — still flows through, which is
 * the same mechanism MUI Dialogs rely on.
 *
 * MOVED OFFSCREEN with `left: -10000px`, not hidden with opacity, visibility,
 * display or transform. html2canvas honours all four and would produce a blank
 * or displaced PNG. `position: fixed` is excluded from scrollable overflow, so
 * pushing it off the left edge cannot create a horizontal scrollbar.
 *
 * Mounting it eagerly rather than on click is what keeps the capture inside
 * navigator.share's ~5s transient-activation window: there is no mount, layout
 * and image-fetch round trip between the tap and the rasterise.
 */
export default function ShareStage({ width = 540, children }: ShareStageProps) {
  const mounted = useMounted();
  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: -10000,
        width,
        pointerEvents: "none",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
