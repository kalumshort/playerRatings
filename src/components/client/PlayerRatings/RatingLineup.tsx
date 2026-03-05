"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Avatar,
  Box,
  MenuItem,
  Paper,
  Select,
  styled,
  Typography,
  useTheme,
  alpha,
  SelectChangeEvent,
} from "@mui/material";

// --- NEW SELECTORS ---
import { RootState } from "@/lib/redux/store";
import { selectMatchRatingsById } from "@/lib/redux/selectors/ratingsSelectors";

// --- COMPONENTS ---

import RatingLineupPlayer from "./RatingLineupPlayer";
import FanMOTMHighlight from "./MotmHighlight";

export default function RatingLineup({
  fixture,
  usersMatchPlayerRatings,
  motmPercentages,
}: any) {
  const theme = useTheme();
  const [ratingSrc, setRatingSrc] = useState<"Group" | "Personal">("Group");

  // 1. Context from Redux
  const activeGroupId = useSelector(
    (state: RootState) => state.groupData.activeGroupId,
  );
  const activeGroup = useSelector((state: RootState) =>
    activeGroupId ? state.groupData.byGroupId[activeGroupId] : null,
  );
  const groupClubId = Number(activeGroup?.groupClubId);

  // 2. Ratings Data
  const matchRatings = useSelector(selectMatchRatingsById(fixture.fixture.id));

  const handleChange = (event: SelectChangeEvent) => {
    setRatingSrc(event.target.value as "Group" | "Personal");
  };

  // 3. Lineup Logic
  const lineup = fixture?.lineups?.find(
    (team: any) => team.team.id === groupClubId,
  )?.startXI;

  const substitutedPlayerIds = fixture?.events
    ?.filter(
      (item: any) => item.type === "subst" && item.team?.id === groupClubId,
    )
    .map((item: any) => {
      const newPlayer =
        item.assist &&
        !lineup?.some((lp: any) => lp.player.id === item.assist.id)
          ? item.assist
          : item.player;
      return { id: newPlayer.id, name: newPlayer.name };
    });

  if (!lineup && !substitutedPlayerIds) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        overflow: "hidden",
        position: "relative",
        pb: 2,
        borderRadius: "24px",
        bgcolor: "background.paper",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <FanMOTMHighlight motmPercentages={motmPercentages} />

      <Box sx={{ p: 2, position: "relative" }}>
        {/* --- SOURCE SELECTOR --- */}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 15,
            zIndex: 10,
            borderRadius: "12px",
            bgcolor: alpha(theme.palette.background.default, 0.8),
            backdropFilter: "blur(8px)",
            border: `1px solid ${theme.palette.divider}`,
            px: 1,
          }}
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
              "& .MuiSelect-select": { padding: "4px 8px" },
            }}
          >
            <MenuItem value="Group">Group</MenuItem>
            <MenuItem value="Personal">Personal</MenuItem>
          </Select>
        </Box>

        {/* --- PITCH VIEW --- */}
        <Box
          sx={{
            borderRadius: "20px",
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            p: 2,
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          {lineup?.length > 0 &&
            lineup
              .reduce((rows: any[][], { player }: any) => {
                const [row] = player.grid.split(":").map(Number);
                if (!rows[row]) rows[row] = [];
                rows[row].push(player);
                return rows;
              }, [])
              .reverse()
              .map((rowPlayers, rowIndex) => (
                <Box
                  key={`row-${rowIndex}`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    width: "100%",
                  }}
                >
                  {rowPlayers.map((player: any) => {
                    const stats = matchRatings?.[player.id];
                    const playerRating =
                      ratingSrc === "Group"
                        ? stats?.totalRating && stats?.totalSubmits
                          ? stats.totalRating / stats.totalSubmits
                          : null
                        : (usersMatchPlayerRatings?.[player.id] ?? null);

                    return (
                      <RatingLineupPlayer
                        key={player.id}
                        player={player}
                        playerRating={
                          playerRating ? playerRating.toFixed(1) : "—"
                        }
                      />
                    );
                  })}
                </Box>
              ))}
        </Box>

        {/* --- SUBS VIEW --- */}
        <Box sx={{ mt: 4, px: 2 }}>
          <Typography
            variant="overline"
            align="center"
            display="block"
            sx={{ fontWeight: 800, color: "text.secondary", mb: 2 }}
          >
            Substitutes
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {substitutedPlayerIds?.map((player: any) => {
              const stats = matchRatings?.[player.id];
              const playerRating =
                ratingSrc === "Group"
                  ? stats?.totalRating && stats?.totalSubmits
                    ? stats.totalRating / stats.totalSubmits
                    : null
                  : (usersMatchPlayerRatings?.[player.id] ?? null);

              return (
                <RatingLineupPlayer
                  key={player.id}
                  player={player}
                  playerRating={playerRating ? playerRating.toFixed(1) : "—"}
                />
              );
            })}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
