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
  alpha,
} from "@mui/material";
import {
  InfoOutlined,
  Visibility,
  CheckCircle,
  Star,
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

export default function PreMatchMOTM({ fixture }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const squadData = useSelector(selectSquadDataObject);
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
      })
    );
  };

  const result = calculatePercentages(
    matchPredictions?.preMatchMotm || {},
    matchPredictions?.preMatchMotmVotes || 0,
    squadData
  );

  const open = Boolean(anchorEl);
  const topPlayer = result[0];

  // --- RENDER: VIEW RESULTS STATE ---
  if (storedUsersPlayerToWatch && topPlayer) {
    return (
      <Paper
        sx={{ p: 3, position: "relative", minHeight: "240px" }}
        elevation={0}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Chip
            icon={<Visibility sx={{ fontSize: "1rem !important" }} />}
            label="COMMUNITY WATCH"
            size="small"
            sx={{
              fontWeight: 900,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderColor: alpha(theme.palette.primary.main, 0.3),
              color: theme.palette.primary.main,
            }}
            variant="outlined"
          />
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <InfoOutlined fontSize="small" />
          </IconButton>
        </Stack>

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
                src={squadData[topPlayer.playerId]?.photo}
                sx={{
                  width: 90,
                  height: 90,
                  border: `3px solid ${theme.palette.primary.main}`,
                  boxShadow: `0 0 30px ${alpha(
                    theme.palette.primary.main,
                    0.3
                  )}`,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: -8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  bgcolor: "primary.main",
                  color: "black",
                  px: 1.5,
                  borderRadius: 1,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
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
              sx={{ opacity: 0.6, letterSpacing: 1, fontWeight: 700 }}
            >
              KEY PROTAGONIST
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
              {topPlayer.name.toUpperCase()}
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
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.default, 0.95),
              backdropFilter: "blur(10px)",
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[10],
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
                <Typography variant="caption">{percentage}%</Typography>
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
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "240px",
      }}
      elevation={0}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <Star color="primary" sx={{ fontSize: 18 }} />
        <Typography variant="button" sx={{ letterSpacing: 2, opacity: 0.8 }}>
          Player to Watch
        </Typography>
      </Stack>

      <Typography
        variant="caption"
        sx={{ mb: 3, opacity: 0.6, textAlign: "center", maxWidth: "80%" }}
      >
        Identify the player most likely to influence the result.
      </Typography>

      <Box sx={{ width: "100%", maxWidth: 280 }}>
        <Box
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.3),
            },
          }}
        >
          <PlayersSelect onChange={(e) => handleChange(e)} showAvatar={true} />
        </Box>

        <AnimatePresence>
          {selectedPlayer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Button
                onClick={handlePlayerToWatchSubmit}
                variant="contained"
                fullWidth
                startIcon={<CheckCircle />}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 900,
                  boxShadow: `0 8px 20px ${alpha(
                    theme.palette.primary.main,
                    0.3
                  )}`,
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

const calculatePercentages = (preMatchMotm, preMatchMotmVotes, squadData) => {
  const totalVotes = parseInt(preMatchMotmVotes, 10);
  if (!totalVotes) return [];

  return Object.entries(preMatchMotm)
    .map(([playerId, votes]) => ({
      playerId,
      name: squadData[playerId]?.name || "Unknown",
      votes,
      percentage: ((votes / totalVotes) * 100).toFixed(0),
    }))
    .sort((a, b) => b.percentage - a.percentage);
};
