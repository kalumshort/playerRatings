"use client";

import React from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Link as MuiLink,
  useTheme,
  alpha,
  Stack,
} from "@mui/material";

export default function PrivacyPolicyPage() {
  const theme = useTheme() as any;

  // Custom styled components
  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <Typography
      variant="h5"
      component="h2"
      sx={{
        fontFamily: "'VT323', monospace",
        textTransform: "uppercase",
        color: "text.primary",
        mt: 5,
        mb: 2,
        letterSpacing: "1px",
        borderBottom: `2px solid ${theme.palette.primary.main}`,
        pb: 1,
        width: "fit-content",
      }}
    >
      {children}
    </Typography>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Typography
      variant="body1"
      sx={{
        fontFamily: "'Space Mono', monospace",
        color: "text.secondary",
        mb: 2.5,
        lineHeight: 1.7,
        fontSize: "0.9rem",
      }}
    >
      {children}
    </Typography>
  );

  const listTextProps = {
    primaryTypographyProps: {
      fontFamily: "'Space Mono', monospace",
      fontWeight: 800,
      fontSize: "0.95rem",
    },
    secondaryTypographyProps: {
      fontFamily: "'Space Mono', monospace",
      color: "text.secondary",
    },
  };

  return (
    <Container maxWidth="md" sx={{ py: 10 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 8 },
          ...theme.clay?.card,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Title Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontFamily: "'VT323', monospace",
              textTransform: "uppercase",
              mb: 1,
              color: "text.primary",
              fontSize: { xs: "2.5rem", md: "4rem" },
            }}
          >
            Privacy Policy
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "'Space Mono', monospace",
              color: "text.secondary",
              letterSpacing: 1,
            }}
            suppressHydrationWarning // Prevents SSR/Client date mismatch
          >
            Effective Date: {new Date().toLocaleDateString("en-GB")}
          </Typography>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* 1. Introduction */}
        <SectionHeader>1. Introduction</SectionHeader>
        <Paragraph>
          Welcome to <strong>11Votes</strong> (&quot;we,&quot; &quot;our,&quot;
          or &quot;us&quot;). Developed and operated by{" "}
          <strong>Kalum Short</strong> in the United Kingdom, we are committed
          to protecting your personal information and your right to privacy.
        </Paragraph>
        <Paragraph>
          By accessing the App, you consent to the data practices described in
          this policy, which is compliant with the UK Data Protection Act 2018
          and UK GDPR.
        </Paragraph>

        {/* 2. Information We Collect */}
        <SectionHeader>2. Data Collection</SectionHeader>
        <Paragraph>
          We collect personal information that you voluntarily provide when you
          register directly or via Google Social Auth.
        </Paragraph>

        <Stack spacing={2} sx={{ mb: 3 }}>
          <ListItem disableGutters>
            <ListItemText
              primary="Identity Data"
              secondary="Name, email address, profile picture, and Firebase User ID (UID)."
              {...listTextProps}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Interaction Data"
              secondary="Votes, player ratings, match predictions, and group memberships."
              {...listTextProps}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Technical Data"
              secondary="IP address and device information for security and analytics."
              {...listTextProps}
            />
          </ListItem>
        </Stack>

        {/* 3. Use of Data */}
        <SectionHeader>3. How We Use Data</SectionHeader>
        <Paragraph>
          We utilize Google Firebase services to process data for account
          management, calculating aggregate &quot;Fan Consensus&quot; scores,
          and preventing vote manipulation.
        </Paragraph>

        {/* 4. Advertising */}
        <SectionHeader>4. Third Parties</SectionHeader>
        <Paragraph>
          Advertisers (e.g., Google AdSense) may use cookies to provide
          interest-based advertisements. We also use{" "}
          <strong>API-Football</strong> for match data; no personal user data is
          shared with them.
        </Paragraph>

        {/* 5. User Rights */}
        <SectionHeader>5. Data Deletion</SectionHeader>
        <Paragraph>
          <strong>Account Deletion:</strong> You may request full deletion in
          Profile settings. Identity data is removed immediately. Aggregated
          historical votes are retained in anonymized format to preserve
          community consensus integrity.
        </Paragraph>

        {/* 7. Contact Info */}
        <SectionHeader>6. Contact Us</SectionHeader>
        <Box
          sx={{
            p: 4,
            borderRadius: "20px",
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            mt: 4,
          }}
        >
          <Stack spacing={1.5}>
            <Typography
              variant="body1"
              sx={{ fontFamily: "'Space Mono', monospace", fontWeight: 900 }}
            >
              Data Controller: Kalum Short
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "'Space Mono', monospace" }}
            >
              Location: United Kingdom
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: "'Space Mono', monospace" }}
            >
              Email:{" "}
              <MuiLink
                href="mailto:kalum@11votes.com"
                sx={{
                  color: "primary.main",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                kalum@11votes.com
              </MuiLink>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
