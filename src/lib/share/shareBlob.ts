"use client";

/**
 * Getting a PNG out of the browser and into whatever the user wants.
 *
 * Three paths, in descending order of usefulness:
 *
 *   share    — the OS share sheet, with the image attached. Phones, macOS.
 *   copy     — image on the clipboard, ready to paste. Most desktops.
 *   download — a file in ~/Downloads. Everything else.
 *
 * Two details in here are load-bearing and easy to "simplify" back into bugs.
 * Both are commented at the point they matter: the `canShare({ files })` gate
 * in `detectShareMode`, and the promise-not-blob rule in `copyOrDownload`.
 */

export type ShareOutcome =
  | "shared"
  | "copied"
  | "downloaded"
  | "cancelled"
  /**
   * The image rendered fine, but the browser refused to open the sheet because
   * transient user activation had already expired. Nothing is wrong with the
   * blob and nothing has been saved — the caller should offer a one-tap retry,
   * which arrives with fresh activation and no render left to do. See
   * shareReadyFile.
   */
  | "needs-gesture";
export type ShareMode = "share" | "copy" | "download";

export interface SharePayload {
  /** e.g. "11Votes-Arsenal-v-Man-City-XI.png" */
  filename: string;
  text?: string;
  url?: string;
}

/** 1x1 transparent PNG, used only to ask the browser what it can share. */
const PROBE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

let cachedMode: ShareMode | null = null;

/**
 * Which of the three paths this browser can actually do.
 *
 * The gate is `navigator.canShare({ files })`, NOT `typeof navigator.share ===
 * "function"`. The difference is not pedantic — `navigator.share` exists in
 * places where sharing a *file* is impossible:
 *
 *   Windows Firefox   `share` exists; file sharing is not supported, so
 *                     `share({ files })` rejects. Gating on `share` alone sends
 *                     every Firefox user down a guaranteed-failure path.
 *   Windows Chrome    `share` exists and file support varies by build.
 *                     `canShare` is the only truthful answer.
 *   Linux Chrome      `share` is undefined entirely.
 *   macOS Safari      both work; files reach the macOS share sheet.
 *   Android / iOS     both work. The happy path.
 *
 * `canShare` also validates the file *type* rather than "files in general",
 * which is why the probe is a real image/png File and not an empty object.
 *
 * All three APIs require a secure context. On `http://192.168.x.x:3000` — a
 * phone hitting a dev server over the LAN — every one of them is undefined and
 * this correctly returns "download". That is not a bug in this function; it is
 * the reason to test over https or a tunnel.
 */
export function detectShareMode(): ShareMode {
  if (cachedMode) return cachedMode;
  if (typeof navigator === "undefined") return "download";

  const bytes = Uint8Array.from(atob(PROBE_PNG_BASE64), (c) =>
    c.charCodeAt(0),
  );
  const probe = new File([bytes], "probe.png", { type: "image/png" });

  const canShareFiles =
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [probe] });

  if (canShareFiles) return (cachedMode = "share");

  const canCopyImage =
    typeof ClipboardItem === "function" &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.write === "function";

  return (cachedMode = canCopyImage ? "copy" : "download");
}

/**
 * Takes an UNRESOLVED blob promise. That is deliberate — see the Safari note in
 * `copyOrDownload`. Awaiting the render before calling this breaks clipboard
 * writes in Safari while continuing to work in Chrome, which is the worst
 * possible failure shape.
 *
 * `forceMode` exists for the explicit "Save" affordance, which must produce a
 * file even on a device that could open a share sheet. Detection is for the
 * generic button; an explicit choice overrides it.
 */
export async function shareBlobPromise(
  blobPromise: Promise<Blob>,
  payload: SharePayload,
  forceMode?: ShareMode,
): Promise<ShareOutcome> {
  if (forceMode === "download") {
    downloadBlob(await blobPromise, payload.filename);
    return "downloaded";
  }

  if ((forceMode ?? detectShareMode()) !== "share") {
    return copyOrDownload(blobPromise, payload);
  }

  return shareReadyFile(await blobPromise, payload);
}

