import React, { useState } from "react";
import useGroupData from "../../../../Hooks/useGroupsData";
import { selectMatchRatingsById } from "../../../../Selectors/selectors";
import { useSelector } from "react-redux";

import { selectSquadPlayerById } from "../../../../Selectors/squadDataSelectors";
import { missingPlayerImg } from "../../../../Hooks/Helper_Functions";
import { ContentContainer } from "../../../../Containers/GlobalContainer";
import {
  alpha,
  Avatar,
  Box,
  MenuItem,
  Select,
  styled,
  Typography,
  useTheme,
} from "@mui/material";

export default function RatingLineup({ fixture, usersMatchPlayerRatings }) {
  const { activeGroup } = useGroupData();
  const matchRatings = useSelector(selectMatchRatingsById(fixture.id));

  const groupClubId = Number(activeGroup.groupClubId);

  const [ratingSrc, setRatingSrc] = useState("Group");

  const handleChange = (event) => {
    setRatingSrc(event.target.value);
  };

  const lineup = fixture?.lineups?.find(
    (team) => team.team.id === groupClubId
  )?.startXI;

  const substitutedPlayerIds = fixture?.events
    .filter((item) => item.type === "subst" && item.team?.id === groupClubId)
    .map((item) => item.player);

  // Ensure both lineup and substitutedPlayerIds are defined and not empty
  if (
    (!lineup || lineup.length === 0) &&
    (!substitutedPlayerIds || substitutedPlayerIds.length === 0)
  ) {
    return <></>;
  }

  return (
    <div className="containerMargin">
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
                          : usersMatchPlayerRatings?.[player.id] ?? null;

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
                      : usersMatchPlayerRatings?.[player.id] ?? null;

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
    </div>
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

export const RatingLineupPlayer = ({ player, playerRating }) => {
  const theme = useTheme();
  // Fetch supplementary player data if not passed in props
  const playerData = useSelector(selectSquadPlayerById(player?.id));

  if (!player) return null;

  // Clean the rating display
  const displayRating =
    playerRating && playerRating !== "na" ? playerRating : "-";

  return (
    <Box sx={{ position: "relative", width: 50, height: 50 }}>
      {/* Player Image */}
      <Avatar
        src={player?.photo || playerData?.photo || missingPlayerImg}
        alt={player.name}
        sx={{
          width: "100%",
          height: "100%",
          // Semi-transparent border for the glass look
          border: `2px solid ${alpha(theme.palette.primary.main, 0.6)}`,
          boxShadow: `0 4px 8px rgba(0,0,0,0.4)`,
          bgcolor: "grey.800",
        }}
      />

      {/* Consensus Score Overlay */}
      <ScoreBadge>
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: "bold",
            // Uses the retro-style font from your ThemeProvider
            fontFamily: theme.typography.h1.fontFamily,
            lineHeight: 1,
          }}
        >
          {displayRating}
        </Typography>
      </ScoreBadge>
    </Box>
  );
};
