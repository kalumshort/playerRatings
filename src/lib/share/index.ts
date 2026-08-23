"use client";

// Browser-only: renderNode pulls in html2canvas, which has no business in a
// server graph. The directive makes that boundary explicit rather than relying
// on every consumer happening to be a client component.

export { renderNodeToBlob, ShareRenderError } from "./renderNode";
export type { RenderNodeOptions } from "./renderNode";

export { detectShareMode, shareBlobPromise } from "./shareBlob";
export type { ShareMode, ShareOutcome, SharePayload } from "./shareBlob";
