"use client";

import React, { useState } from "react";
import {
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Container,
  alpha,
  useTheme,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { motion } from "framer-motion";

// CUSTOM HOOKS & DATA
import { useAuth } from "@/context/AuthContext";
import { teamList } from "@/lib/utils/teamList";
import { handleAddUserToGroup } from "@/lib/firebase/client-actions";
import { Spinner } from "@/components/ui/Spinner"; // Using your existing Spinner

export default function ClubSelectionPage() {
  const { user } = useAuth();
  const theme = useTheme() as any;

  // States
  const [loadingTeam, setLoadingTeam] = useState<any | null>(null);
  const [pendingTeam, setPendingTeam] = useState<any | null>(null);

  const handleTeamClick = (team: any) => {
    if (loadingTeam) return;
    setPendingTeam(team);
  };

  const confirmSelection = async () => {
    if (!pendingTeam) return;

    const team = pendingTeam;
    setPendingTeam(null);
    setLoadingTeam(team); // Now we track the whole team object for the spinner

    try {
      await handleAddUserToGroup({
        userData: user,
        groupId: team.teamId,
        leagueKey: "premier-league",
      });
      // Redirect handled by RootPage/Server logic
    } catch (e) {
      console.error(e);
      setLoadingTeam(null);
      alert("Failed to join the team. Please try again.");
    }
  };

  // 1. FULL SCREEN LOADING STATE (Personalized)
  if (loadingTeam) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Spinner
          text={`Joining the ${loadingTeam.name} community...`}
          // If your spinner supports a color prop, you could pass: color={loadingTeam.accent}
        />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, minHeight: "100vh" }}>
      {/* HEADER SECTION */}
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <Typography
          variant="h2"
          sx={{
            mb: 2,
            fontWeight: 900,
            fontSize: { xs: "2.5rem", md: "4rem" },
            textTransform: "uppercase",
            letterSpacing: -1,
            fontFamily: "var(--font-outfit)",
          }}
        >
          Pick Your Club
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontFamily: "var(--font-jakarta)",
            color: "text.secondary",
            maxWidth: 600,
            mx: "auto",
            mb: 2,
          }}
        >
          Establish your allegiance. This determines your community consensus
          and voting power.
        </Typography>

        <Box
          sx={{
            display: "inline-block",
            px: 2,
            py: 0.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: "var(--font-space-mono)",
              color: theme.palette.warning.main,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            ⚠️ Note: You can only follow one public team at a time.
          </Typography>
        </Box>
      </Box>

      {/* CLUB GRID */}
      <Grid container spacing={2.5} justifyContent="center">
        {teamList.map((team) => {
          const clubColor = team.accent || "#212121";

          return (
            <Grid key={team.teamId} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
              <Card
                component={motion.div}
                whileHover={{ y: -5 }}
                sx={{
                  bgcolor: alpha(theme.palette.background.paper, 0.4),
                  height: "100%",
                  position: "relative",
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,

                  overflow: "hidden",
                }}
              >
                <CardActionArea
                  onClick={() => handleTeamClick(team)}
                  sx={{ height: "100%", p: 3 }}
                >
                  <CardContent sx={{ p: 0, textAlign: "center" }}>
                    <Box
                      component="img"
                      src={team.logo}
                      alt={team.name}
                      sx={{
                        width: 80,
                        height: 80,
                        mb: 2,
                        objectFit: "contain",
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: "var(--font-jakarta)",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "text.primary",
                      }}
                    >
                      {team.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    height: "4px",
                    bgcolor: clubColor,
                  }}
                />
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* CONFIRMATION DIALOG */}
      <Dialog
        open={Boolean(pendingTeam)}
        onClose={() => setPendingTeam(null)}
        PaperProps={{
          sx: {
            p: 2,
            maxWidth: 400,
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", pt: 4 }}>
          {pendingTeam && (
            <Box
              component="img"
              src={pendingTeam.logo}
              sx={{ width: 80, height: 80, mb: 2, objectFit: "contain" }}
            />
          )}
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, mb: 1, fontFamily: "var(--font-outfit)" }}
          >
            Confirm Team?
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontFamily: "var(--font-jakarta)" }}
          >
            You are joining <strong>{pendingTeam?.name}</strong>. Your community
            consensus will be tied to this club.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 4, gap: 2 }}>
          <Button
            onClick={() => setPendingTeam(null)}
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmSelection}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