/**
 * The synchronous half of the share, and the only part iOS actually cares
 * about.
 *
 * Call this DIRECTLY from a click handler with a blob that is already in hand
 * and it reaches `navigator.share()` without yielding the event loop once —
 * `detectShareMode` is cached, `new File` and `canShare` are synchronous — so
 * the sheet opens on the user's activation. Every other line in this module
 * exists to get a caller to this point with a rendered blob and a live gesture
 * at the same time.
 *
 * `allowGestureRetry` distinguishes the first attempt from the retry a caller
 * offers after "needs-gesture". On the retry there is no activation left to
 * blame, so a second refusal falls through to the copy/save chain rather than
 * asking the user to tap a third time.
 */
export async function shareReadyFile(
  blob: Blob,
  payload: SharePayload,
  allowGestureRetry = true,
): Promise<ShareOutcome> {
  if (detectShareMode() !== "share") {
    return copyOrDownload(Promise.resolve(blob), payload);
  }

  const file = new File([blob], payload.filename, { type: "image/png" });

  // Re-probe with the real payload: some Android targets accept `{ files }` but
  // reject `{ files, text, url }`. Degrading to files-only beats throwing.
  const full = { files: [file], text: payload.text, url: payload.url };
  const data = navigator.canShare(full) ? full : { files: [file] };

  try {
    await navigator.share(data);
    return "shared";
  } catch (err) {
    // The user dismissed the sheet. Not a failure: no toast, no fallback.
    // Same discrimination GroupInviteGenerator already makes for link shares.
    if ((err as Error)?.name === "AbortError") return "cancelled";

    // NotAllowedError on a browser that just told us it CAN share files means
    // one thing: transient user activation expired while the image rendered.
    //
    // The old code fell into copyOrDownload here, which on iOS is a chain of
    // three silent no-ops: detectShareMode() returns the cached "share" so it
    // tries clipboard.write (gesture-gated, already expired), then a
    // programmatic <a download> click (which iOS ignores without activation),
    // and then reported "downloaded" — a toast promising a file that was never
    // written. Handing the caller "needs-gesture" instead lets it ask for one
    // more tap, which is the only thing that can actually work.
    if (allowGestureRetry && (err as Error)?.name === "NotAllowedError") {
      return "needs-gesture";
    }

    return copyOrDownload(Promise.resolve(blob), payload);
  }
}

async function copyOrDownload(
  blobPromise: Promise<Blob>,
  payload: SharePayload,
): Promise<ShareOutcome> {
  if (detectShareMode() !== "download") {
    // THE SAFARI RULE: ClipboardItem must receive a PROMISE of the blob, not an
    // awaited one. Safari validates the user gesture at the moment
    // clipboard.write() is called, and rejects with NotAllowedError if an
    // `await` has already yielded the event loop since the click. So:
    //
    //   const b = await render();                          // Safari: fails
    //   clipboard.write([new ClipboardItem({ "image/png": b })]);
    //
    //   clipboard.write([new ClipboardItem({ "image/png": render() })]);  // ok
    //
    // Handing the unresolved promise straight in lets Safari hold the gesture
    // open and resolve it itself. Chrome accepts `Blob | Promise<Blob>`, so
    // this single path is correct in both.
    let renderError: unknown = null;
    const guarded = blobPromise.catch((err) => {
      renderError = err;
      throw err;
    });

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": guarded }),
      ]);
      return "copied";
    } catch {
      // clipboard.write masks the underlying rejection behind its own generic
      // error, so a render failure must be rethrown as itself — otherwise a
      // broken capture would silently "succeed" as a download of nothing.
      if (renderError) throw renderError;
      // Otherwise: permission denied, or no image support. Save it instead.
    }
  }

  downloadBlob(await blobPromise, payload.filename);
  return "downloaded";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  // Firefox honours .click() only for an anchor that is in the document.
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revoking synchronously cancels the download in Safari and Firefox — the
  // browser has not read the blob yet at this point. 10s is generous, bounded,
  // and the blob is freed either way when the tab goes.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
