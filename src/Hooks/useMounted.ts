"use client";

import { useEffect, useState } from "react";

/**
 * False on the server and during the first client render, true afterwards.
 *
 * Use it to gate anything that reads the clock or `window`, so the SSR HTML and
 * the hydrating render agree. The alternative — sprinkling
 * `suppressHydrationWarning` — silences the warning without fixing the mismatch.
 */
export default function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
