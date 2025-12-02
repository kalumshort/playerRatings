import React, { useRef, useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { useAuth } from "../Providers/AuthContext";
import { handleAddUserToGroup } from "../Firebase/Auth_Functions";
import { footballClubsColours, teamList } from "../Hooks/Helper_Functions";

export default function GlobalGroupSelect() {
  const footballClubsColors = footballClubsColours;
  const { user } = useAuth();

  const imgRefs = useRef({});
  const [overlay, setOverlay] = useState(null);
  // { imgSrc, color, rect, phase: 'start'|'enter'|'exit' }

  useEffect(() => {
    if (overlay?.phase === "start") {
      const id = requestAnimationFrame(() =>
        setOverlay((o) => (o ? { ...o, phase: "enter" } : o))
      );
      return () => cancelAnimationFrame(id);
    }
  }, [overlay?.phase]);

  const handleTeamClick = async (team) => {
    const color = footballClubsColors[team.teamId] || "#121212";

    // Start overlay
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

      // Show exit animation, but DO NOT kill the overlay instantly
      setOverlay((o) => (o ? { ...o, phase: "exit" } : o));

      alert(
        "Failed to join the team. Please try again. If the issue persists, contact support."
      );
    } finally {
      // Normal exit animation
      setOverlay((o) => (o ? { ...o, phase: "exit" } : o));

      // Remove ONLY after falling animation ends
      setTimeout(() => {
        setOverlay(null);
      }, 5200); // match the longest falling logo duration
    }
  };

  const getContrastColor = (hex) => {
    const c = hex?.startsWith("#") ? hex.substring(1) : hex || "212121";
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 140 ? "#000" : "#fff";
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, position: "relative" }}>
      <Typography
        variant="h6"
        sx={{
          mb: { xs: 1.5, sm: 2 },
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
        }}
      >
        Choose Your Club
      </Typography>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {teamList.map((team) => {
          const bg = footballClubsColors[team.teamId] || "#212121";
          const textColor = getContrastColor(bg);

          return (
            <Grid item xs={4} sm={3} md={2} lg={2} key={team.teamId}>
              <Card
                sx={{
                  backgroundColor: bg,
                  borderRadius: 2,
                  textAlign: "center",
                  height: { xs: 110, sm: 130, md: 150 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              >
                <CardActionArea
                  onClick={() => handleTeamClick(team)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 1, sm: 2 },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <Box
                      component="img"
                      src={team.logo}
                      alt={team.name}
                      ref={(el) => (imgRefs.current[team.teamId] = el)}
                      sx={{
                        width: { xs: 40, sm: 55, md: 60 },
                        height: { xs: 40, sm: 55, md: 60 },
                        objectFit: "contain",
                        mb: { xs: 0.5, sm: 1 },
                        filter: "drop-shadow(0 0 4px rgba(0,0,0,1))",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: textColor,
                        fontWeight: 600,
                        fontSize: { xs: "0.7rem", sm: "0.8rem" },
                        textShadow:
                          textColor === "#fff"
                            ? "0 1px 3px rgba(0,0,0,0.4)"
                            : "0 1px 3px rgba(255,255,255,0.5)",
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

      {/* FULL-PAGE CLUB COLOR + CENTERED LOGO */}
      {overlay && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            pointerEvents: "none",
            overflow: "hidden",
            background:
              overlay.phase === "start" ? "transparent" : `${overlay.color}40`,
            transition: "background 400ms ease",
          }}
        >
          {Array.from({ length: 18 }).map((_, i) => {
            const startX = Math.random() * 100; // 0–100 vw
            const delay = Math.random() * 0.8; // stagger
            const duration = 3.5 + Math.random() * 2.5; // 3.5–6s
            return (
              <Box
                key={i}
                component="img"
                src={overlay.imgSrc}
                alt=""
                sx={{
                  position: "absolute",
                  top: "-10vh", // just above view
                  left: `${startX}vw`,
                  width: `${28 + Math.random() * 30}px`,
                  opacity: 1,
                  filter: "drop-shadow(0 14px 30px rgba(0,0,0,.5))",
                  animation: `fall-${i} ${duration}s linear ${delay}s forwards`,
                }}
              />
            );
          })}

          {/* keyframes for the falling logos */}
          <style>
            {Array.from({ length: 18 })
              .map((_, i) => {
                const driftX = (Math.random() - 0.5) * 80; // side drift
                const rotate = (Math.random() - 0.5) * 160; // rotation
                return `
            @keyframes fall-${i} {
              0% {
                transform: translate(0, 0) rotate(0deg);
                opacity: 1;
              }
              100% {
                transform: translate(${driftX}px, 120vh) rotate(${rotate}deg);
                opacity: 0;
              }
            }
          `;
              })
              .join("")}
          </style>
        </Box>
      )}
    </Box>
  );
}
