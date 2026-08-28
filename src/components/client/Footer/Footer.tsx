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
import XIcon from "@mui/icons-material/X";
import InstagramIcon from "@mui/icons-material/Instagram";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import { CONTACT_EMAIL, SOCIALS } from "@/lib/config/brand";
import { openCookieSettings } from "@/lib/analytics";

/** MUI ships no TikTok glyph, so the mark is inlined rather than pulling in
 *  another icon package for a single button. */
const TikTokIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06v-3.2a5.71 5.71 0 0 0-.77-.05A5.72 5.72 0 1 0 15.54 15V8.99a7.34 7.34 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48z" />
  </SvgIcon>
);

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

            {/* In the wide branding column rather than the narrow link
                columns: the address is long enough to wrap awkwardly at
                xs=6. A plain mailto — not next/link, which is for routes. */}
            <MuiLink
              href={`mailto:${CONTACT_EMAIL}`}
              sx={{
                ...linkStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                mb: 3,
                "&:hover": { color: "primary.main" },
              }}
            >
              <MailOutlineIcon sx={{ fontSize: "1rem" }} />
              {CONTACT_EMAIL}
            </MuiLink>

            <Stack direction="row" spacing={1.5}>
              <SocialButton
                icon={<XIcon fontSize="small" />}
                label="11Votes on X"
                href={SOCIALS.x}
              />
              <SocialButton
                icon={<InstagramIcon fontSize="small" />}
                label="11Votes on Instagram"
                href={SOCIALS.instagram}
              />
              <SocialButton
                icon={<TikTokIcon fontSize="small" />}
                label="11Votes on TikTok"
                href={SOCIALS.tiktok}
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
              <MuiLink component={Link} href="/private-clubs" sx={linkStyle}>
                Private Clubs
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
              {/* Consent has to be as easy to withdraw as it was to give.
                  A button, not a link — it goes nowhere, it reopens the
                  banner — styled to sit with its neighbours. */}
              <MuiLink
                component="button"
                type="button"
                onClick={openCookieSettings}
                sx={{
                  ...linkStyle,
                  background: "none",
                  border: "none",
                  p: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Cookie Settings
              </MuiLink>
            </Stack>
          </Grid>

          {/* 4. CALL TO ACTION (OPTIONAL) */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: "10px",
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
