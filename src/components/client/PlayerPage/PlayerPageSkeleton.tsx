"use client";

import React from "react";
import {
  Box,
  Grid,
  Stack,
  Skeleton,
  Paper,
  useTheme,
  Divider,
} from "@mui/material";

export default function PlayerPageSkeleton() {
  const theme = useTheme() as any;

  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        pb: 10,
        px: { xs: 2, md: 4 },
        pt: 2,
      }}
    >
      <Grid container spacing={4}>
        {/* LEFT COLUMN: PROFILE CARD SKELETON */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Paper
            elevation={0}
            sx={{
              ...theme.clay?.card,
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Avatar Circle */}
            <Skeleton
              variant="circular"
              width={140}
              height={140}
              sx={{ mb: 2 }}
            />

            {/* Name and Chips */}
            <Skeleton variant="text" width="80%" height={32} />
            <Stack direction="row" spacing={1} my={2}>
              <Skeleton
                variant="rounded"
                width={80}
                height={24}
                sx={{ borderRadius: "12px" }}
              />
              <Skeleton
                variant="rounded"
                width={40}
                height={24}
                sx={{ borderRadius: "12px" }}
              />
            </Stack>

            <Divider sx={{ my: 2, width: "100%" }} />

            {/* Season Rating Block */}
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="60%" height={80} />
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: CONTENT STREAM SKELETON */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
          <Stack spacing={4}>
            {/* Graph Section */}
            <Box>
              <Skeleton
                variant="text"
                width="150px"
                height={30}
                sx={{ mb: 2, ml: 1 }}
              />
              <Paper sx={{ ...theme.clay?.card, p: 3, height: 350 }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height="100%"
                  sx={{ borderRadius: 2 }}
                />
              </Paper>
            </Box>

            {/* Match History Section */}
            <Box>
              <Skeleton
                variant="text"
                width="180px"
                height={30}
                sx={{ mb: 2, ml: 1 }}
              />
              <Stack spacing={1.5}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Paper
                    key={i}
                    sx={{
                      ...theme.clay?.card,
                      display: "flex",
                      alignItems: "center",
                      p: 2,
                      borderLeft: "6px solid #e0e0e0",
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      width={40}
                      height={40}
                      sx={{ mr: 2, borderRadius: 1 }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="30%" height={20} />
                      <Skeleton variant="text" width="15%" height={16} />
                    </Box>
                    <Skeleton
                      variant="rounded"
                      width={50}
                      height={35}
                      sx={{ borderRadius: 2 }}
                    />
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
