import React, { useState } from "react";
import useGroupData from "../../../../Hooks/useGroupsData";
import { selectMatchRatingsById } from "../../../../Selectors/selectors";
import { useSelector } from "react-redux";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";

import { ContentContainer } from "../../../../Containers/GlobalContainer";
import {
  alpha,
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

  // Ensure both lineup and substitutedPlayerIds are defined and not empty
  if (
    (!lineup || lineup.length === 0) &&
    (!substitutedPlayerIds || substitutedPlayerIds.length === 0)
  ) {
    return <></>;
  }

  return (
    <Paper>
      <FanMOTMHighlight motmPercentages={motmPercentages} />
      <ContentContainer
        className="lineup-container"
        style={{ padding: "15px 5px", position: "relative" }}
      >
        <Select
          value={ratingSrc}
          onChange={handleChange}
          size="small"
          variant="standard"
          style={{ position: "absolute", top: "5px", right: "5px", zIndex: 10 }}
        >
          <MenuItem key="global" value="Group">
            Group
          </MenuItem>
          <MenuItem key="personal" value="Personal">
            Personal
          </MenuItem>
        </Select>
        <div style={{ position: "relative" }}>
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
                .reverse() // Reverse the order of rows
                .map((rowPlayers, rowIndex) => (
                  <div key={rowIndex} className="row">
                    {rowPlayers.map((player) => {
                      // Ensure the player has a valid rating or fallback to an empty object
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
          <div>
            <h2
              className="heading2"
              style={{ textAlign: "center", marginTop: "10px" }}
            >
              Substitutes
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-evenly",
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
          </div>
        </div>
      </ContentContainer>
    </Paper>
  );
}

// --- STYLED COMPONENTS ---

const ScoreBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: -2,
  right: -2,
  backgroundColor: theme.palette.primary.main, // Uses your group's accent color
  color: theme.palette.primary.contrastText,
  padding: "2px 4px",
  borderRadius: "6px",
  border: `1.5px solid ${theme.palette.background.default}`,
  boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
  zIndex: 10,
  minWidth: "22px",
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

  const hasRating = displayRating !== "—";

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
          transform: "scale(1.08)",
          zIndex: 2,
        },
      }}
    >
      {/* Avatar + badge wrapper */}
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
            border: `2.5px solid ${alpha(theme.palette.primary.main, 0.7)}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            bgcolor: "grey.800",
          }}
        />

        {/* Floating rating badge – bottom right */}
        <ScoreBadge>
          <Typography
            variant="caption"
            sx={{
              fontWeight: "bold",
              fontSize: "0.78rem",
              color: hasRating ? "#000" : "#ccc",
              lineHeight: 1,
            }}
          >
            {displayRating}
          </Typography>
        </ScoreBadge>
      </Box>

      {/* Player name */}
      <Typography
        variant="caption"
        noWrap
        sx={{
          mt: 1.2,
          fontSize: "0.74rem",
          fontWeight: 600,
          textAlign: "center",
          maxWidth: "100%",
          color: "white",
          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          lineHeight: 1.1,
          px: 0.5,
        }}
      >
        {playerData?.name || player.name}
      </Typography>

      {/* Optional shirt number – remove this block if you don't want/need it */}
    </Box>
  );
});
