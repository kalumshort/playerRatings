"use client";

import React, { useState, useTransition } from "react";
import {
  Box,
  Typography,
  Avatar,
  Dialog,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  ButtonBase,
  Tab,
  Tabs,
  Button,
  Divider,
  Paper,
  Chip,
  Fade,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  CheckCircle2,
  X,
  Trophy,
  ArrowLeftRight,
  Lock,
  CalendarClock,
} from "lucide-react";
import { differenceInDays, addDays, formatDistanceToNow } from "date-fns";

// The new modular function trigger
import {
  updateLeagueTeam,
  updateUserField,
} from "@/lib/firebase/client-user-actions";
import { teamList } from "@/lib/utils/teamList";
import useGroupData from "@/Hooks/useGroupData";

export default function StadiumSwitcher({
  open,
  onClose,
  groups,
  userData,
  leagueKey = "premier-league",
}: any) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isChangingTeam, setIsChangingTeam] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { groupData } = useGroupData();

  const leagueDisplayName = leagueKey.replace("-", " ").toUpperCase();
  const currentClubId = userData?.leagueTeams?.[leagueKey];
  const currentClub: any = groupData?.[currentClubId];

  // Cooldown Logic (30-day rule)
  const lastTransfer = userData?.lastTransferDates?.[leagueKey]?.toDate();
  const nextAvailableDate = lastTransfer ? addDays(lastTransfer, 30) : null;
  const canTransfer =
    !lastTransfer || differenceInDays(new Date(), lastTransfer) >= 30;

  const transferMarket = teamList.filter(
    (team) =>
      team.name.toLowerCase().includes(search.toLowerCase()) &&
      String(team.teamId) !== String(currentClubId),
  );

  const privateCommunities = Object.values(groups || {}).filter(
    (g: any) =>
      g.visibility === "private" && userData?.groups?.includes(g.groupId),
  );

  /**
   * Refactored to use the Transfer Coordinator logic
   */
  const handleTransfer = (newTeamId: number) => {
    if (isPending) return;

    startTransition(async () => {
      // This now calls the 'transferLeagueTeam' Cloud Function
      const result = await updateLeagueTeam({
        userData,
        groupId: String(newTeamId),
        leagueKey,
      });

      if (result.success) {
        // Transfer was successful!
        onClose();
      } else {
        // Show error to user
        alert(result.message);
      }
    });
  };

  const handleActiveGroupChange = async (newGroupId: string) => {
    if (!newGroupId) {
      return;
    }
    await updateUserField(userData?.uid, "activeGroup", newGroupId);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: "24px", bgcolor: "background.default" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            STADIUM HUB
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, color: "primary.main" }}
          >
            {leagueDisplayName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isPending}>
          <X />
        </IconButton>
      </Box>

      {/* Navigation */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          icon={<Trophy size={18} />}
          label="My Club"
          iconPosition="start"
          disabled={isPending}
        />
        <Tab
          icon={<Lock size={18} />}
          label="Communities"
          iconPosition="start"
          disabled={isPending}
        />
      </Tabs>

      <Box sx={{ p: 3, minHeight: 400, position: "relative" }}>
        {/* Loading Overlay for the Transfer process */}
        {isPending && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              bgcolor: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "inherit",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {activeTab === 0 && (
          <Box>
            {!isChangingTeam ? (
              <Fade in={true}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      mb: 1,
                      display: "block",
                      fontWeight: 800,
                      color: "text.secondary",
                    }}
                  >
                    CURRENT REGISTRATION
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderRadius: "20px",
                      textAlign: "center",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Avatar
                      src={currentClub?.logo}
                      sx={{
                        width: 100,
                        height: 100,
                        mx: "auto",
                        mb: 2,
                        borderRadius: 0,
                        objectFit: "contain",
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {currentClub?.name || "Unattached"}
                    </Typography>

                    <Box sx={{ mt: 3 }}>
                      {!canTransfer && nextAvailableDate ? (
                        <Chip
                          icon={<CalendarClock size={14} />}
                          label={`Window opens in ${formatDistanceToNow(nextAvailableDate)}`}
                          color="warning"
                          variant="outlined"
                          sx={{ fontWeight: 700 }}
                        />
                      ) : (
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<ArrowLeftRight size={18} />}
                          onClick={() => setIsChangingTeam(true)}
                          sx={{ borderRadius: "12px", fontWeight: 800 }}
                        >
                          Transfer Club
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Fade>
            ) : (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <IconButton
                    onClick={() => setIsChangingTeam(false)}
                    sx={{ mr: 1 }}
                  >
                    <ArrowLeftRight size={18} />
                  </IconButton>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Transfer Market
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  placeholder="Find your new team..."
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={1}>
                  {transferMarket.map((team) => (
                    <Grid size={{ xs: 4, sm: 3 }} key={team.teamId}>
                      <ButtonBase
                        onClick={() => handleTransfer(team.teamId)}
                        sx={{
                          width: "100%",
                          p: 1,
                          borderRadius: "12px",
                          border: "1px solid",
                          borderColor: "divider",
                          flexDirection: "column",
                          gap: 1,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <Avatar
                          src={team.logo}
                          sx={{ width: 40, height: 40, borderRadius: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            textAlign: "center",
                          }}
                        >
                          {team.name}
                        </Typography>
                      </ButtonBase>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 1: Communities */}
        {activeTab === 1 && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                mb: 2,
                display: "block",
                fontWeight: 800,
                color: "text.secondary",
              }}
            >
              PRIVATE COMMUNITIES
            </Typography>
            <Grid container spacing={2}>
              {privateCommunities.map((group: any) => (
                <Grid size={{ xs: 12 }} key={group.groupId}>
                  <ButtonBase
                    sx={{
                      width: "100%",
                      p: 2,
                      borderRadius: "16px",
                      border: "1px solid",
                      borderColor: "divider",
                      justifyContent: "flex-start",
                      gap: 2,
                    }}
                    onClick={() => handleActiveGroupChange(group.groupId)}
                  >
                    <Avatar
                      src={group.logo?.replace(/"/g, "")}
                      sx={{ width: 40, height: 40 }}
                    />
                    <Typography sx={{ fontWeight: 700 }}>
                      {group.name}
                    </Typography>
                  </ButtonBase>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
