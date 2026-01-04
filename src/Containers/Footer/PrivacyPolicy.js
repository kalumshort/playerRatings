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

const PrivacyPolicy = () => {
  const theme = useTheme();

  // Custom styled components for consistency
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
          // This inherits the glassmorphism styles from your ThemeContext
        }}
      >
        {/* Title Header */}
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
            Privacy Policy
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

        {/* 1. Introduction */}
        <SectionHeader>1. Introduction</SectionHeader>
        <Paragraph>
          Welcome to 11Votes ("we," "our," or "us"). This application is
          currently developed and operated by <strong>Kalum Short</strong>,
          based in the United Kingdom.
        </Paragraph>
        <Paragraph>
          We are committed to protecting your personal information and your
          right to privacy. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our web
          application. By accessing the App, you consent to the data practices
          described in this policy, which is compliant with the UK Data
          Protection Act 2018 and UK GDPR.
        </Paragraph>

        {/* 2. Information We Collect */}
        <SectionHeader>2. Data Collection</SectionHeader>
        <Paragraph>
          We collect personal information that you voluntarily provide to us
          when you register directly or via a social provider (Google).
        </Paragraph>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText
              primary="Identity Data"
              secondary="Name, email address, profile picture, and User ID (UID)."
              primaryTypographyProps={{
                fontFamily: "'Space Mono', monospace",
                fontWeight: "bold",
              }}
              secondaryTypographyProps={{
                fontFamily: "'Space Mono', monospace",
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Interaction Data"
              secondary="Your votes, player ratings, match predictions, and group memberships."
              primaryTypographyProps={{
                fontFamily: "'Space Mono', monospace",
                fontWeight: "bold",
              }}
              secondaryTypographyProps={{
                fontFamily: "'Space Mono', monospace",
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Technical Data"
              secondary="IP address, browser type, and device information collected automatically for security and analytics."
              primaryTypographyProps={{
                fontFamily: "'Space Mono', monospace",
                fontWeight: "bold",
              }}
              secondaryTypographyProps={{
                fontFamily: "'Space Mono', monospace",
              }}
            />
          </ListItem>
        </List>

        {/* 3. Use of Data */}
        <SectionHeader>3. How We Use Data</SectionHeader>
        <Paragraph>
          We utilize Google Firebase services (Firestore, Authentication, Cloud
          Functions) to process your data for the following purposes:
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
              primary="To manage your account registration and authentication."
              primaryTypographyProps={{ fontFamily: "'Space Mono', monospace" }}
            />
          </ListItem>
          <ListItem sx={{ display: "list-item" }}>
            <ListItemText
              primary="To calculate aggregate 'Fan Consensus' scores (e.g., Average Player Ratings)."
              primaryTypographyProps={{ fontFamily: "'Space Mono', monospace" }}
            />
          </ListItem>
          <ListItem sx={{ display: "list-item" }}>
            <ListItemText
              primary="To maintain the security and integrity of the App (preventing vote manipulation)."
              primaryTypographyProps={{ fontFamily: "'Space Mono', monospace" }}
            />
          </ListItem>
        </List>

        {/* 4. Advertising & Third Parties */}
        <SectionHeader>4. Advertising & Third Parties</SectionHeader>
        <Paragraph>
          We may feature advertising within the App. Advertisers (such as Google
          AdSense) may use cookies and web beacons to collect data about your
          visits to this and other websites in order to provide advertisements
          about goods and services of interest to you.
        </Paragraph>
        <Paragraph>
          We also use <strong>API-Football</strong> to provide real-time sports
          data. No personal user data is shared with API-Football; we only
          retrieve public match data from them.
        </Paragraph>

        {/* 5. User Rights & Deletion */}
        <SectionHeader>5. Your Rights (Deletion)</SectionHeader>
        <Paragraph>
          Under UK GDPR, you have the right to access, correct, or delete your
          personal data.
        </Paragraph>
        <Paragraph>
          <strong>Account Deletion:</strong> You may request the full deletion
          of your account and personal data at any time via the specific
          function in your Profile settings or by contacting us. Upon deletion,
          your personal identity (name, email) is removed from our systems. Your
          past historical votes (e.g., a rating given to a player in a past
          season) may be retained in an anonymized, aggregated format to
          preserve the integrity of the community consensus history.
        </Paragraph>

        {/* 6. Children's Privacy */}
        <SectionHeader>6. Children's Privacy</SectionHeader>
        <Paragraph>
          While our App does not have a strict age restriction, we do not
          knowingly solicit data from or market to children under the age of 13.
          If you become aware of any data we have collected from children under
          age 13, please contact us immediately.
        </Paragraph>

        {/* 7. Contact Info */}
        <SectionHeader>7. Contact Us</SectionHeader>
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
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Space Mono', monospace",
              fontWeight: "bold",
              mb: 1,
            }}
          >
            Data Controller: Kalum Short
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: "'Space Mono', monospace", mb: 1 }}
          >
            Location: United Kingdom
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: "'Space Mono', monospace" }}
          >
            Email:{" "}
            <Link
              href="mailto:kalum@11votes.com"
              sx={{ color: theme.palette.primary.main, fontWeight: "bold" }}
            >
              kalum@11votes.com
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
