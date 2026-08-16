// src/components/ui/NavigationLoader.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, useTheme } from "@mui/material";

/**
 * Top progress bar for route transitions.
 *
 * The previous version ran its effect on [pathname, searchParams], which only
 * fire once navigation has already committed — so the bar appeared *after* the
 * wait it was meant to cover, then hid on a fixed 300ms timer while its
 * animation was configured for a 10s sweep.
 *
 * Instead we intercept clicks on internal links during the capture phase, which
 * happens before Next starts the transition, and clear on the route change that
 * signals completion.
 */
export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const [isNavigating, setIsNavigating] = useState(false);

  // The route we were on when navigation began, so a same-page click (or a
  // cancelled navigation) doesn't leave the bar stuck on screen.
  const startedAtRef = useRef<string | null>(null);

  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      // Ignore modified clicks — the browser handles those itself.
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      // Same URL: nothing will change, so no transition to report.
      const next = `${url.pathname}${url.search}`;
      const current = `${window.location.pathname}${window.location.search}`;
      if (next === current) return;

      startedAtRef.current = current;
      setIsNavigating(true);
    };

    document.addEventListener("click", onClickCapture, { capture: true });
    return () =>
      document.removeEventListener("click", onClickCapture, { capture: true });
  }, []);

  // The route actually changed — the navigation we were tracking is done.
  useEffect(() => {
    setIsNavigating(false);
    startedAtRef.current = null;
  }, [pathname, searchParams]);

  // Safety valve: never leave the bar up forever if a navigation is abandoned.
  useEffect(() => {
    if (!isNavigating) return;
    const timeout = setTimeout(() => setIsNavigating(false), 10000);
    return () => clearTimeout(timeout);
  }, [isNavigating]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              zIndex: 9999,
              background: theme.palette.primary.main,
              boxShadow: `0 0 10px ${theme.palette.primary.main}`,
            }}
            component={motion.div}
            initial={{ width: "0%" }}
            animate={{
              // Ease out towards (never reaching) the end, so a slow route
              // still looks like it's making progress.
              width: "90%",
              transition: { duration: 8, ease: "easeOut" },
            }}
            exit={{ width: "100%", transition: { duration: 0.2 } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
