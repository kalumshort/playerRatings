"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Popover,
  IconButton,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  InfoOutlined,
  VisibilityRounded,
  CheckCircleRounded,
  StarRounded,
  HourglassEmptyRounded,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import { handlePredictPreMatchMotm } from "@/lib/firebase/client-actions";
import { useAuth } from "@/context/AuthContext";
import { RootState } from "@/lib/redux/store";
import PlayersSelect from "../../Widgets/PlayersSelect";
import { selectActiveSquadMapped } from "@/lib/redux/selectors/squadSelectors";
import { useClubView } from "@/context/ClubViewProvider";

interface PreMatchMOTMProps {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
  isPreMatch: boolean;
}

export default function PreMatchMOTM({
  fixture,
  groupId,
  currentYear,
  groupData,
  isPreMatch,
}: PreMatchMOTMProps) {
  const theme = useTheme() as any;
  const { user } = useAuth();
  const { isGuestView } = useClubView();

  const matchId = String(fixture.id);

  const activeSquad = useSelector((state: RootState) =>
    selectActiveSquadMapped(state, groupData.groupClubId, currentYear),
  );

  const matchPredictions = useSelector(
    (state: RootState) => state.predictions.byGroupId[groupId]?.[matchId],
  );
  const usersMatchData = useSelector(
    (state: RootState) => state.userData?.matches?.[matchId],
  );

  const storedUsersPlayerToWatch = usersMatchData?.preMatchMotm;

  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const result = useMemo(() => {
    const votes = matchPredictions?.preMatchMotm || {};
    const total = Number(matchPredictions?.preMatchMotmVotes) || 0;
    if (total <= 0 || !activeSquad) return [];

    return Object.entries(votes)
      .map(([pId, v]: [string, any]) => ({
        playerId: pId,
        name: activeSquad[pId]?.name || "Unknown",
        percentage: Math.round((v / total) * 100),
        votes: v,
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [matchPredictions, activeSquad]);

  const topPlayer = result[0];

  const handleSubmit = async () => {
    if (!user || !selectedPlayer) return;
    await handlePredictPreMatchMotm({
      matchId,
      playerId: selectedPlayer,
      groupId,
      userId: user.uid,
      currentYear,
    });
  };

  // --- RESULTS VIEW ---
  if (isGuestView || !isPreMatch || storedUsersPlayerToWatch || !user) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between", // Shared with voting view
          height: "100%",
          width: "100%",
          borderRadius: "32px",
          boxSizing: "border-box",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <VisibilityRounded color="primary" sx={{ fontSize: 20 }} />
          <Typography
            variant="h4"
            sx={{ letterSpacing: 1.5, fontWeight: 900, fontSize: "0.75rem" }}
          >
            COMMUNITY WATCH
          </Typography>
        </Stack>

        <Box
          sx={{
            my: 2,
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {topPlayer ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={activeSquad?.[topPlayer.playerId]?.photo}
                  sx={{
                    width: 70, // Slightly smaller to prevent vertical bloat
                    height: 70,
                    border: `4px solid white`,
                    boxShadow: theme.shadows[4],
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    bgcolor: "primary.main",
                    color: "white",
                    px: 1,
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    fontWeight: 900,
                  }}
                >
                  #1
                </Box>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: "text.secondary",
                    display: "block",
                    fontSize: "0.6rem",
                  }}
                >
                  KEY PROTAGONIST
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 900, lineHeight: 1.1 }}
                >
                  {topPlayer.name.split(" ").pop()?.toUpperCase()}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: "primary.main", fontWeight: 900 }}
                >
                  {topPlayer.percentage}%
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={1} sx={{ opacity: 0.3 }}>
              <HourglassEmptyRounded sx={{ fontSize: 30 }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                AWAITING DATA
              </Typography>
            </Stack>
          )}
        </Box>

        <Button
          fullWidth
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={!topPlayer}
          startIcon={<InfoOutlined />}
          sx={{
            ...theme.clay?.button,
            py: 1.5,
            borderRadius: "16px",
            fontWeight: 900,
            fontSize: "0.75rem",
          }}
        >
          VIEW BREAKDOWN
        </Button>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          PaperProps={{
            sx: {
              p: 2,
              minWidth: 200,
              borderRadius: "16px",
              ...theme.clay?.card,
            },
          }}
        >
          {/* Breakdown mapping remains the same */}
          {result.slice(0, 5).map((p, i) => (
            <Stack
              key={p.playerId}
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="caption">
                {i + 1}. {p.name}
              </Typography>
              <Typography variant="caption" fontWeight={900}>
                {p.percentage}%
              </Typography>
            </Stack>
          ))}
        </Popover>
      </Paper>
    );
  }

  // --- VOTING VIEW ---
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        height: "100%",
        width: "100%",
        borderRadius: "32px",
        boxSizing: "border-box",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <StarRounded color="primary" sx={{ fontSize: 20 }} />
        <Typography
          variant="button"
          sx={{ fontWeight: 900, fontSize: "0.75rem", letterSpacing: 1.5 }}
        >
          PLAYER TO WATCH
        </Typography>
      </Stack>

      <Box sx={{ width: "100%", my: 2 }}>
        <Typography
          variant="caption"
          sx={{
            mb: 2,
            display: "block",
            color: "text.secondary",
            textAlign: "center",
            fontSize: "0.7rem",
          }}
        >
          Who will influence the result today?
        </Typography>
        <Box
          sx={{
            ...theme.clay?.box,
            p: 0.5,
            borderRadius: "16px",
            bgcolor: "background.default",
          }}
        >
          <PlayersSelect
            onChange={(e: any) => setSelectedPlayer(e.target.value)}
            playersMap={activeSquad}
          />
        </Box>
      </Box>

      <Box sx={{ width: "100%", minHeight: 48 }}>
        <AnimatePresence mode="wait">
          {selectedPlayer ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                onClick={handleSubmit}
                variant="contained"
                fullWidth
                startIcon={<CheckCircleRounded />}
                sx={{ fontWeight: 900, py: 1.5, borderRadius: "16px" }}
              >
                LOCK IN WATCH
              </Button>
            </motion.div>
          ) : (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 2,
                color: "text.disabled",
                fontWeight: 700,
              }}
            >
              SELECT A PLAYER
            </Typography>
          )}
        </AnimatePresence>
      </Box>
    </Paper>
  );
}
