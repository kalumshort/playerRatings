import React, { useState, useMemo } from "react";
import {
  Dialog,
  Typography,
  Box,
  Avatar,
  Grid,
  Button,
  IconButton,
} from "@mui/material";
import {
  Whatshot,
  AcUnit,
  SwapHoriz,
  Close,
  TrendingUp,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { handleLivePlayerStats } from "../../../Firebase/Firebase";
import useGlobalData from "../../../Hooks/useGlobalData";
import useGroupData from "../../../Hooks/useGroupsData";
import { selectSquadPlayerById } from "../../../Selectors/squadDataSelectors";

const glassStyle = {
  background: "rgba(20, 20, 20, 0.90)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "24px",
  color: "white",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
};

// --- SUB ITEM COMPONENT ---
const SubstituteItem = ({
  playerId,
  clubSlug,
  onVote,
  voteCount,
  compact = false,
}) => {
  const playerData = useSelector((state) =>
    selectSquadPlayerById(playerId, clubSlug)(state)
  );
  if (!playerData) return null;

  return (
    <Grid item xs={12}>
      <Button
        fullWidth
        onClick={() => onVote(playerData.id)}
        sx={{
          justifyContent: "space-between",
          color: "white",
          p: compact ? 0.5 : 1, // Smaller padding for compact mode
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            src={playerData.photo}
            sx={{ width: compact ? 28 : 35, height: compact ? 28 : 35, mr: 2 }}
          />
          <Box sx={{ textAlign: "left" }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: compact ? "0.85rem" : "0.9rem" }}
            >
              {playerData.name}
            </Typography>
            {!compact && (
              <Typography variant="caption" sx={{ color: "#aaa" }}>
                {playerData.pos}
              </Typography>
            )}
          </Box>
        </Box>

        {voteCount > 0 && (
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="caption"
              sx={{ color: "#00e676", fontWeight: "bold", display: "block" }}
            >
              {voteCount} votes
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
  const { currentYear } = useGlobalData();
  const { activeGroup } = useGroupData();
  const [view, setView] = useState("main");
  const { clubSlug } = useParams();

  const mainPlayerData = useSelector((state) =>
    selectSquadPlayerById(player?.id, clubSlug)(state)
  );

  // --- SORTED SUBS LOGIC ---
  const sortedSubs = useMemo(() => {
    const playerStats = liveData.totals[player?.id] || {};

    const subsWithVotes = substitutes.map((sub) => {
      // Key: "sub_req_{subID}" stored on current player
      const specificVoteKey = `sub_req_${sub.player.id}`;
      const count = playerStats[specificVoteKey] || 0;
      return { ...sub, voteCount: count };
    });

    return subsWithVotes.sort((a, b) => b.voteCount - a.voteCount);
  }, [substitutes, liveData, player]);

  // --- GET TOP 2 FOR MAIN VIEW ---
  // Only take players who actually have votes (> 0)
  const top2Suggestions = sortedSubs.filter((s) => s.voteCount > 0).slice(0, 2);

  if (!player) return null;

  const handleVote = async (type, subInId = null) => {
    onClose();
    setView("main");
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
      PaperProps={{ style: glassStyle }}
      fullWidth
      maxWidth="xs"
    >
      <Box sx={{ p: 2, position: "relative" }}>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8, color: "white" }}
        >
          <Close />
        </IconButton>

        {/* --- HEADER --- */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Avatar
            src={mainPlayerData?.photo || player?.photo}
            sx={{
              width: 80,
              height: 80,
              border: "2px solid rgba(255,255,255,0.2)",
              mb: 1,
            }}
          />
          <Typography variant="h5" sx={{ fontFamily: "'VT323', monospace" }}>
            {mainPlayerData?.name || player?.name}
          </Typography>
        </Box>

        {view === "main" ? (
          <>
            <Grid container spacing={2}>
              {/* HOT / COLD BUTTONS */}
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleVote("hot")}
                  sx={{
                    height: "90px",
                    borderColor: "#ff5722",
                    color: "#ff5722",
                    flexDirection: "column",
                  }}
                >
                  <Whatshot sx={{ fontSize: 32, mb: 0.5 }} /> On Fire
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleVote("cold")}
                  sx={{
                    height: "90px",
                    borderColor: "#29b6f6",
                    color: "#29b6f6",
                    flexDirection: "column",
                  }}
                >
                  <AcUnit sx={{ fontSize: 32, mb: 0.5 }} /> Frozen
                </Button>
              </Grid>

              {/* SUB BUTTON */}
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setView("subs")}
                  sx={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    py: 1.5,
                  }}
                  startIcon={<SwapHoriz />}
                >
                  Vote to Substitute
                </Button>
              </Grid>
            </Grid>

            {/* --- TOP 2 SUGGESTIONS SECTION --- */}
            {top2Suggestions.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "16px",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#aaa",
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                    ml: 0.5,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 16, mr: 1, color: "#00e676" }} />
                  FANS WANT TO SEE:
                </Typography>
                <Grid container spacing={1}>
                  {top2Suggestions.map((sub) => (
                    <SubstituteItem
                      key={sub.player.id}
                      playerId={sub.player.id}
                      clubSlug={clubSlug}
                      voteCount={sub.voteCount}
                      compact={true} // Use compact mode for main view
                      onVote={(id) => handleVote("sub", id)}
                    />
                  ))}
                </Grid>
              </Box>
            )}
          </>
        ) : (
          /* --- FULL LIST VIEW --- */
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                textAlign: "center",
                color: "#00e676",
                letterSpacing: 1,
              }}
            >
              WHO SHOULD COME ON?
            </Typography>

            <Grid
              container
              spacing={1}
              sx={{ maxHeight: "400px", overflowY: "auto", pr: 0.5 }}
            >
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

            <Button
              fullWidth
              onClick={() => setView("main")}
              sx={{ mt: 2, color: "#aaa" }}
            >
              Back
            </Button>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
