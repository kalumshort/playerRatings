import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { styled } from "@mui/system";
import { Link } from "react-router-dom";
import whiteLogo from "../assets/logo/11votes-nobg-clear-white.png";

const HeroSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: theme.spacing(4),
}));

const Logo = styled("img")({
  height: "120px",
  marginBottom: "20px",
});

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: "20px 40px",
  fontSize: "1rem",
}));

export default function HomePage() {
  return (
    <HeroSection>
      <Container maxWidth="sm">
        <Logo src={whiteLogo} alt="11Votes Logo" />
        <Typography variant="h3" gutterBottom>
          Welcome to 11Votes
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          Join the community. Vote, rate, and choose your favorite football
          lineups.
        </Typography>
        <Link to="" style={{ textDecoration: "none" }}>
          <StyledButton variant="contained" color="secondary">
            Coming Soon
          </StyledButton>
        </Link>
      </Container>
    </HeroSection>
  );
}
