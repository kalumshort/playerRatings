import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Container,
  alpha,
} from "@mui/material";
import { useAuth } from "../Providers/AuthContext";
import { handleAddUserToGroup } from "../Firebase/Auth_Functions";
import { footballClubsColours, teamList } from "../Hooks/Helper_Functions";

export default function GlobalGroupSelect() {
  const { user } = useAuth();

  const [overlay, setOverlay] = useState(null);

  useEffect(() => {
    if (overlay?.phase === "start") {
      const id = requestAnimationFrame(() =>
        setOverlay((o) => (o ? { ...o, phase: "enter" } : o))
      );
      return () => cancelAnimationFrame(id);
    }
  }, [overlay?.phase]);

  const handleTeamClick = async (team) => {
    const color = footballClubsColours[team.teamId] || "#00FF87";

    setOverlay({
      imgSrc: team.logo,
      color,
      phase: "start",
    });

    try {
      await handleAddUserToGroup({
        userData: user,
        groupId: team.teamId,
      });
    } catch (e) {
      console.error(e);
      setOverlay((o) => (o ? { ...o, phase: "exit" } : o));
      alert("Failed to join the team. Please try again.");
    } finally {
      setOverlay((o) => (o ? { ...o, phase: "exit" } : o));
      setTimeout(() => setOverlay(null), 5200);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6, position: "relative" }}>
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography
          variant="h2"
          sx={{
            mb: 1,
            fontWeight: 900,
            letterSpacing: 2,
            background: "linear-gradient(to bottom, #fff, #888)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Select Your Club
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", maxWidth: 500, mx: "auto" }}
        >
          Your selection determines your community consensus and club-specific
          content.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {teamList.map((team) => {
          const clubColor = footballClubsColours[team.teamId] || "#212121";

          return (
            <Grid item xs={4} sm={3} md={2.4} key={team.teamId}>
              <Card
                sx={{
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.03)"
                      : "rgba(255, 255, 255, 0.6)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  height: "100%",
                  position: "relative",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  overflow: "hidden",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    borderColor: alpha(clubColor, 0.5),
                    boxShadow: `0 12px 24px -10px ${alpha(clubColor, 0.4)}`,
                    "& .club-glow": { opacity: 0.6 },
                    "& .club-logo": { transform: "scale(1.1) rotate(5deg)" },
                  },
                }}
              >
                {/* Visual Accent: Bottom glow of club color */}
                <Box
                  className="club-glow"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    backgroundColor: clubColor,
                    opacity: 0.2,
                    transition: "opacity 0.3s",
                    boxShadow: `0 -10px 20px ${clubColor}`,
                  }}
                />

                <CardActionArea
                  onClick={() => handleTeamClick(team)}
                  sx={{ height: "100%", p: 3 }}
                >
                  <CardContent
                    sx={{
                      p: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={team.logo}
                      alt={team.name}
                      className="club-logo"
                      sx={{
                        width: { xs: 50, sm: 60, md: 70 },
                        height: { xs: 50, sm: 60, md: 70 },
                        objectFit: "contain",
                        filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.2))",
                        transition:
                          "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        textAlign: "center",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        color: "text.primary",
                      }}
                    >
                      {team.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* REFINED FULL-PAGE CELEBRATION */}
      {overlay && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            pointerEvents: "none",
            overflow: "hidden",
            backgroundColor:
              overlay.phase === "start"
                ? "transparent"
                : alpha(overlay.color, 0.15),
            backdropFilter: overlay.phase === "start" ? "none" : "blur(4px)",
            transition: "all 600ms ease",
          }}
        >
          {Array.from({ length: 22 }).map((_, i) => {
            const startX = Math.random() * 100;
            const delay = Math.random() * 1.2;
            const duration = 3 + Math.random() * 3;
            return (
              <Box
                key={i}
                component="img"
                src={overlay.imgSrc}
                sx={{
                  position: "absolute",
                  top: "-10vh",
                  left: `${startX}vw`,
                  width: `${24 + Math.random() * 40}px`,
                  filter: `drop-shadow(0 10px 20px ${alpha(
                    overlay.color,
                    0.4
                  )})`,
                  animation: `fall-${i} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards`,
                }}
              />
            );
          })}

          <style>
            {Array.from({ length: 22 })
              .map((_, i) => {
                const driftX = (Math.random() - 0.5) * 150;
                const rotate = (Math.random() - 0.5) * 360;
                return `
                  @keyframes fall-${i} {
                    0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translate(${driftX}px, 110vh) rotate(${rotate}deg); opacity: 0; }
                  }
                `;
              })
              .join("")}
          </style>
        </Box>
      )}
    </Container>
  );
}
