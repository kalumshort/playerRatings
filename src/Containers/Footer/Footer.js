import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  Link as MuiLink,
  Stack,
  Divider,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";

const Footer = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Glassmorphism Style for the Footer
  const glassFooterStyle = {
    marginTop: "auto",
    width: "100%",
    position: "relative",
    zIndex: 10,

    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid",
    borderColor: isDark
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(255, 255, 255, 0.4)",
    pt: 6,
    pb: 4,
  };

  const linkStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
    textDecoration: "none",
    transition: "color 0.2s ease",
    "&:hover": {
      color: theme.palette.primary.main,
      cursor: "pointer",
    },
  };

  return (
    <Box component="footer" sx={glassFooterStyle}>
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          {/* 1. BRANDING COLUMN */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'VT323', monospace",
                fontWeight: 700,
                color: theme.palette.text.primary,
                letterSpacing: "1px",
                mb: 1,
              }}
            >
              11VOTES
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Space Mono', monospace",
                color: theme.palette.text.secondary,
                maxWidth: "300px",
                mb: 2,
              }}
            >
              The voice of the terraces. Rate players, predict matches, and
              define the consensus for your club.
            </Typography>
            <Stack direction="row" spacing={1}>
              <SocialButton icon={<TwitterIcon />} label="Twitter" />
              <SocialButton icon={<InstagramIcon />} label="Instagram" />
              <SocialButton icon={<YouTubeIcon />} label="YouTube" />
            </Stack>
          </Grid>

          {/* 2. NAVIGATION LINKS */}
          <Grid item xs={6} md={2}>
            <FooterHeader>Menu</FooterHeader>
            <Stack spacing={1.5}>
              <MuiLink component={RouterLink} to="/" sx={linkStyle}>
                Home
              </MuiLink>
              <MuiLink component={RouterLink} to="/profile" sx={linkStyle}>
                Profile
              </MuiLink>
            </Stack>
          </Grid>

          {/* 3. LEGAL / SUPPORT */}
          <Grid item xs={6} md={2}>
            <FooterHeader>Support</FooterHeader>
            <Stack spacing={1.5}>
              <MuiLink href="/terms-of-service" sx={linkStyle}>
                Terms of Service
              </MuiLink>
              <MuiLink href="/privacy-policy" sx={linkStyle}>
                Privacy Policy
              </MuiLink>
              <MuiLink href="/contact" sx={linkStyle}>
                Contact Us
              </MuiLink>
            </Stack>
          </Grid>

          {/* 4. NEWSLETTER / CALL TO ACTION */}
          {/* <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                borderRadius: "16px",
                background: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.03)",
                border: "1px solid",
                borderColor: theme.palette.divider,
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "'VT323', monospace", mb: 1 }}
              >
                JOIN THE COMMUNITY
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", mb: 2, color: "text.secondary" }}
              >
                Don't just watch the match. Be part of the result.
              </Typography>
            </Box>
          </Grid> */}
        </Grid>

        <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

        {/* COPYRIGHT */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} 11Votes. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.disabled">
            v0.8.0 • Made by and for Football Fans
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

// Helper Components for cleaner JSX
const FooterHeader = ({ children }) => (
  <Typography
    variant="h6"
    sx={{
      fontFamily: "'VT323', monospace",
      textTransform: "uppercase",
      letterSpacing: "1px",
      mb: 2,
      color: "text.primary",
    }}
  >
    {children}
  </Typography>
);

const SocialButton = ({ icon, label }) => {
  const theme = useTheme();
  return (
    <IconButton
      aria-label={label}
      size="small"
      sx={{
        color: theme.palette.text.secondary,
        border: `1px solid ${theme.palette.divider}`,
        "&:hover": {
          color: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          background: `${theme.palette.primary.main}10`, // 10% opacity hex
        },
      }}
    >
      {icon}
    </IconButton>
  );
};

export default Footer;
