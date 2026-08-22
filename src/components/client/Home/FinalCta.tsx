"use client";

import { Box, Button, Container, Stack, Typography, alpha, useTheme } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";

export default function FinalCta({
  onSignUp,
  onBrowse,
}: {
  onSignUp: () => void;
  onBrowse: () => void;
}) {
  const theme = useTheme() as any;

  return (
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        <Stack spacing={3} alignItems="center">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: "2.25rem", md: "3rem" },
              letterSpacing: -1,
              lineHeight: 1.05,
            }}
          >
            Your voice. Your XI. Your verdict.
          </Typography>

          <Button
            onClick={onSignUp}
            size="large"
            sx={{
              ...theme.clay?.button,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              px: 5,
              py: 1.75,
              fontSize: "1.1rem",
              fontWeight: 900,
            }}
            endIcon={<ArrowForward />}
          >
            Create your account
          </Button>

          <Box
            component="button"
            onClick={onBrowse}
            sx={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "0.95rem",
              textDecoration: "underline",
              p: 0,
              "&:hover": { color: "primary.main" },
            }}
          >
            or browse clubs first →
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
