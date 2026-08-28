"use client";

import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";

interface PageSkeletonProps {
  /** How many card rows to sketch out below the header block. */
  rows?: number;
  /** Sketch a wide hero/banner block first (club and fixture pages). */
  hero?: boolean;
}

/**
 * In-place loading placeholder for route-level loading.tsx files.
 *
 * Deliberately not <Spinner />: that one is position:fixed / 100vh / z-9999 and
 * blanks the whole app including the header, which makes an ordinary
 * navigation look like a crash.
 */
export default function PageSkeleton({
  rows = 3,
  hero = true,
}: PageSkeletonProps) {
  return (
    <Box
      sx={{ width: "100%", px: { xs: 2, md: 3 }, py: 3 }}
      aria-busy="true"
      aria-live="polite"
    >
      <Box sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Loading
      </Box>

      {hero && (
        <Skeleton
          variant="rounded"
          height={140}
          sx={{ borderRadius: "12px", mb: 3 }}
        />
      )}

      <Stack spacing={2}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={96}
            sx={{ borderRadius: "12px" }}
          />
        ))}
      </Stack>
    </Box>
  );
}
