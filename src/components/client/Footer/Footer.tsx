"use client";

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
  alpha,
} from "@mui/material";
import Link from "next/link"; // Next.js Link
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";

const Footer = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Glassmorphism Style
  const glassFooterStyle = {
    marginTop: "auto",
    width: "100%",
    position: "relative",
    zIndex: 10,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid",
    borderColor: isDark ? alpha("#fff", 0.08) : alpha("#000", 0.08),
    pt: 8,
    pb: 4,
    bgcolor: alpha(theme.palette.background.default, 0.7),
  };

  const linkStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: "0.85rem",
    color: "text.secondary",
    textDecoration: "none",
    transition: "all 0.2s ease",
    "&:hover": {
      color: "primary.main",
      transform: "translateX(4px)",
    },
  };

  return (
    <Box component="footer" sx={glassFooterStyle}>
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          {/* 1. BRANDING COLUMN */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "'VT323', monospace",
                fontWeight: 700,
                color: "text.primary",
                letterSpacing: "1px",
                mb: 2,
              }}
            >
              11VOTES
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Space Mono', monospace",
                color: "text.secondary",
                maxWidth: "320px",
                mb: 3,
                lineHeight: 1.6,
              }}
            >
              The voice of the terraces. Rate players, predict matches, and
              define the consensus for your club.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <SocialButton
                icon={<TwitterIcon fontSize="small" />}
                label="Twitter"
                href="https://twitter.com"
              />
              <SocialButton
                icon={<InstagramIcon fontSize="small" />}
                label="Instagram"
                href="https://instagram.com"
              />
              <SocialButton
                icon={<YouTubeIcon fontSize="small" />}
                label="YouTube"
                href="https://youtube.com"
              />
            </Stack>
          </Grid>

          {/* 2. NAVIGATION LINKS */}
          <Grid size={{ xs: 6, md: 2 }}>
            <FooterHeader>Menu</FooterHeader>
            <Stack spacing={1.5}>
              <MuiLink component={Link} href="/" sx={linkStyle}>
                Home
              </MuiLink>
              <MuiLink component={Link} href="/profile" sx={linkStyle}>
                Profile
              </MuiLink>
            </Stack>
          </Grid>

          {/* 3. LEGAL / SUPPORT */}
          <Grid size={{ xs: 6, md: 2 }}>
            <FooterHeader>Support</FooterHeader>
            <Stack spacing={1.5}>
              <MuiLink component={Link} href="/terms" sx={linkStyle}>
                Terms of Service
              </MuiLink>
              <MuiLink component={Link} href="/privacy" sx={linkStyle}>
                Privacy Policy
              </MuiLink>
              <MuiLink component={Link} href="/contact" sx={linkStyle}>
                Contact Us
              </MuiLink>
            </Stack>
          </Grid>

          {/* 4. CALL TO ACTION (OPTIONAL) */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: "16px",
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "'VT323', monospace",
                  mb: 1,
                  color: "primary.main",
                }}
              >
                JOIN THE COMMUNITY
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                  lineHeight: 1.5,
                }}
              >
                Don&apos;t just watch the match. Be part of the result. Rate
                players in real-time.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 6, opacity: 0.5 }} />

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
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontFamily: "'Space Mono', monospace" }}
          >
            © {new Date().getFullYear()} 11VOTES. CONSENSUS ENGINE v0.8.0
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ fontStyle: "italic" }}
          >
            Made by and for Football Fans
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

// Helper Components
const FooterHeader = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="h6"
    sx={{
      fontFamily: "'VT323', monospace",
      textTransform: "uppercase",
      letterSpacing: "2px",
      mb: 3,
      color: "text.primary",
    }}
  >
    {children}
  </Typography>
);

const SocialButton = ({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <IconButton
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      sx={{
        color: "text.secondary",
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.3s ease",
        "&:hover": {
          color: "primary.main",
          borderColor: "primary.main",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          transform: "translateY(-4px)",
        },
      }}
    >
      {icon}
    </IconButton>
  );
};

export default Footer;
