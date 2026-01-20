import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
  Paper,
  Stack,
  Avatar,
  useTheme,
  Chip,
} from "@mui/material";
import {
  InfoOutlined,
  VisibilityRounded,
  CheckCircleRounded,
  StarRounded,
  HourglassEmptyRounded,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

// --- SELECTORS & HOOKS ---
import { selectSquadDataObject } from "../../../../Selectors/squadDataSelectors";
import { selectPredictionsByMatchId } from "../../../../Selectors/predictionsSelectors";
import useGroupData from "../../../../Hooks/useGroupsData";
import { useAuth } from "../../../../Providers/AuthContext";
import useGlobalData from "../../../../Hooks/useGlobalData";
import { selectUserMatchData } from "../../../../Selectors/userDataSelectors";
import { handlePredictPreMatchMotm } from "../../../../Firebase/Firebase";
import { fetchMatchPredictions } from "../../../../Hooks/Fixtures_Hooks";
import PlayersSelect from "../../../Widgets/PlayersSelect";
import { useParams } from "react-router-dom";

export default function PreMatchMOTM({ fixture }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { clubSlug } = useParams();

  const squadData = useSelector((state) =>
    selectSquadDataObject(state, clubSlug),
  );
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));
  const storedUsersPlayerToWatch = usersMatchData?.preMatchMotm;
  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const globalData = useGlobalData();

  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleChange = (event) => setSelectedPlayer(event.target.value);

  const handlePlayerToWatchSubmit = async () => {
    if (!user) return;
    await handlePredictPreMatchMotm({
      matchId: fixture.id,
      playerId: selectedPlayer,
      groupId: activeGroup.groupId,
      userId: user.uid,
      currentYear: globalData.currentYear,
    });

    dispatch(
      fetchMatchPredictions({
        matchId: fixture.id,
        groupId: activeGroup.groupId,
        currentYear: globalData.currentYear,
      }),
    );
  };

  const result = calculatePercentages(
    matchPredictions?.preMatchMotm || {},
    matchPredictions?.preMatchMotmVotes || 0,
    squadData,
  );

  const open = Boolean(anchorEl);
  const topPlayer = result.length > 0 ? result[0] : null;

  // --- RENDER: VIEW RESULTS STATE ---
  if (storedUsersPlayerToWatch || !user) {
    return (
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 3,
          position: "relative",
          minHeight: "260px",
          display: "flex",
          flexDirection: "column",
        })}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Chip
            icon={<VisibilityRounded sx={{ fontSize: "1rem !important" }} />}
            label="COMMUNITY WATCH"
            size="small"
            sx={{
              fontWeight: 900,
              bgcolor: "background.default", // Clay look
              border: `1px solid ${theme.palette.divider}`,
              color: "primary.main",
              fontSize: "0.65rem",
            }}
          />
          {topPlayer && (
            <IconButton
              onClick={handleClick}
              size="small"
              sx={(theme) => ({
                ...theme.clay.button, // Floating button
                width: 32,
                height: 32,
              })}
            >
              <InfoOutlined fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {topPlayer ? (
            <Stack
              direction="row"
              spacing={3}
              alignItems="center"
              justifyContent="center"
            >
              {/* Spotlight Avatar */}
              <Box sx={{ position: "relative" }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100 }}
                >
                  <Avatar
                    src={squadData?.[topPlayer?.playerId]?.photo}
                    sx={{
                      width: 90,
                      height: 90,
                      // Floating Sphere
                      border: `4px solid ${theme.palette.background.default}`,
                      boxShadow: theme.clay.card.boxShadow,
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      px: 1.5,
                      borderRadius: "8px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 900 }}>
                      #1
                    </Typography>
                  </Box>
                </motion.div>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.6,
                    letterSpacing: 1,
                    fontWeight: 800,
                    fontSize: "0.65rem",
                  }}
                >
                  KEY PROTAGONIST
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 900, mb: 0.5, lineHeight: 1 }}
                >
                  {topPlayer.name.split(" ").pop().toUpperCase()}{" "}
                  {/* Last Name Only for Impact */}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5}>
                  <Typography
                    variant="h3"
                    sx={{ color: "primary.main", fontWeight: 900 }}
                  >
                    {topPlayer.percentage}%
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.5, fontWeight: 700 }}
                  >
                    CONSENSUS
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          ) : (
            /* EMPTY STATE */
            <Stack alignItems="center" spacing={1} sx={{ opacity: 0.5 }}>
              <HourglassEmptyRounded sx={{ fontSize: 40 }} />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, letterSpacing: 1 }}
              >
                AWAITING CONSENSUS...
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Vote Breakdown Popover */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              mt: 1.5,
              p: 2,
              minWidth: 220,
              borderRadius: "16px",
              ...theme.clay.card, // Reuse Clay Card style
              border: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mb: 1,
              color: "primary.main",
              fontWeight: 900,
            }}
          >
            Vote Breakdown
          </Typography>
          <Stack spacing={1.5}>
            {result.slice(0, 5).map(({ playerId, name, percentage }, index) => (
              <Stack
                key={playerId}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography
                  variant="caption"
                  sx={{ fontWeight: index === 0 ? 900 : 500 }}
                >
                  {index + 1}. {name}
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {percentage}%
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Popover>
      </Paper>
    );
  }

  // --- RENDER: VOTING STATE ---
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "240px",
      })}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <StarRounded color="primary" sx={{ fontSize: 20 }} />
        <Typography
          variant="button"
          sx={{
            letterSpacing: 1.5,
            opacity: 0.8,
            fontWeight: 900,
            fontSize: "0.75rem",
          }}
        >
          PLAYER TO WATCH
        </Typography>
      </Stack>

      <Typography
        variant="caption"
        sx={{
          mb: 4,
          opacity: 0.6,
          textAlign: "center",
          maxWidth: "80%",
          lineHeight: 1.4,
        }}
      >
        Identify the player most likely to influence the result today.
      </Typography>

      <Box sx={{ width: "100%", maxWidth: 300 }}>
        <Box
          sx={(theme) => ({
            mb: 3,
            // Pressed Well for Input
            ...theme.clay.box,
            bgcolor: "background.default",
            p: 0.5,
            borderRadius: "16px",
          })}
        >
          <PlayersSelect onChange={(e) => handleChange(e)} showAvatar={true} />
        </Box>

        <AnimatePresence>
          {selectedPlayer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Button
                onClick={handlePlayerToWatchSubmit}
                variant="contained"
                fullWidth
                size="large"
                startIcon={<CheckCircleRounded />}
                sx={{
                  fontWeight: 900,
                }}
              >
                LOCK IN WATCH
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Paper>
  );
}

// Helper Logic
const calculatePercentages = (preMatchMotm, preMatchMotmVotes, squadData) => {
  const totalVotes = parseInt(preMatchMotmVotes, 10);
  if (!totalVotes || totalVotes <= 0 || !squadData) return [];

  return Object.entries(preMatchMotm)
    .map(([playerId, votes]) => ({
      playerId,
      name: squadData[playerId]?.name || "Unknown Player",
      votes,
      percentage: ((votes / totalVotes) * 100).toFixed(0),
    }))
    .sort((a, b) => b.votes - a.votes);
};
