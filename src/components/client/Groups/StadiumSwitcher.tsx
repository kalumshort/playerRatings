"use client";

import React, { useState, useTransition, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Dialog,
  IconButton,
  TextField,
  Grid,
  ButtonBase,
  Tab,
  Tabs,
  Button,
  Paper,
  Chip,
  Fade,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  Search,
  CheckCircle2,
  X,
  Trophy,
  ArrowLeftRight,
  Eye,
  Lock,
  CalendarClock,
  Plus,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { differenceInDays, addDays, formatDistanceToNow } from "date-fns";

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
}: any) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [transferLeagueKey, setTransferLeagueKey] = useState<string | null>(
    null,
  );
  const [pendingSelection, setPendingSelection] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();
  const { groupData } = useGroupData();

  // Unified Styling Helper
  const sharedCardSx = (isActive: boolean) => ({
    width: "100%",
    p: 2,

    border: "2px solid",
    borderColor: isActive ? "primary.main" : "divider",
    bgcolor: isActive ? "action.selected" : "background.paper",
    display: "flex",
    alignItems: "center",
    gap: 2,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      borderColor: "primary.main",
      bgcolor: "action.hover",
    },
  });

  const SUPPORTED_LEAGUES = [
    { id: "premier-league", name: "Premier League", active: true },
    { id: "la-liga", name: "La Liga", active: false },
    { id: "serie-a", name: "Serie A", active: false },
  ];

  // Auto-detect tab on mount based on activeGroup
  useEffect(() => {
    if (userData?.activeGroup) {
      const clubData: any = groupData?.[userData.activeGroup];

      const isPrivate = clubData.privateGroup;

      setActiveTab(isPrivate ? 1 : 0);
    }
  }, [userData?.activeGroup, groups]);

  const privateCommunities = useMemo(() => {
    return Object.values(groups || {}).filter(
      (g: any) => g.privateGroup && userData?.groups?.includes(g.groupId),
    );
  }, [groups, userData?.groups]);

  const filteredMarket = useMemo(() => {
    return teamList.filter((team) => {
      const matchesSearch = team.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesLeague = transferLeagueKey === "premier-league";
      const isNotCurrent =
        String(team.teamId) !==
        String(userData?.leagueTeams?.[transferLeagueKey!]);
      return matchesSearch && matchesLeague && isNotCurrent;
    });
  }, [search, transferLeagueKey, userData]);

  const handleConfirmTransfer = () => {
    if (isPending || !transferLeagueKey || !pendingSelection) return;
    startTransition(async () => {
      const result = await updateLeagueTeam({
        userData,
        groupId: String(pendingSelection.teamId),
        leagueKey: transferLeagueKey,
      });
      if (result.success) {
        setPendingSelection(null);
        setTransferLeagueKey(null);
        onClose();
      } else {
        alert(result.message);
      }
    });
  };

  const handleActiveGroupChange = async (newGroupId: string) => {
    if (!newGroupId || isPending) return;
    startTransition(async () => {
      await updateUserField(userData?.uid, "activeGroup", newGroupId);
      onClose();
    });
  };

  const closeDialog = () => {
    setPendingSelection(null);
    setTransferLeagueKey(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "28px",
          bgcolor: "background.default",
          backgroundImage: "none",
        },
      }}
    >
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
            sx={{
              fontWeight: 800,
              color: "primary.main",
              textTransform: "uppercase",
            }}
          >
            {pendingSelection
              ? "Confirm Transfer"
              : transferLeagueKey
                ? `Market: ${transferLeagueKey.replace("-", " ")}`
                : "Manage Memberships"}
          </Typography>
        </Box>
        <IconButton onClick={closeDialog} disabled={isPending}>
          <X size={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, minHeight: 450, position: "relative" }}>
        {!pendingSelection && (
          <Tabs
            value={activeTab}
            onChange={(_, v) => {
              setActiveTab(v);
              setTransferLeagueKey(null);
            }}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              marginBottom: 3,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Tab
              icon={<Trophy size={18} />}
              label="My Teams"
              iconPosition="start"
              disabled={isPending}
            />
            <Tab
              icon={<Lock size={18} />}
              label="Private Groups"
              iconPosition="start"
              disabled={isPending}
            />
          </Tabs>
        )}
        {isPending && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
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

        {pendingSelection ? (
          <Fade in={true}>
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Avatar
                src={pendingSelection.logo}
                sx={{
                  width: 100,
                  height: 100,
                  mx: "auto",
                  mb: 3,
                  borderRadius: "16px",
                  bgcolor: "white",
                  border: "1px solid",
                  borderColor: "divider",
                  p: 1,
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                Sign for {pendingSelection.name}?
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", px: 4, mb: 4 }}
              >
                Joining this club will replace your current{" "}
                <strong>{transferLeagueKey?.replace("-", " ")}</strong>{" "}
                registration.
              </Typography>
              <Paper
                sx={{
                  bgcolor: "warning.light",
                  p: 2,
                  borderRadius: "16px",
                  mb: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  textAlign: "left",
                }}
              >
                <AlertTriangle color="#d32f2f" />
                <Typography
                  variant="caption"
                  sx={{ color: "#d32f2f", fontWeight: 700 }}
                >
                  WARNING: Transfer windows are strict. Once you switch, your
                  account will be{" "}
                  <strong>locked from further transfers for 30 days.</strong>
                </Typography>
              </Paper>
              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setPendingSelection(null)}
                  sx={{ borderRadius: "12px", fontWeight: 800 }}
                >
                  Go Back
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleConfirmTransfer}
                  sx={{ borderRadius: "12px", fontWeight: 800 }}
                >
                  Confirm Transfer
                </Button>
              </Stack>
            </Box>
          </Fade>
        ) : activeTab === 0 ? (
          /* LEAGUE SLOTS VIEW */
          <Box>
            {!transferLeagueKey ? (
              <Stack spacing={2}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 900,
                    color: "text.secondary",
                    letterSpacing: 1,
                  }}
                >
                  YOUR REGISTERED LEAGUE SLOTS
                </Typography>
                {SUPPORTED_LEAGUES.map((league) => {
                  const clubId = userData?.leagueTeams?.[league.id];
                  const isActive = userData.activeGroup === clubId;
                  const clubData: any = groupData?.[clubId];
                  const lastTransfer =
                    userData?.lastTransferDates?.[league.id]?.toDate();
                  const nextDate = lastTransfer
                    ? addDays(lastTransfer, 30)
                    : null;
                  const canChange =
                    !lastTransfer ||
                    differenceInDays(new Date(), lastTransfer) >= 30;

                  return (
                    <Fade in key={league.id}>
                      <Paper
                        variant="outlined"
                        onClick={() =>
                          !isActive && clubId && handleActiveGroupChange(clubId)
                        }
                        sx={{
                          ...sharedCardSx(isActive),
                          opacity: league.active ? 1 : 0.5,
                          cursor:
                            league.active && !isActive ? "pointer" : "default",
                        }}
                      >
                        <Avatar
                          src={clubData?.logo}
                          sx={{
                            width: 54,
                            height: 54,
                            borderRadius: "12px",
                            bgcolor: "white",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Globe size={24} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 900,
                              color: isActive
                                ? "primary.main"
                                : "text.secondary",
                              textTransform: "uppercase",
                            }}
                          >
                            {isActive ? "Currently Viewing" : league.name}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 900, lineHeight: 1.2 }}
                          >
                            {clubData?.name ||
                              (league.active
                                ? "No Club Assigned"
                                : "Opening Soon")}
                          </Typography>
                          {!canChange &&
                            league.active &&
                            isActive &&
                            nextDate && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "warning.main",
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <CalendarClock size={12} /> Window:{" "}
                                {formatDistanceToNow(nextDate)}
                              </Typography>
                            )}
                        </Box>
                        {league.active && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              isActive
                                ? setTransferLeagueKey(league.id)
                                : handleActiveGroupChange(clubId);
                            }}
                            sx={{
                              color: isActive
                                ? "primary.main"
                                : "text.secondary",
                            }}
                          >
                            {isActive ? (
                              clubId ? (
                                <ArrowLeftRight size={22} />
                              ) : (
                                <Plus size={22} />
                              )
                            ) : (
                              <Eye size={22} />
                            )}
                          </IconButton>
                        )}
                      </Paper>
                    </Fade>
                  );
                })}
              </Stack>
            ) : (
              /* MARKET VIEW */
              <Box sx={{ animation: "fadeIn 0.2s ease-in" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <IconButton
                    onClick={() => setTransferLeagueKey(null)}
                    sx={{ mr: 1 }}
                  >
                    <ArrowLeftRight size={18} />
                  </IconButton>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Select New Club
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  placeholder="Search teams..."
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Grid container spacing={1}>
                  {filteredMarket.map((team) => (
                    <Grid size={{ xs: 4, sm: 3 }} key={team.teamId}>
                      <ButtonBase
                        onClick={() => setPendingSelection(team)}
                        sx={{
                          width: "100%",
                          p: 1.5,
                          borderRadius: "16px",
                          border: "1px solid",
                          borderColor: "divider",
                          flexDirection: "column",
                          gap: 1,
                          "&:hover": {
                            bgcolor: "action.hover",
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        <Avatar
                          src={team.logo}
                          sx={{ width: 40, height: 40, borderRadius: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            textAlign: "center",
                            lineHeight: 1.1,
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
        ) : (
          /* PRIVATE COMMUNITIES TAB */
          <Box sx={{ animation: "fadeIn 0.2s ease-in" }}>
            <Typography
              variant="caption"
              sx={{
                mb: 2,
                display: "block",
                fontWeight: 800,
                color: "text.secondary",
              }}
            >
              YOUR JOINED COMMUNITIES
            </Typography>
            <Stack spacing={1.5}>
              {privateCommunities
                .sort((a: any, b: any) => {
                  const aActive = userData.activeGroup === a.groupId;
                  const bActive = userData.activeGroup === b.groupId;
                  // Sort so true (active) comes before false (inactive)
                  return aActive === bActive ? 0 : aActive ? -1 : 1;
                })
                .map((group: any) => {
                  const isActive = userData.activeGroup === group.groupId;
                  return (
                    <Paper
                      key={group.groupId}
                      onClick={() => handleActiveGroupChange(group.groupId)}
                      sx={{
                        ...sharedCardSx(isActive),
                        justifyContent: "flex-start",
                      }}
                    >
                      <Avatar
                        src={group.logo?.replace(/"/g, "")}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "8px",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      />
                      <Box sx={{ flex: 1, textAlign: "left" }}>
                        <Typography
                          sx={{ fontWeight: 700, fontSize: "0.9rem" }}
                        >
                          {group.name}
                        </Typography>
                        {isActive && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "primary.main",
                              fontWeight: 700,
                              display: "block",
                            }}
                          >
                            CURRENTLY VIEWING
                          </Typography>
                        )}
                      </Box>
                      {isActive ? (
                        <CheckCircle2 size={18} color="#4caf50" />
                      ) : (
                        <Eye size={18} color="gray" />
                      )}
                    </Paper>
                  );
                })}
            </Stack>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
