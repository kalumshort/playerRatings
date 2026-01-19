import React, { useState, useMemo } from "react";
import {
  Dialog,
  Typography,
  Box,
  Avatar,
  Grid,
  Button,
  IconButton,
  useTheme,
  Zoom,
  Fade,
} from "@mui/material";
import {
  WhatshotRounded,
  AcUnitRounded,
  SwapHorizRounded,
  CloseRounded,
  TrendingUpRounded,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { handleLivePlayerStats } from "../../../Firebase/Firebase";
import useGlobalData from "../../../Hooks/useGlobalData";
import useGroupData from "../../../Hooks/useGroupsData";
import { selectSquadPlayerById } from "../../../Selectors/squadDataSelectors";

// --- SUB ITEM COMPONENT ---
const SubstituteItem = ({
  playerId,
  clubSlug,
  onVote,
  voteCount,
  compact = false,
}) => {
  const theme = useTheme();
  const playerData = useSelector((state) =>
    selectSquadPlayerById(playerId, clubSlug)(state),
  );
  if (!playerData) return null;

  return (
    <Grid item xs={12}>
      <Button
        fullWidth
        onClick={() => onVote(playerData.id)}
        sx={{
          justifyContent: "space-between",
          color: "text.primary",
          p: compact ? 1 : 1.5,
          borderRadius: "16px",
          // Hover effect for the list item
          "&:hover": {
            bgcolor: theme.palette.action.hover,
            transform: "translateX(4px)",
          },
          transition: "all 0.2s ease",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={playerData.photo}
            sx={{
              width: compact ? 32 : 40,
              height: compact ? 32 : 40,
              mr: 2,
              border: `2px solid ${theme.palette.divider}`,
            }}
          />
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                fontSize: compact ? "0.85rem" : "0.95rem",
              }}
            >
              {playerData.name}
            </Typography>
            {!compact && (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                {playerData.pos}
              </Typography>
            )}
          </Box>
        </Box>

        {voteCount > 0 && (
          <Box
            sx={{
              bgcolor: "success.main",
              color: "white",
              px: 1,
              borderRadius: "8px",
              minWidth: "24px",
              textAlign: "center",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 900 }}>
              {voteCount}
            </Typography>
          </Box>
        )}
      </Button>
    </Grid>
  );
};

export default function PlayerActionModal({
  open,
  onClose,
  player,
  fixtureId,
  substitutes = [],
  elapsedTime = "HT",
  liveData = { totals: {} },
}) {
  const theme = useTheme();
  const { currentYear } = useGlobalData();
  const { activeGroup } = useGroupData();
  const [view, setView] = useState("main");
  const { clubSlug } = useParams();

  const mainPlayerData = useSelector((state) =>
    selectSquadPlayerById(player?.id, clubSlug)(state),
  );

  // --- SORTED SUBS LOGIC ---
  const sortedSubs = useMemo(() => {
    const playerStats = liveData.totals[player?.id] || {};
    const subsWithVotes = substitutes.map((sub) => {
      const specificVoteKey = `sub_req_${sub.player.id}`;
      const count = playerStats[specificVoteKey] || 0;
      return { ...sub, voteCount: count };
    });
    return subsWithVotes.sort((a, b) => b.voteCount - a.voteCount);
  }, [substitutes, liveData, player]);

  const top2Suggestions = sortedSubs.filter((s) => s.voteCount > 0).slice(0, 2);

  if (!player) return null;

  const handleVote = async (type, subInId = null) => {
    onClose();
    setView("main"); // Reset view for next open
    if (!activeGroup?.groupId) return;

    const commonPayload = {
      groupId: activeGroup.groupId,
      currentYear,
      matchId: String(fixtureId),
      timeElapsed: elapsedTime || 90,
    };

    try {
      if (type === "sub" && subInId) {
        await handleLivePlayerStats({
          ...commonPayload,
          playerId: String(player.id),
          statKey: "sub",
        });
        await handleLivePlayerStats({
          ...commonPayload,
          playerId: String(player.id),
          statKey: `sub_req_${subInId}`,
        });
      } else {
        await handleLivePlayerStats({
          ...commonPayload,
          playerId: String(player.id),
          statKey: type,
        });
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Zoom} // Pop-in animation
      PaperProps={{
        sx: {
          ...theme.clay.card, // 1. Global Clay Card
          borderRadius: "32px",
          p: 0,
          margin: 2,
          maxWidth: "360px",
          width: "100%",
          overflow: "visible", // Allow close button to float if needed
        },
      }}
    >
      <Box sx={{ p: 3, position: "relative" }}>
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: "text.secondary",
            bgcolor: "background.default", // Clay effect for button
            boxShadow: theme.shadows[1],
            "&:hover": { bgcolor: "background.default", color: "error.main" },
          }}
        >
          <CloseRounded />
        </IconButton>

        {/* --- HEADER --- */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
            mt: 1,
          }}
        >
          <Avatar
            src={mainPlayerData?.photo || player?.photo}
            sx={{
              width: 90,
              height: 90,
              // Clay Sphere
              border: `5px solid ${theme.palette.background.paper}`,
              boxShadow: theme.clay.card.boxShadow,
              mb: 2,
            }}
          />
          <Typography variant="h5" fontWeight={900} letterSpacing="-0.5px">
            {mainPlayerData?.name || player?.name}
          </Typography>
        </Box>

        {view === "main" ? (
          <Fade in={true}>
            <Box>
              <Grid container spacing={2}>
                {/* HOT BUTTON */}
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    onClick={() => handleVote("hot")}
                    sx={{
                      ...theme.clay.button, // Clay Button Shape
                      height: "110px",
                      flexDirection: "column",
                      bgcolor: "#FFF3E0", // Pastel Orange
                      border: "2px solid #FFCC80",
                      color: "#E65100",
                      "&:hover": { bgcolor: "#FFE0B2" },
                    }}
                  >
                    <WhatshotRounded sx={{ fontSize: 36, mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight={800}>
                      ON FIRE
                    </Typography>
                  </Button>
                </Grid>

                {/* COLD BUTTON */}
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    onClick={() => handleVote("cold")}
                    sx={{
                      ...theme.clay.button,
                      height: "110px",
                      flexDirection: "column",
                      bgcolor: "#E1F5FE", // Pastel Blue
                      border: "2px solid #81D4FA",
                      color: "#0277BD",
                      "&:hover": { bgcolor: "#B3E5FC" },
                    }}
                  >
                    <AcUnitRounded sx={{ fontSize: 36, mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight={800}>
                      FROZEN
                    </Typography>
                  </Button>
                </Grid>

                {/* SUB BUTTON */}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    onClick={() => setView("subs")}
                    startIcon={<SwapHorizRounded />}
                    sx={{
                      ...theme.clay.button,
                      py: 1.5,
                      bgcolor: "background.default",
                      color: "text.primary",
                      fontWeight: 800,
                      mt: 1,
                    }}
                  >
                    VOTE TO SUBSTITUTE
                  </Button>
                </Grid>
              </Grid>

              {/* --- TOP SUGGESTIONS (Pressed Well) --- */}
              {top2Suggestions.length > 0 && (
                <Box
                  sx={(theme) => ({
                    ...theme.clay.box, // Pressed look
                    mt: 3,
                    p: 2,
                    borderRadius: "20px",
                    bgcolor: "background.default",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      fontWeight: 800,
                      letterSpacing: 1,
                    }}
                  >
                    <TrendingUpRounded
                      sx={{ fontSize: 16, mr: 1, color: "success.main" }}
                    />
                    FANS WANT TO SEE:
                  </Typography>
                  <Grid container spacing={1}>
                    {top2Suggestions.map((sub) => (
                      <SubstituteItem
                        key={sub.player.id}
                        playerId={sub.player.id}
                        clubSlug={clubSlug}
                        voteCount={sub.voteCount}
                        compact={true}
                        onVote={(id) => handleVote("sub", id)}
                      />
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Fade>
        ) : (
          /* --- FULL LIST VIEW --- */
          <Fade in={true}>
            <Box>
              <Typography
                variant="subtitle1"
                align="center"
                fontWeight={800}
                sx={{ mb: 2, color: "text.secondary" }}
              >
                WHO COMES ON?
              </Typography>

              {/* Scrollable Area */}
              <Box
                sx={{
                  maxHeight: "350px",
                  overflowY: "auto",
                  pr: 1,
                  mx: -1, // slight negative margin for wider scroll area
                  px: 1,
                }}
              >
                <Grid container spacing={1}>
                  {sortedSubs.map((sub) => (
                    <SubstituteItem
                      key={sub.player.id}
                      playerId={sub.player.id}
                      clubSlug={clubSlug}
                      onVote={(id) => handleVote("sub", id)}
                      voteCount={sub.voteCount}
                    />
                  ))}
                </Grid>
              </Box>

              <Button
                fullWidth
                onClick={() => setView("main")}
                sx={{ mt: 3, color: "text.secondary", fontWeight: 700 }}
              >
                Back to Actions
              </Button>
            </Box>
          </Fade>
        )}
      </Box>
    </Dialog>
  );
}
