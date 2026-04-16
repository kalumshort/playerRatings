"use client";

import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Avatar,
  Box,
  MenuItem,
  Paper,
  Select,
  Stack,
  styled,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";

// --- CLEAN IMPORTS ---

import { RootState } from "@/lib/redux/store";
import FanMOTMHighlight from "./FanMOTMHighlight";
import {
  selectMatchMotmById,
  selectMatchRatingsById,
  selectMotmPercentages,
} from "@/lib/redux/selectors/ratingsSelectors";
import RatingLineupPlayer from "@/components/client/PlayerRatings/RatingLineupPlayer";

interface RatingLineupProps {
  fixture: any;
  usersMatchPlayerRatings?: Record<string, number>;
  motmPercentages?: any;
  groupClubId: number;
}

export default function RatingLineup({
  fixture,
  usersMatchPlayerRatings,

  groupClubId,
}: RatingLineupProps) {
  const theme = useTheme() as any;
  const [ratingSrc, setRatingSrc] = useState<"Group" | "Personal">("Group");

  // 1. DATA SELECTORS
  const matchRatings = useSelector((state: RootState) =>
    selectMatchRatingsById(fixture.id)(state),
  );

  // 2. LINEUP & SUBS PROCESSING
  const { starters, subs } = useMemo(() => {
    const teamData = fixture?.lineups?.find(
      (t: any) => t.team.id === groupClubId,
    );
    if (!teamData) return { starters: [], subs: [] };

    const startXI = teamData.startXI || [];
    const events = fixture?.events || [];

    // Find subs who actually played (incoming players in subst events)
    const playedSubs = events
      .filter((e: any) => e.type === "subst" && e.team.id === groupClubId)
      .map((e: any) => e.assist);

    return { starters: startXI, subs: playedSubs };
  }, [fixture]);

  // 3. RATING RESOLVER
  const getRating = (playerId: string | number) => {
    const pId = String(playerId);
    if (ratingSrc === "Personal") return usersMatchPlayerRatings?.[pId] || null;

    const stats = matchRatings?.find((r: any) => r.id === pId);
    return stats ? stats.totalRating / stats.totalSubmits : null;
  };

  if (starters.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        ...theme.clay?.card,
        p: 0,
        overflow: "hidden",
        borderRadius: "28px",
        background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
      }}
    >
      <FanMOTMHighlight fixtureId={fixture.id} />

      <Box sx={{ p: 2, position: "relative" }}>
        {/* SOURCE SELECTOR */}
        <Box sx={{ position: "absolute", top: 15, right: 15, zIndex: 10 }}>
          <Box
            sx={{
              ...theme.clay?.box,
              borderRadius: "12px",
              px: 1.5,
              py: 0.5,
              bgcolor: "background.paper",
            }}
          >
            <Select
              value={ratingSrc}
              onChange={(e) => setRatingSrc(e.target.value as any)}
              size="small"
              variant="standard"
              disableUnderline
              sx={{
                fontSize: "0.75rem",
                fontWeight: 900,
                color: "primary.main",
              }}
            >
              <MenuItem value="Group" sx={{ fontWeight: 700 }}>
                STADIUM AVG
              </MenuItem>
              <MenuItem value="Personal" sx={{ fontWeight: 700 }}>
                MY RATINGS
              </MenuItem>
            </Select>
          </Box>
        </Box>

        {/* PITCH VIEW */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, py: 4 }}>
          {/* Group players by Row (Grid 1:X, 2:X etc) */}
          {Object.values(
            starters.reduce((acc: any, { player }: any) => {
              const row = player.grid.split(":")[0];
              if (!acc[row]) acc[row] = [];
              acc[row].push(player);
              return acc;
            }, {}),
          )
            .reverse()
            .map((rowPlayers: any, idx) => (
              <Stack
                key={idx}
                direction="row"
                justifyContent="space-around"
                alignItems="center"
              >
                {rowPlayers.map((p: any) => (
                  <RatingLineupPlayer
                    key={p.id}
                    player={p}
                    playerRating={getRating(p.id)}
                  />
                ))}
              </Stack>
            ))}
        </Box>

        {/* SUBS SECTION */}
        {subs.length > 0 && (
          <Box
            sx={{
              mt: 4,
              pb: 4,
              borderTop: `1px solid ${theme.palette.divider}`,
              pt: 3,
            }}
          >
            <Typography
              variant="overline"
              align="center"
              display="block"
              sx={{ fontWeight: 900, opacity: 0.5, mb: 3 }}
            >
              Impact Substitutes
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {subs.map((p: any) => (
                <RatingLineupPlayer
                  key={p.id}
                  player={p}
                  playerRating={getRating(p.id)}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

// --- SUB-COMPONENT ---

const ScoreBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  bottom: -2,
  right: -5,
  backgroundColor: theme.palette.primary.main,
  color: "white",
  padding: "2px 6px",
  borderRadius: "8px",
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  zIndex: 10,
  minWidth: "28px",
  textAlign: "center",
}));

// const RatingLineupPlayer = React.memo(({ player, rating }: any) => {
//   const theme = useTheme() as any;
//   const displayRating = rating ? rating.toFixed(1) : "—";

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         width: 75,
//         transition: "transform 0.2s ease",
//         "&:hover": { transform: "translateY(-5px)", zIndex: 5 },
//       }}
//     >
//       <Box sx={{ position: "relative", width: 75, height: 75 }}>
//         <Avatar
//           src={
//             player.photo ||
//             `https://media.api-sports.io/football/players/${player.id}.png`
//           }
//           sx={{
//             width: "100%",
//             height: "100%",
//             border: `3px solid white`,
//             boxShadow: theme.clay?.card?.boxShadow,
//             bgcolor: "grey.800",
//           }}
//         />
//         <ScoreBadge>
//           <Typography
//             variant="caption"
//             sx={{ fontWeight: 900, fontSize: "0.7rem" }}
//           >
//             {displayRating}
//           </Typography>
//         </ScoreBadge>
//       </Box>
//       <Typography
//         variant="caption"
//         noWrap
//         sx={{
//           mt: 1.5,
//           fontWeight: 800,
//           fontSize: "0.65rem",
//           textAlign: "center",
//           width: "100%",
//           color: "text.primary",
//         }}
//       >
//         {player.name.split(" ").pop()?.toUpperCase()}
//       </Typography>
//     </Box>
//   );
// });
