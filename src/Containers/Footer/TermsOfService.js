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
  Link,
  useTheme,
} from "@mui/material";

const TermsOfService = () => {
  const theme = useTheme();

  // Glassified Header Helper
  const SectionHeader = ({ children }) => (
    <Typography
      variant="h5"
      component="h2"
      sx={{
        fontFamily: "'VT323', monospace",
        textTransform: "uppercase",
        color: theme.palette.text.primary,
        mt: 4,
        mb: 2,
        letterSpacing: "1px",
        borderBottom: `1px solid ${theme.palette.divider}`,
        pb: 1,
        width: "fit-content",
      }}
    >
      {children}
    </Typography>
  );

  const Paragraph = ({ children }) => (
    <Typography
      variant="body1"
      sx={{
        fontFamily: "'Space Mono', monospace",
        color: theme.palette.text.secondary,
        mb: 2,
        lineHeight: 1.6,
        fontSize: "0.95rem",
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 6 },
          // Inherits glassmorphism styles from ThemeContext automatically
        }}
      >
        {/* Title Section */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontFamily: "'VT323', monospace",
              textTransform: "uppercase",
              mb: 1,
              color: theme.palette.text.primary,
            }}
          >
            Terms of Service
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontFamily: "'Space Mono', monospace",
              color: theme.palette.text.secondary,
            }}
          >
            Effective Date: {new Date().toLocaleDateString()}
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* 1. Acceptance */}
        <SectionHeader>1. Acceptance of Terms</SectionHeader>
        <Paragraph>
          By creating an account or accessing 11Votes (the "Service"), you agree
          to be bound by these Terms. If you do not agree, you must not use the
          App. The Service is operated by Kalum Short ("we" or "us"), based in
          the United Kingdom.
        </Paragraph>

        {/* 2. NO GAMBLING (Critical for App Store) */}
        <SectionHeader>2. NO GAMBLING POLICY</SectionHeader>
        <Box
          sx={{
            p: 2,
            border: `1px solid ${theme.palette.error.main}`,
            borderRadius: "12px",
            background: `${theme.palette.error.main}10`, // 10% opacity
            mb: 2,
          }}
        >
          <Paragraph>
            <strong>IMPORTANT:</strong> 11Votes is strictly a fan engagement
            platform.
          </Paragraph>
          <Paragraph>
            We do <strong>NOT</strong> offer real-money gambling, betting, or
            wagering services. Any points, scores, or "predictions" within the
            App are virtual, have no monetary value, and cannot be cashed out,
            sold, or exchanged for real currency.
          </Paragraph>
        </Box>

        {/* 3. User Conduct & Bans */}
        <SectionHeader>3. User Conduct & Termination</SectionHeader>
        <Paragraph>
          You agree to use the Service respectfully. You are strictly prohibited
          from:
        </Paragraph>
        <List
          sx={{
            listStyleType: "disc",
            pl: 4,
            mb: 2,
            fontFamily: "'Space Mono', monospace",
            color: theme.palette.text.secondary,
          }}
        >
          <ListItem sx={{ display: "list-item" }}>
            <ListItemText
              primary="Harassing, abusing, or threatening other users in Group Chats."
              primaryTypographyProps={{ fontFamily: "'Space Mono', monospace" }}
            />
          </ListItem>
          <ListItem sx={{ display: "list-item" }}>
            <ListItemText
              primary="Using automated scripts or bots to manipulate voting data."
              primaryTypographyProps={{ fontFamily: "'Space Mono', monospace" }}
            />
          </ListItem>
          <ListItem sx={{ display: "list-item" }}>
            <ListItemText
              primary="Posting hate speech, discriminatory content, or illegal material."
              primaryTypographyProps={{ fontFamily: "'Space Mono', monospace" }}
            />
          </ListItem>
        </List>
        <Paragraph>
          <strong>Termination Rights:</strong> We reserve the right to suspend
          or ban your account <strong>immediately and without notice</strong> if
          you violate these rules.
        </Paragraph>

        {/* 4. Content Ownership */}
        <SectionHeader>4. User Content License</SectionHeader>
        <Paragraph>
          <strong>Your Content:</strong> You retain ownership of the text,
          ratings, and predictions you submit.
        </Paragraph>
        <Paragraph>
          <strong>Our License:</strong> By submitting content to 11Votes, you
          grant us a worldwide, non-exclusive, royalty-free license to use,
          display, reproduce, and aggregate your content (e.g., to calculate
          "Fan Consensus" ratings or for marketing purposes such as "See how
          fans rated this player").
        </Paragraph>

        {/* 5. Data Accuracy */}
        <SectionHeader>5. Data Accuracy Disclaimer</SectionHeader>
        <Paragraph>
          Match scores, fixtures, and player statistics are provided by
          third-party data feeds (e.g., API-Football). While we strive for
          accuracy, we cannot guarantee that live data is error-free or
          instantaneous. 11Votes is not responsible for any inaccuracies in
          match data.
        </Paragraph>

        {/* 6. Liability */}
        <SectionHeader>6. Limitation of Liability</SectionHeader>
        <Paragraph>
          To the maximum extent permitted by applicable law, 11Votes shall not
          be liable for any indirect, incidental, or consequential damages
          arising from your use of the Service. The Service is provided "AS IS"
          without warranties of any kind.
        </Paragraph>

        {/* 7. Changes to Terms */}
        <SectionHeader>7. Changes to Terms</SectionHeader>
        <Paragraph>
          We reserve the right to modify these Terms at any time. We will notify
          users of significant changes. Continued use of the Service after
          changes constitutes acceptance of the new Terms.
        </Paragraph>

        {/* 8. Governing Law */}
        <SectionHeader>8. Governing Law</SectionHeader>
        <Box
          sx={{
            p: 3,
            borderRadius: "16px",
            border: `1px solid ${theme.palette.divider}`,
            background:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.03)",
            mt: 2,
          }}
        >
          <Paragraph>
            These Terms shall be governed by and construed in accordance with
            the laws of <strong>England and Wales</strong>. Any disputes arising
            under these Terms shall be subject to the exclusive jurisdiction of
            the courts of England and Wales.
          </Paragraph>
          <Typography
            variant="body2"
            sx={{ fontFamily: "'Space Mono', monospace", mt: 2 }}
          >
            <strong>Contact:</strong>{" "}
            <Link
              href="mailto:kalum@11votes.com"
              sx={{ color: theme.palette.primary.main }}
            >
              kalum@11votes.com
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfService;
