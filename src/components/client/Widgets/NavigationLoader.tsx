// src/components/ui/NavigationLoader.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, useTheme } from "@mui/material";

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Navigation started
    setIsNavigating(true);

    // Navigation finished when pathname or params change
    const timeout = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

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
              width: "70%",
              transition: { duration: 10, ease: "easeOut" },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
