"use client";

import React, {
  useState,
  useTransition,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
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
  alpha,
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
import InviteCodeEntry from "./InviteCodeEntry";
import useClubDirectory from "@/Hooks/useClubDirectory";
import { selectJoinableClubs } from "@/lib/clubDirectory";
import useGroupData from "@/Hooks/useGroupData";
import { toast } from "sonner";

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
  const router = useRouter();
  const pathname = usePathname();

  // The club we're on our way to. A switch only takes effect once the user doc
  // snapshot comes back and GroupNavigationSync follows it, so the dialog holds
  // this state instead of closing onto the club the fan just left.
  const [arrival, setArrival] = useState<{
    name: string;
    slug?: string;
    logoUrl?: string;
  } | null>(null);

  // The club list for the transfer market. Read only while the dialog is open,
  // and cached across opens. Replaces the old hardcoded teamList, so relegated
  // clubs stop being offered the night they drop out of the league.
  const { directory, loading: directoryLoading } = useClubDirectory(open);

  // Unified Styling Helper
  const sharedCardSx = (isActive: boolean) => ({
    width: "100%",
    p: 2,

    border: "1px solid",
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

  // A community is any group that isn't one of the league clubs from teamList.
  // This used to test `g.privateGroup`, a field nothing in the app has ever
  // written — so this tab was always empty and the invite box below it was
  // unreachable. `league` is set by the group doc for real clubs only.
  const isCommunityGroup = (group: any) =>
    Boolean(group) && (!group.league || group.isPublic === false);

  // Auto-detect tab on mount based on activeGroup
  useEffect(() => {
    if (userData?.activeGroup) {
      const clubData: any = groupData?.[userData.activeGroup];

      setActiveTab(isCommunityGroup(clubData) ? 1 : 0);
    }
  }, [userData?.activeGroup, groups]);

  const privateCommunities = useMemo(() => {
    return Object.values(groups || {}).filter(isCommunityGroup);
  }, [groups]);

  const filteredMarket = useMemo(() => {
    return selectJoinableClubs(directory).filter((team) => {
      const matchesSearch = team.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesLeague = transferLeagueKey === "premier-league";
      const isNotCurrent =
        String(team.teamId) !==
        String(userData?.leagueTeams?.[transferLeagueKey!]);
      return matchesSearch && matchesLeague && isNotCurrent;
    });
  }, [directory, search, transferLeagueKey, userData]);

  const handleConfirmTransfer = () => {
    if (isPending || !transferLeagueKey || !pendingSelection) return;
    startTransition(async () => {
      const result = await updateLeagueTeam({
        userData,
        groupId: String(pendingSelection.teamId),
        leagueKey: transferLeagueKey,
      });
      if (result.success) {
        // The transfer sets activeGroup server-side, so no separate write is
        // needed — just hold the dialog until we land in the new stadium.
        setArrival({
          name: pendingSelection.name,
          slug: pendingSelection.slug,
          logoUrl: pendingSelection.logoUrl,
        });
        setPendingSelection(null);
        setTransferLeagueKey(null);
      } else {
        toast.error(result.message || "Couldn't switch clubs. Try again.");
      }
    });
  };

  const handleActiveGroupChange = async (newGroupId: string) => {
    if (!newGroupId || isPending) return;
    const club: any = groupData?.[newGroupId];
    startTransition(async () => {
      await updateUserField(userData?.uid, "activeGroup", newGroupId);
      setArrival({
        name: club?.name || "your club",
        slug: club?.slug,
        logoUrl: club?.logoUrl || club?.logo,
      });
    });
  };

  // Close once the fan is actually standing in the new club's hub. The push
  // comes from GroupNavigationSync, which waits on the same snapshot; the timer
  // is the escape hatch for when that snapshot never arrives, so a stalled
  // listener leaves a fan with a route rather than a spinner.
  // Read through a ref: callers pass an inline onClose, so depending on it
  // directly would restart the timer on every parent render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!arrival) return;

    if (!arrival.slug || pathname === `/${arrival.slug}`) {
      setArrival(null);
      onCloseRef.current();
      return;
    }

    const timer = setTimeout(() => {
      router.push(`/${arrival.slug}`);
      router.refresh();
      setArrival(null);
      onCloseRef.current();
    }, 6000);

    return () => clearTimeout(timer);
  }, [arrival, pathname, router]);

  const closeDialog = () => {
    setPendingSelection(null);
    setTransferLeagueKey(null);
    setArrival(null);
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
          borderRadius: "14px",
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
            {arrival
              ? "Travelling"
              : pendingSelection
                ? "Confirm Transfer"
                : transferLeagueKey
                  ? `Market: ${transferLeagueKey.replace("-", " ")}`
                  : "Manage Memberships"}
          </Typography>
        </Box>
        <IconButton onClick={closeDialog} disabled={isPending} aria-label="Close">
          <X size={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, minHeight: 450, position: "relative" }}>
        {!pendingSelection && !arrival && (
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
              label="Private Clubs"
              iconPosition="start"
              disabled={isPending}
            />
          </Tabs>
        )}
        {isPending && !arrival && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              // Was a hardcoded rgba(255,255,255,0.7) — a white flash in dark mode.
              bgcolor: (t) => alpha(t.palette.background.paper, 0.7),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "inherit",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {arrival ? (
          <Fade in={true}>
            <Box
              sx={{
                py: 8,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <CircularProgress size={110} thickness={2} />
                <Avatar
                  src={arrival.logoUrl}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    m: "auto",
                    width: 76,
                    height: 76,
                    borderRadius: "12px",
                    bgcolor: "background.paper",
                    p: 1,
                  }}
                >
                  <Globe size={28} />
                </Avatar>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                  Heading to {arrival.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Opening your new club hub…
                </Typography>
              </Box>
            </Box>
          </Fade>
        ) : pendingSelection ? (
          <Fade in={true}>
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Avatar
                src={pendingSelection.logoUrl}
                sx={{
                  width: 100,
                  height: 100,
                  mx: "auto",
                  mb: 3,
                  borderRadius: "10px",
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
                  YOUR LEAGUE TEAMS
                </Typography>

                {Object.entries(userData?.leagueTeams || {}).map(
                  ([leagueId, clubId]: [string, string]) => {
                    // Now you have access to both the leagueId string and the clubId string
                    const isActive = userData?.activeGroup === clubId;
                    const clubData: any = groupData?.[clubId];
                    // Handle Firestore Timestamp safely
                    const transferTimestamp =
                      userData?.lastTransferDates?.[leagueId];
                    const lastTransfer = transferTimestamp?.toDate
                      ? transferTimestamp.toDate()
                      : null;

                    const nextDate = lastTransfer
                      ? addDays(lastTransfer, 30)
                      : null;
                    const canChange =
                      !lastTransfer ||
                      differenceInDays(new Date(), lastTransfer) >= 30;

                    // The club has left the league. Nothing new will ever be
                    // written for it, so surface that here rather than let the
                    // user sit on a slot that can't do anything.
                    const isArchivedClub = clubData?.status === "archived";

                    return (
                      <Fade in key={leagueId}>
                        <Paper
                          variant="outlined"
                          onClick={() =>
                            !isActive &&
                            clubId &&
                            handleActiveGroupChange(clubId)
                          }
                          sx={{
                            ...sharedCardSx(isActive),
                            // Ensure your sharedCardSx is theme-aware
                            opacity: 1, // Adjusted based on your logic
                            cursor: !isActive ? "pointer" : "default",
                          }}
                        >
                          <Avatar
                            /* Group docs store the crest as `logoUrl`; `logo`
                               was never written, so this always fell through
                               to the Globe placeholder. */
                            src={clubData?.logoUrl || clubData?.logo}
                            sx={{
                              width: 54,
                              height: 54,
                              borderRadius: "12px",
                              bgcolor: "background.paper", // Use theme tokens
                              border: (theme) =>
                                `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Globe size={24} />
                          </Avatar>

                          <Box sx={{ flex: 1, ml: 2 }}>
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
                              {isActive
                                ? "Currently Viewing"
                                : leagueId.replace("-", " ")}
                            </Typography>

                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 900, lineHeight: 1.2 }}
                            >
                              {clubData?.name || "Loading..."}
                            </Typography>

                            {isArchivedClub && (
                              <Chip
                                size="small"
                                icon={<AlertTriangle size={13} />}
                                label="Left the league — transfer to keep voting"
                                color="warning"
                                variant="outlined"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTransferLeagueKey(leagueId);
                                }}
                                sx={{
                                  mt: 0.75,
                                  height: "auto",
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                  "& .MuiChip-label": {
                                    px: 0.75,
                                    py: 0.4,
                                    whiteSpace: "normal",
                                  },
                                }}
                              />
                            )}
                          </Box>

                          <IconButton
                            size="small"
                            aria-label={
                              isActive
                                ? "Change club for this league"
                                : "Make this your active club"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              isActive
                                ? setTransferLeagueKey(leagueId)
                                : handleActiveGroupChange(clubId);
                            }}
                            sx={{
                              color: isActive
                                ? "primary.main"
                                : "text.secondary",
                            }}
                          >
                            {isActive ? (
                              <ArrowLeftRight size={22} />
                            ) : (
                              <Eye size={22} />
                            )}
                          </IconButton>
                        </Paper>
                      </Fade>
                    );
                  },
                )}
                {!userData?.leagueTeams && <Box></Box>}
              </Stack>
            ) : (
              /* MARKET VIEW */
              <Box sx={{ animation: "fadeIn 0.2s ease-in" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <IconButton
                    aria-label="Back to my teams"
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
                {directoryLoading && filteredMarket.length === 0 && (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
                {!directoryLoading && filteredMarket.length === 0 && (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No clubs match that search.
                    </Typography>
                  </Box>
                )}
                <Grid container spacing={1}>
                  {filteredMarket.map((team) => (
                    <Grid size={{ xs: 4, sm: 3 }} key={team.teamId}>
                      <ButtonBase
                        onClick={() => setPendingSelection(team)}
                        sx={{
                          width: "100%",
                          p: 1.5,
                          borderRadius: "10px",
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
                          src={team.logoUrl}
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
            {privateCommunities.length === 0 && (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  You haven't joined any private clubs yet.
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Got an invite? Enter the code below.
                </Typography>
              </Box>
            )}
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

        {/* Outside the tab panels on purpose. This used to sit at the bottom of
            the Private Clubs tab, which only ever rendered for groups carrying
            a field the app never set — so nobody could reach it. */}
        {!pendingSelection && !transferLeagueKey && !arrival && (
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }}>
            <InviteCodeEntry onJoined={onClose} />
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
