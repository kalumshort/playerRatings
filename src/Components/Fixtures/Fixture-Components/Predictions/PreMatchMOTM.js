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
import { InfoOutlined, Visibility, CheckCircle } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";

// --- SELECTORS & HOOKS (Kept exactly as is) ---
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

  // Data Selectors
  const squadData = useSelector(selectSquadDataObject);
  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));
  const storedUsersPlayerToWatch = usersMatchData?.preMatchMotm;
  const { activeGroup } = useGroupData();
  const { user } = useAuth();
  const globalData = useGlobalData();

  // Local State
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);

  // --- HANDLERS ---
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

  // --- STYLES ---
  const glassCardStyles = {
    // Layout & Spacing only
    p: 3,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "220px",

    // REMOVED: background, backdropFilter, border, borderRadius, overflow, transition
    // These are now inherited automatically from your Global Theme!
  };
  // --- RENDER: VIEW RESULTS STATE ---
  if (storedUsersPlayerToWatch && topPlayer) {
    return (
      <Paper sx={glassCardStyles} elevation={0}>
        {/* Header Badge */}
        <Chip
          icon={<Visibility sx={{ fontSize: "1rem !important" }} />}
          label="COMMUNITY WATCH"
          size="small"
          sx={{
            fontFamily: "Space Mono",
            fontWeight: "bold",
            mb: 2,
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
          }}
          variant="outlined"
        />

        {/* Info Button */}
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            position: "absolute",
            right: 10,
            top: 10,
            color: "text.secondary",
          }}
        >
          <InfoOutlined />
        </IconButton>

        <Stack
          direction="row"
          alignItems="center"
          spacing={3}
          sx={{ width: "100%", justifyContent: "center" }}
        >
          {/* Player Image with Glow */}
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={squadData[topPlayer.playerId]?.photo}
              alt={topPlayer.name}
              sx={{
                width: 80,
                height: 80,
                border: `2px solid ${theme.palette.primary.main}`,
                boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -5,
                right: -5,
                bgcolor: theme.palette.background.paper,
                borderRadius: "50%",
                p: 0.5,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontFamily: "VT323", fontSize: "1.2rem", lineHeight: 1 }}
              >
                #1
              </Typography>
            </Box>
          </Box>

          {/* Player Stats */}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "VT323",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {topPlayer.name}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "VT323",
                color: theme.palette.primary.main,
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              {topPlayer.percentage}%
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: "Space Mono" }}
            >
              OF VOTES
            </Typography>
          </Box>
        </Stack>

        {/* Breakdown Popover */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              bgcolor: "background.paper",
              backgroundImage: "none",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              p: 2,
              minWidth: 200,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: "Space Mono",
              color: "text.secondary",
              display: "block",
              mb: 1,
            }}
          >
            VOTE BREAKDOWN
          </Typography>
          <Stack spacing={1}>
            {result.map(({ playerId, name, percentage }, index) => (
              <Box
                key={playerId}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: index === 0 ? "bold" : "normal",
                    color: index === 0 ? "primary.main" : "text.primary",
                  }}
                >
                  {index + 1}. {name}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "Space Mono" }}>
                  {percentage}%
                </Typography>
              </Box>
            ))}
          </Stack>
        </Popover>
      </Paper>
    );
  }

  // --- RENDER: VOTING STATE ---
  return (
    <Paper sx={glassCardStyles} elevation={0}>
      <Typography
        variant="h6"
        sx={{ fontFamily: "VT323", textTransform: "uppercase", mb: 2 }}
      >
        PLAYER TO WATCH
      </Typography>

      <Box sx={{ width: "100%", maxWidth: 300, textAlign: "center" }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, fontFamily: "Space Mono", fontSize: "0.8rem" }}
        >
          Who will control the game?
        </Typography>

        {/* Widget Container - assumes PlayersSelect renders an input/select */}
        <Box
          sx={{
            ".MuiInputBase-root": {
              bgcolor: "background.paper",
              borderRadius: 2,
              fontFamily: "Space Mono",
            },
            mb: 3,
          }}
        >
          <PlayersSelect onChange={(e) => handleChange(e)} showAvatar={true} />
        </Box>

        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={handlePlayerToWatchSubmit}
              variant="contained"
              fullWidth
              startIcon={<CheckCircle />}
              sx={{
                borderRadius: 8,
                py: 1.5,
                fontWeight: "bold",
                fontFamily: "Space Mono",
                letterSpacing: "-0.5px",
              }}
            >
              LOCK IN SELECTION
            </Button>
          </motion.div>
        )}
      </Box>
    </Paper>
  );
}

// --- HELPER FUNCTION (Unchanged logic) ---
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
