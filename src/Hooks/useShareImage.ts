"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material";
import { toast } from "sonner";

import {
  renderNodeToBlob,
  shareBlobPromise,
  detectShareMode,
  type ShareMode,
  type ShareOutcome,
} from "@/lib/share";

export interface ShareImageRequest {
  /** The node to rasterise. Null is tolerated (returns "failed"). */
  node: HTMLElement | null;
  filename: string;
  text?: string;
  /** Defaults to the current page URL, hash stripped. */
  url?: string;
  /** Output PNG width. Default 1080. */
  targetWidth?: number;
  /** Sonner dedupe key. Defaults to the filename. */
  toastId?: string;
  /**
   * Force the download path, skipping detection. For an explicit "Save"
   * button, which must produce a file even where a share sheet is available.
   */
  forceDownload?: boolean;
}

export interface UseShareImage {
  share: (req: ShareImageRequest) => Promise<ShareOutcome | "failed">;
  pending: boolean;
  /**
   * Null until mounted. Do NOT branch rendered copy on this — see the note in
   * the hook body.
   */
  mode: ShareMode | null;
}

/**
 * Capture a node and hand it to the OS, the clipboard, or the downloads folder.
 *
 * The theme is read here rather than inside the renderer because the renderer
 * is deliberately React-free. Only two colours need passing: the clone inherits
 * every other computed style from the live DOM (Emotion's <style> tags come
 * along), which is how light/dark mode reaches the PNG for free.
 */
export default function useShareImage(): UseShareImage {
  const theme = useTheme();
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<ShareMode | null>(null);

  // Guard on a ref, not on `pending`. Two taps dispatched in the same React
  // tick both read the pre-update state value, so a state-based guard lets the
  // second one through and runs two captures against one node.
  const inFlight = useRef(false);

  // Resolved after mount, never during render: navigator.canShare does not
  // exist on the server, so computing this during render would produce a
  // hydration mismatch. The consequence for callers is that button copy must be
  // mode-independent — "Share" is truthful for all three paths.
  useEffect(() => setMode(detectShareMode()), []);

  const paper = theme.palette.background.paper;

  const share = useCallback(
    async (req: ShareImageRequest): Promise<ShareOutcome | "failed"> => {
      if (inFlight.current) return "cancelled";
      if (!req.node) {
        console.error("[useShareImage] no node to capture");
        return "failed";
      }

      inFlight.current = true;
      setPending(true);

      const toastId = req.toastId ?? req.filename;
      const url = req.url ?? window.location.href.split("#")[0];

      // NOT awaited. shareBlobPromise needs the unresolved promise so the
      // clipboard path can hand it to ClipboardItem while the user gesture is
      // still valid in Safari.
      const blobPromise = renderNodeToBlob(req.node, {
        targetWidth: req.targetWidth,
        backgroundColor: paper,
        flattenColor: paper,
      });

      try {
        const outcome = await shareBlobPromise(
          blobPromise,
          { filename: req.filename, text: req.text, url },
          req.forceDownload ? "download" : undefined,
        );

        if (outcome === "copied") {
          toast.success("Image copied — paste it anywhere.", { id: toastId });
        } else if (outcome === "downloaded") {
          toast.success("Image saved to your downloads.", { id: toastId });
        }
        // "shared" and "cancelled" get nothing: the OS sheet was the feedback.

        return outcome;
      } catch (err) {
        console.error("[useShareImage] capture failed:", err);
        toast.error("Couldn't create the image. Try again.", { id: toastId });
        return "failed";
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    },
    [paper],
  );

  return { share, pending, mode };
}

export { useShareImage };
