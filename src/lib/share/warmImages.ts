"use client";

/**
 * Pre-fetch a card's images the way html2canvas is going to ask for them.
 *
 * THE PROBLEM THIS SOLVES. renderNode runs html2canvas with `useCORS: true`,
 * which makes it re-request every <img> in its clone with
 * `crossOrigin="anonymous"`. The page's own avatars and crests are plain
 * <img>/MUI <Avatar> loads with no crossOrigin, so they are cached as no-CORS
 * responses — and a no-CORS cache entry cannot satisfy a CORS request. Different
 * request mode, different cache key. The result is that every player photo on a
 * share card is downloaded a SECOND time, from media.api-sports.io, at the
 * instant the user taps Share.
 *
 * On a laptop that is invisible. On a phone on cellular, eleven-plus portraits
 * at up to `imageTimeout` each is seconds of dead time between the tap and
 * `navigator.share()` — and iOS gives that window about five seconds of
 * transient user activation before it refuses to open the share sheet at all.
 * That is the bug this file exists to remove. See shareBlob.ts for what happens
 * when the budget is missed anyway.
 *
 * WHY AN Image ELEMENT, NOT fetch(). Priming with `new Image()` +
 * `crossOrigin = "anonymous"` issues the byte-for-byte identical request
 * html2canvas will make, so the cache entry is guaranteed to match. A
 * `fetch(url, { mode: "cors" })` is close — same CORS mode, same lack of
 * credentials — but "close" here fails silently and reintroduces the exact
 * second download this is meant to prevent, with nothing in the UI to show for
 * it. Not worth the cleverness.
 */

/**
 * Module-scoped, deliberately. Warming is idempotent per URL for the lifetime
 * of the page: once the CORS entry is in the HTTP cache, html2canvas hits it
 * from any card. Keyed by URL rather than by node so the same crest shared from
 * two different cards is fetched once.
 */
const warmed = new Set<string>();

/**
 * Resolves once every image in `node` has a CORS-mode cache entry, or the
 * timeout expires. Never rejects: a photo that 404s or is missing its
 * Access-Control-Allow-Origin header will fail for html2canvas too, which drops
 * it and carries on rendering. Failing the whole share over one absent avatar
 * would be strictly worse than shipping the card without it.
 */
export function warmShareImages(
  node: HTMLElement | null,
  timeoutMs = 4000,
): Promise<void> {
  if (!node || typeof Image === "undefined") return Promise.resolve();

  const pending: string[] = [];
  node.querySelectorAll("img").forEach((img) => {
    // currentSrc is what the browser actually resolved from any srcset; src is
    // what it falls back to before load. html2canvas reads the element the same
    // way, so this is the URL it will re-request.
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
    if (warmed.has(src)) return;
    pending.push(src);
  });

  if (!pending.length) return Promise.resolve();

  return Promise.all(pending.map((src) => warmOne(src, timeoutMs))).then(
    () => undefined,
  );
}

function warmOne(src: string, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    const img = new Image();
    // MUST be assigned before `src`. Setting it afterwards is too late — the
    // request is already in flight without it, and the entry it populates is
    // the no-CORS one we are trying to get away from.
    img.crossOrigin = "anonymous";

    const done = () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      // Marked warmed on failure too, not just success. A URL that cannot be
      // fetched with CORS will not start working on the next tap, and retrying
      // it on every share would put the per-image timeout back on the critical
      // path — the precise cost this function removes.
      warmed.add(src);
      resolve();
    };

    const timer = setTimeout(done, timeoutMs);
    img.onload = done;
    img.onerror = done;
    img.src = src;
  });
}
