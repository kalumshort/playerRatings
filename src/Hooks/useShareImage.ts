"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material";
import { toast } from "sonner";

import {
  renderNodeToBlob,
  shareBlobPromise,
  shareReadyFile,
  warmShareImages,
  detectShareMode,
  type ShareMode,
  type ShareOutcome,
  type SharePayload,
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
  /**
   * Begin the render before the tap that consumes it. Wire to onPointerDown —
   * see the activation note in the hook body. Safe to call repeatedly.
   */
  prepare: (req: ShareImageRequest) => void;
  /**
   * Prime the CORS image cache for a card. Wire to mount, so the first tap
   * never pays for a photo round trip. Safe to call repeatedly.
   */
  prewarm: (node: HTMLElement | null) => void;
  pending: boolean;
  /**
   * Null until mounted. Do NOT branch rendered copy on this — see the note in
   * the hook body.
   */
  mode: ShareMode | null;
}

/**
 * A render started ahead of the tap. Held for as long as one pointer
 * interaction plausibly lasts and no longer: a share card's contents change as
 * ratings come in, and a stale blob would ship yesterday's numbers. Reusing
 * only within this window means the reused render is, at worst, one press old.
 */
const PREPARED_TTL_MS = 30_000;

interface Prepared {
  key: string;
  promise: Promise<Blob>;
  at: number;
}

const keyOf = (req: ShareImageRequest) =>
  `${req.filename}|${req.targetWidth ?? ""}`;

/**
 * Capture a node and hand it to the OS, the clipboard, or the downloads folder.
 *
 * THE ACTIVATION PROBLEM, which shapes everything below. `navigator.share()`
 * requires transient user activation — roughly five seconds from the tap on
 * WebKit — and there is no way to hand it a promise, so the image must be fully
 * rendered before it is called. Rendering on the click therefore spends the
 * user's activation budget on html2canvas, and on a phone that budget ran out:
 * the share was refused, every fallback after it was gesture-gated too, and the
 * user got a silent nothing plus a toast claiming a download.
 *
 * Three things keep the budget now, in order of how much they buy:
 *
 *   prewarm   Images are fetched in CORS mode at mount, so html2canvas finds
 *             them in cache instead of re-downloading every player photo at the
 *             moment of the tap. This is the bulk of the fix.
 *   prepare   The render starts on pointerdown, ahead of the click.
 *   retry     If the sheet is refused anyway, the blob is already in hand, so
 *             one more tap opens it with no render left to do.
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
  const prepared = useRef<Prepared | null>(null);

  // Resolved after mount, never during render: navigator.canShare does not
  // exist on the server, so computing this during render would produce a
  // hydration mismatch. The consequence for callers is that button copy must be
  // mode-independent — "Share" is truthful for all three paths.
  useEffect(() => setMode(detectShareMode()), []);

  const paper = theme.palette.background.paper;

  const render = useCallback(
    (node: HTMLElement, targetWidth?: number) =>
      renderNodeToBlob(node, {
        targetWidth,
        backgroundColor: paper,
        flattenColor: paper,
      }),
    [paper],
  );

  const prewarm = useCallback((node: HTMLElement | null) => {
    // Fire and forget. warmShareImages never rejects, and a failure to warm
    // costs latency on the next share rather than correctness.
    void warmShareImages(node);
  }, []);

  const prepare = useCallback(
    (req: ShareImageRequest) => {
      if (!req.node || inFlight.current) return;

      const key = keyOf(req);
      const current = prepared.current;
      if (
        current &&
        current.key === key &&
        Date.now() - current.at < PREPARED_TTL_MS
      ) {
        return;
      }

      // Rejections are handled wherever the promise is finally awaited. Attach
      // a no-op catch so a prepared render the user never completes cannot
      // surface as an unhandled rejection.
      const promise = render(req.node, req.targetWidth);
      promise.catch(() => {});

      prepared.current = { key, promise, at: Date.now() };
    },
    [render],
  );

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
      const payload: SharePayload = {
        filename: req.filename,
        text: req.text,
        url,
      };

      // A render started on pointerdown, if it is for this exact card and still
      // fresh. Awaiting an already-settled promise is a microtask, so it costs
      // none of the activation window — which is the whole point of preparing.
      const key = keyOf(req);
      const ready = prepared.current;
      const reusable =
        ready && ready.key === key && Date.now() - ready.at < PREPARED_TTL_MS
          ? ready.promise
          : null;

      // Consumed either way: a prepared render belongs to one interaction.
      prepared.current = null;

      // NOT awaited. shareBlobPromise needs the unresolved promise so the
      // clipboard path can hand it to ClipboardItem while the user gesture is
      // still valid in Safari.
      const blobPromise = reusable ?? render(req.node, req.targetWidth);

      try {
        const outcome = await shareBlobPromise(
          blobPromise,
          payload,
          req.forceDownload ? "download" : undefined,
        );

        if (outcome === "copied") {
          toast.success("Image copied — paste it anywhere.", { id: toastId });
        } else if (outcome === "downloaded") {
          toast.success("Image saved to your downloads.", { id: toastId });
        } else if (outcome === "needs-gesture") {
          offerGestureRetry(await blobPromise, payload, toastId);
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
    [render],
  );

  return { share, prepare, prewarm, pending, mode };
}

/**
 * The second tap.
 *
 * The image is rendered and sitting in memory; all that was missing was a live
 * gesture. A toast action gives us one, and `shareReadyFile` reaches
 * `navigator.share()` without yielding the event loop, so the sheet opens.
 *
 * `allowGestureRetry: false` stops this recurring: if the sheet is refused with
 * activation this fresh, the cause is not timing, and the user is better served
 * by the copy/save fallback than by a third tap.
 */
function offerGestureRetry(
  blob: Blob,
  payload: SharePayload,
  toastId: string,
) {
  toast("Your image is ready.", {
    id: toastId,
    description: "Tap share to choose where it goes.",
    duration: 15_000,
    action: {
      label: "Share",
      onClick: () => {
        void shareReadyFile(blob, payload, false).then((outcome) => {
          if (outcome === "copied") {
            toast.success("Image copied — paste it anywhere.");
          } else if (outcome === "downloaded") {
            toast.success("Image saved to your downloads.");
          }
        });
      },
    },
  });
}

export { useShareImage };
