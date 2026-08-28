"use client";

import html2canvas from "html2canvas";

import { warmShareImages } from "./warmImages";

/**
 * DOM node -> PNG blob.
 *
 * Extracted from LineupShell's inline `handleSaveImage`, which was the app's
 * only image export. Three things changed in the move, all of them bugs there:
 *
 *   1. `toDataURL` -> `toBlob`. A base64 string cannot become a `File`, which
 *      is what `navigator.share({ files })` requires. It also base64'd ~1MB
 *      into a string for no reason.
 *   2. `scale: min(2, devicePixelRatio)` -> a scale derived from a target
 *      width. The old form shipped the same card at 1x on a non-retina desktop
 *      and 2x on a phone, so the "same" share was two different resolutions.
 *   3. The gradient flattening was keyed on a hard-coded `[data-pitch-surface]`
 *      selector. It is now the `data-share-flatten` convention, so any card can
 *      opt in.
 *
 * NOTE ON html2canvas 1.4.1: unmaintained since 2022. It cannot parse `oklch`,
 * `color-mix` or `backdrop-filter`. MUI v7 + Emotion currently emit hex and
 * `rgba()` so we are fine, but adopting MUI's CSS-variables theme
 * (`colorSchemes`) would break every share card silently.
 */

export interface RenderNodeOptions {
  /** Output PNG width in px. Every card ships at this width. Default 1080. */
  targetWidth?: number;
  /** Painted behind the node. */
  backgroundColor?: string;
  /** Fill for `[data-share-flatten]` elements that give no explicit value. */
  flattenColor: string;
}

/**
 * Per-image ceiling, shared by the warm pass and html2canvas so a slow photo
 * can only cost this once. The default 15000 would blow the transient
 * activation window on its own.
 */
const IMAGE_TIMEOUT_MS = 4000;

export class ShareRenderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ShareRenderError";
  }
}

export async function renderNodeToBlob(
  node: HTMLElement,
  opts: RenderNodeOptions,
): Promise<Blob> {
  const cssWidth = node.offsetWidth || 1;
  const targetWidth = opts.targetWidth ?? 1080;
  // Never below 1 (upscaling a wide node would blur it), never above 4 (a
  // narrow node would otherwise allocate a canvas big enough to OOM a phone).
  const scale = Math.min(4, Math.max(1, targetWidth / cssWidth));

  // Resolved-once promise after first paint, so this costs a microtask rather
  // than a frame. next/font is same-origin (/_next/static/media/*.woff2) so the
  // clone resolves @font-face from cache; this only guards the cold case.
  // Replaces the old unconditional 300ms setTimeout, which bought nothing and
  // spent 300ms of navigator.share's ~5s transient-activation budget.
  await document.fonts?.ready;

  // `useCORS: true` below makes html2canvas re-request every image with
  // crossOrigin="anonymous", which cannot reuse the page's no-CORS cache
  // entries. Warming here rather than only in the caller keeps that cost off
  // the critical path even for a caller that never calls warmShareImages
  // itself: pre-warmed images make this a no-op, and a cold node pays the same
  // network it was going to pay inside html2canvas anyway — but under one
  // shared timeout instead of `imageTimeout` per image. See warmImages.ts.
  await warmShareImages(node, IMAGE_TIMEOUT_MS);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(node, {
      backgroundColor: opts.backgroundColor ?? null,
      useCORS: true,
      // MUST stay false. A tainted canvas makes toBlob throw SecurityError,
      // which surfaces as a total failure rather than one missing avatar.
      //
      // Safe to keep strict because media.api-sports.io — the source of every
      // player photo and club crest — does send Access-Control-Allow-Origin.
      // Verified by fetching one with `mode: "cors"` (200) and by rendering one
      // through html2canvas under these exact options. If that ever changes,
      // affected images vanish from the PNG silently rather than throwing.
      allowTaint: false,
      scale,
      // The default 15000 would blow the transient-activation window on a slow
      // image, turning a share into a silent clipboard fallback. By this point
      // the warm pass above has already put these in cache.
      imageTimeout: IMAGE_TIMEOUT_MS,
      logging: false,
      // windowWidth/windowHeight deliberately left at their defaults.
      // Overriding them re-evaluates MUI's breakpoint media queries inside the
      // clone, so the PNG would stop matching what the user actually tapped.
      ignoreElements: (el) =>
        el instanceof HTMLElement && el.dataset.nosnap === "true",
      onclone: (doc) => {
        flattenShareSurfaces(doc, opts.flattenColor);
        freezeAnimations(doc);
      },
    });
  } catch (err) {
    throw new ShareRenderError("html2canvas failed", { cause: err });
  }

  try {
    return await canvasToBlob(canvas);
  } finally {
    // A 1080x1600 @2x canvas is ~7MB of RGBA. Release it before the share sheet
    // opens, or repeated taps OOM the tab on a low-end Android.
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Flattens gradient surfaces to a solid colour in the clone.
 *
 *   <Box data-share-flatten />            -> filled with `fallback`
 *   <Box data-share-flatten="#1F1F25" />  -> filled with that colour
 *
 * html2canvas parses radial-gradient but its rasteriser doesn't reliably match
 * the browser, and it renders no box-shadow at all. Flattening to the
 * gradient's solid end-stop is deterministic and costs nothing visually —
 * the app's gradients all resolve to `background.paper` well before their edge.
 *
 * The `"true"` guard is not defensive padding. JSX's bare `data-share-flatten`
 * serialises to the STRING "true", not to an empty attribute, so a naive
 * `explicit || fallback` assigns `background: "true"` — invalid CSS that the
 * browser silently drops, leaving every surface unflattened and the whole
 * mechanism inert with no error anywhere.
 */
function flattenShareSurfaces(doc: Document, fallback: string) {
  doc.querySelectorAll<HTMLElement>("[data-share-flatten]").forEach((el) => {
    const raw = el.dataset.shareFlatten;
    const explicit = raw && raw !== "true" ? raw : undefined;
    el.style.background = explicit ?? fallback;
    el.style.boxShadow = "none";
  });
}

/**
 * html2canvas captures whatever frame an animation happens to be on. Without
 * this, the MOTM medal's float-pulse is caught mid `translateY(-3px)` and a
 * shimmer sweep lands as a white band across a progress bar — both read as
 * rendering bugs in a still image.
 */
function freezeAnimations(doc: Document) {
  const style = doc.createElement("style");
  style.textContent =
    "*,*::before,*::after{animation:none!important;transition:none!important}";
  doc.head.appendChild(style);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // No quality argument: it is ignored for image/png.
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new ShareRenderError("canvas produced no blob"));
      }, "image/png");
    } catch (err) {
      // SecurityError, if anything managed to taint the canvas.
      reject(new ShareRenderError("canvas is tainted", { cause: err }));
    }
  });
}
