import React, { useState } from "react";
import useGroupData from "../../../../Hooks/useGroupsData";
import { selectMatchRatingsById } from "../../../../Selectors/selectors";
import { useSelector } from "react-redux";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";

import {
  Avatar,
  Box,
  MenuItem,
  Paper,
  Select,
  styled,
  Typography,
  useTheme,
} from "@mui/material";
import FanMOTMHighlight from "./MotmHighlight";

export default function RatingLineup({
  fixture,
  usersMatchPlayerRatings,
  motmPercentages,
}) {
  const { activeGroup } = useGroupData();
  const matchRatings = useSelector(selectMatchRatingsById(fixture.id));
  const groupClubId = Number(activeGroup?.groupClubId);
  const [ratingSrc, setRatingSrc] = useState("Group");

  const handleChange = (event) => {
    setRatingSrc(event.target.value);
  };

  const lineup = fixture?.lineups?.find(
    (team) => team.team.id === groupClubId,
  )?.startXI;

  const substitutedPlayerIds = fixture?.events
    .filter((item) => item.type === "subst" && item.team?.id === groupClubId)
    .map((item) => {
      const newPlayer =
        item.assist &&
        !lineup.some(
          (lineupPlayer) => lineupPlayer.player.id === item.assist.id,
        )
          ? item.assist
          : item.player;

      return {
        id: newPlayer.id,
        name: newPlayer.name,
      };
    });

  if (
    (!lineup || lineup.length === 0) &&
    (!substitutedPlayerIds || substitutedPlayerIds.length === 0)
  ) {
    return <></>;
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        ...theme.clay.card, // 1. Apply Global Clay Card
        p: 0, // Reset padding for children
        overflow: "hidden",
        position: "relative",
        pb: 2,
        borderRadius: "16px",
      })}
    >
      <FanMOTMHighlight motmPercentages={motmPercentages} />

      <Paper style={{ padding: "15px 5px", position: "relative" }}>
        {/* --- SOURCE SELECTOR --- */}
        <Box
          sx={(theme) => ({
            position: "absolute",
            top: 10,
            right: 15,
            zIndex: 10,
            ...theme.clay.box, // Pressed look for controls
            borderRadius: "12px",
            bgcolor: "background.default",
            px: 1,
          })}
        >
          <Select
            value={ratingSrc}
            onChange={handleChange}
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "text.secondary",
              "& .MuiSelect-select": {
                padding: "4px 8px",
              },
            }}
          >
            <MenuItem value="Group" sx={{ fontSize: "0.8rem" }}>
              Group
            </MenuItem>
            <MenuItem value="Personal" sx={{ fontSize: "0.8rem" }}>
              Personal
            </MenuItem>
          </Select>
        </Box>

        <div style={{ position: "relative" }}>
          {/* --- PITCH VIEW --- */}
          <div className="pitch">
            {lineup &&
              lineup.length > 0 &&
              lineup
                .reduce((rows, { player }) => {
                  const [row] = player.grid.split(":").map(Number);
                  if (!rows[row]) rows[row] = [];
                  rows[row].push(player);
                  return rows;
                }, [])
                .reverse()
                .map((rowPlayers, rowIndex) => (
                  <div key={rowIndex} className="row">
                    {rowPlayers.map((player) => {
                      const playerRating =
                        ratingSrc === "Group"
                          ? matchRatings?.[player.id]?.totalRating &&
                            matchRatings?.[player.id]?.totalSubmits
                            ? matchRatings[player.id].totalRating /
                              matchRatings[player.id].totalSubmits
                            : null
                          : (usersMatchPlayerRatings?.[player.id] ?? null);

                      return (
                        <RatingLineupPlayer
                          key={player.id}
                          player={player}
                          fixture={fixture}
                          playerRating={playerRating?.toFixed(2) || "na"}
                        />
                      );
                    })}
                  </div>
                ))}
          </div>

          {/* --- SUBS VIEW --- */}
          <Box sx={{ mt: 3, px: 2 }}>
            <Typography
              variant="overline"
              align="center"
              display="block"
              sx={{
                fontWeight: 800,
                color: "text.secondary",
                letterSpacing: 1.5,
                mb: 1,
              }}
            >
              Substitutes
            </Typography>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              {substitutedPlayerIds &&
                substitutedPlayerIds.length > 0 &&
                substitutedPlayerIds.map((player) => {
                  const playerRating =
                    ratingSrc === "Group"
                      ? matchRatings?.[player.id]?.totalRating &&
                        matchRatings?.[player.id]?.totalSubmits
                        ? matchRatings[player.id].totalRating /
                          matchRatings[player.id].totalSubmits
                        : null
                      : (usersMatchPlayerRatings?.[player.id] ?? null);

                  return (
                    <RatingLineupPlayer
                      key={player.id}
                      player={player}
                      fixture={fixture}
                      playerRating={playerRating?.toFixed(2)}
                    />
                  );
                })}
            </div>
          </Box>
        </div>
      </Paper>
    </Paper>
  );
}

// --- STYLED COMPONENTS ---

const ScoreBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  right: -4,
  // Use primary color but cleaner shape
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: "2px 6px",
  borderRadius: "8px",
  // White border to separate from Avatar
  border: `2px solid ${theme.palette.background.default}`,
  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  zIndex: 10,
  minWidth: "24px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

// --- COMPONENT ---

export const RatingLineupPlayer = React.memo(({ player, playerRating }) => {
  const theme = useTheme();

  const playerData = useSelector((state) =>
    selectSquadPlayerById(player?.id)(state),
  );

  if (!player) return null;

  const displayRating =
    playerRating && playerRating !== "na" ? String(playerRating) : "—";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 72,
        minHeight: 90,
        position: "relative",
        transition: "transform 0.2s ease",
        "&:hover": {
          transform: "translateY(-4px)", // Lift effect instead of zoom
          zIndex: 2,
        },
      }}
    >
      {/* Avatar Wrapper */}
      <Box sx={{ position: "relative", width: 56, height: 56 }}>
        <Avatar
          src={
            player?.photo ||
            playerData?.photo ||
            `https://media.api-sports.io/football/players/${player.id}.png`
          }
          alt={player.name}
          sx={{
            width: "100%",
            height: "100%",
            // 2. The Clay Avatar Look
            // Matches background to create "cutout", Global Shadow for float
            border: `3px solid ${theme.palette.background.default}`,
            boxShadow: theme.clay.card.boxShadow,
            bgcolor: "background.paper",
          }}
        />

        {/* Rating Badge */}
        <ScoreBadge>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              fontSize: "0.7rem",
              lineHeight: 1,
            }}
          >
            {displayRating}
          </Typography>
        </ScoreBadge>
      </Box>

      {/* Player Name */}
      <Typography
        variant="caption"
        noWrap
        sx={{
          mt: 1,
          fontSize: "0.7rem",
          fontWeight: 700,
          textAlign: "center",
          maxWidth: "100%",
          color: "text.primary",
          textShadow: "0 1px 2px rgba(255,255,255,0.5)", // Subtle depth for text
          px: 0.5,
        }}
      >
        {playerData?.name || player.name}
      </Typography>
    </Box>
  );
});
