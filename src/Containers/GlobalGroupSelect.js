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
    const imgEl = imgRefs.current[team.teamId];
    const color = footballClubsColors[team.teamId] || "#121212";

    if (imgEl) {
      const rect = imgEl.getBoundingClientRect();
      setOverlay({
        imgSrc: team.logo,
        color,
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        phase: "start",
      });
    }

    try {
      const response = await handleAddUserToGroup({
        userData: user,
        groupId: team.teamId,
      });
      console.log(`User added to team: ${response}`);
    } catch (e) {
      console.error(e);
    } finally {
      setOverlay((o) => (o ? { ...o, phase: "exit" } : o));
      setTimeout(() => setOverlay(null), 380);
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
        Select Your Team
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
            zIndex: 1400,
            pointerEvents: "none",
            backgroundColor:
              overlay.phase === "start" || overlay.phase === "exit"
                ? "transparent"
                : overlay.color,
            transition: "background-color 260ms ease",
          }}
        >
          {/* Logo that moves to center & scales */}
          <Box
            component="img"
            src={overlay.imgSrc}
            alt="selected team"
            sx={{
              position: "absolute",
              left:
                overlay.phase === "start" ? `${overlay.rect.left}px` : "50%",
              top: overlay.phase === "start" ? `${overlay.rect.top}px` : "50%",
              width:
                overlay.phase === "start"
                  ? `${overlay.rect.width}px`
                  : "min(42vh, 42vw)",
              height:
                overlay.phase === "start" ? `${overlay.rect.height}px` : "auto",
              transform:
                overlay.phase === "start"
                  ? "translate(0, 0) scale(1)"
                  : "translate(-50%, -50%) scale(1)",
              opacity: overlay.phase === "exit" ? 0 : 1,
              objectFit: "contain",
              filter: "drop-shadow(0 16px 40px rgba(0,0,0,.55))",
              transition:
                "left 520ms cubic-bezier(.2,.8,.2,1), " +
                "top 520ms cubic-bezier(.2,.8,.2,1), " +
                "width 520ms cubic-bezier(.2,.8,.2,1), " +
                "transform 520ms cubic-bezier(.2,.8,.2,1), " +
                "opacity 260ms ease",
            }}
          />
        </Box>
      )}
    </Box>
  );
}
