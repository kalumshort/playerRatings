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
} from "@mui/material";

export default function TermsOfServicePage() {
  const theme = useTheme() as any;

  // Custom styled components for a terminal/tactical feel
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
            Terms of Service
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "'Space Mono', monospace",
              color: "text.secondary",
              letterSpacing: 1,
            }}
            suppressHydrationWarning
          >
            Effective Date: {new Date().toLocaleDateString("en-GB")}
          </Typography>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* 1. Acceptance */}
        <SectionHeader>1. Acceptance of Terms</SectionHeader>
        <Paragraph>
          By creating an account or accessing 11Votes (the &quot;Service&quot;),
          you agree to be bound by these Terms. If you do not agree, you must
          not use the App. The Service is operated by{" "}
          <strong>Kalum Short</strong>, based in the United Kingdom.
        </Paragraph>

        {/* 2. NO GAMBLING POLICY */}
        <SectionHeader>2. NO GAMBLING POLICY</SectionHeader>
        <Box
          sx={{
            p: 3,
            border: `2px solid ${theme.palette.error.main}`,
            borderRadius: "16px",
            bgcolor: alpha(theme.palette.error.main, 0.05),
            mb: 4,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "'Space Mono', monospace",
              fontWeight: 900,
              color: "error.main",
              mb: 1,
            }}
          >
            ⚠️ CRITICAL ENGAGEMENT POLICY
          </Typography>
          <Paragraph>
            11Votes is strictly a fan engagement platform. We do{" "}
            <strong>NOT</strong> offer real-money gambling, betting, or
            wagering.
          </Paragraph>
          <Paragraph>
            Any virtual points, leaderboard rankings, or match predictions have
            no monetary value and cannot be exchanged for real currency or
            goods.
          </Paragraph>
        </Box>

        {/* 3. User Conduct */}
        <SectionHeader>3. User Conduct & Bans</SectionHeader>
        <Paragraph>
          The &quot;Voice of the Terraces&quot; must remain respectful. You are
          strictly prohibited from:
        </Paragraph>
        <List sx={{ mb: 3 }}>
          {[
            "Harassing, abusing, or threatening other users.",
            "Using bots or automated scripts to manipulate voting data.",
            "Posting discriminatory content or hate speech.",
          ].map((text, i) => (
            <ListItem key={i} disableGutters sx={{ alignItems: "flex-start" }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Space Mono', monospace",
                  mr: 2,
                  color: "primary.main",
                  fontWeight: 900,
                }}
              >
                [0{i + 1}]
              </Typography>
              <ListItemText
                primary={text}
                primaryTypographyProps={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.85rem",
                  color: "text.secondary",
                }}
              />
            </ListItem>
          ))}
        </List>
        <Paragraph>
          <strong>Termination:</strong> We reserve the right to ban accounts
          immediately for violations of these conduct standards.
        </Paragraph>

        {/* 4. Content Ownership */}
        <SectionHeader>4. User Content License</SectionHeader>
        <Paragraph>
          You retain ownership of your ratings and predictions. However, by
          submitting content, you grant 11Votes a worldwide license to display
          and aggregate this data to calculate the &quot;Fan Consensus.&quot;
        </Paragraph>

        {/* 5. Data Accuracy */}
        <SectionHeader>5. Data Accuracy Disclaimer</SectionHeader>
        <Paragraph>
          Match scores and player stats are provided by third-party feeds
          (API-Football). While we strive for accuracy, 11Votes is not
          responsible for errors or delays in live match data.
        </Paragraph>

        {/* 6. Liability */}
        <SectionHeader>6. Limitation of Liability</SectionHeader>
        <Paragraph>
          11Votes is provided &quot;AS IS.&quot; To the extent permitted by law,
          we shall not be liable for any incidental or consequential damages
          arising from your use of the Service.
        </Paragraph>

        {/* 8. Governing Law */}
        <SectionHeader>7. Governing Law</SectionHeader>
        <Box
          sx={{
            p: 4,
            borderRadius: "20px",
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, 0.4),
            mt: 4,
          }}
        >
          <Paragraph>
            These Terms are governed by the laws of{" "}
            <strong>England and Wales</strong>. Disputes are subject to the
            exclusive jurisdiction of the courts of England and Wales.
          </Paragraph>
          <Typography
            variant="body2"
            sx={{ fontFamily: "'Space Mono', monospace", mt: 2 }}
          >
            <strong>Contact:</strong>{" "}
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
        </Box>
      </Paper>
    </Container>
  );
}
