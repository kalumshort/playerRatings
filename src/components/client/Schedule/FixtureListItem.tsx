"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { keyframes, useTheme } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import { RootState } from "@/lib/redux/store";
import { format } from "date-fns";

const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.6; }
`;

export default function FixtureListItem({ fixture, handleFixtureClick, highlight = false }: any) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  const activeGroupId = useSelector((state: RootState) => state.groupData.activeGroupId);
  const activeGroup = useSelector((state: RootState) =>
    activeGroupId ? state.groupData.byGroupId[activeGroupId] : null,
  );
  const groupClubId = Number(activeGroup?.groupClubId);

  useEffect(() => { setMounted(true); }, []);

  const status = fixture.fixture.status.short;
  const isPending = ["NS", "TBD", "PST"].includes(status);
  const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status);

  const { result, resultColor } = useMemo(() => {
    if (!isFinished) return { result: null, resultColor: theme.palette.text.secondary };
    const isHome = fixture.teams.home.id === groupClubId;
    const homeWin = fixture.teams.home.winner;
    const awayWin = fixture.teams.away.winner;
    const isDraw = homeWin === null && awayWin === null;
    if (isDraw) return { result: "D", resultColor: theme.palette.warning.main };
    const won = (isHome && homeWin) || (!isHome && awayWin);
    return won
      ? { result: "W", resultColor: theme.palette.success.main }
      : { result: "L", resultColor: theme.palette.error.main };
  }, [fixture, groupClubId, isFinished, theme]);

  const formattedDate = useMemo(() => {
    if (!fixture.fixture.timestamp) return { dayMonth: "", time: "" };
    const date = new Date(fixture.fixture.timestamp * 1000);
    return {
      dayMonth: format(date, "EEE d MMM"),
      time: format(date, "HH:mm"),
    };
  }, [fixture.fixture.timestamp]);

  if (!mounted) return null;

  return (
    <Box
      onClick={() => handleFixtureClick(fixture.fixture.id)}
      sx={(t) => ({
        ...t.clay.card,
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(0.2, 0, 0, 1)",
        ...(highlight && {
          outline: `2px solid ${t.palette.primary.main}`,
          outlineOffset: "2px",
        }),
        "&:hover": { transform: "translateY(-2px)" },
        "&:active": { transform: "scale(0.98)" },
      })}
    >
      {/* Top row: league info + status/result */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pt: 1.5,
          pb: 0.75,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {fixture.league?.logo && (
            <Box
              component="img"
              src={fixture.league.logo}
              alt=""
              sx={{ width: 14, height: 14, objectFit: "contain", opacity: 0.65 }}
            />
          )}
          <Typography
            sx={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "text.secondary",
              opacity: 0.65,
              letterSpacing: 0.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 160,
            }}
          >
            {fixture.league?.name}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          {isLive && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: "error.main",
                  animation: `${pulse} 1.5s ease-in-out infinite`,
                }}
              />
              <Typography sx={{ fontSize: "0.6rem", fontWeight: 900, color: "error.main" }}>
                {fixture.fixture.status.elapsed}&apos;
              </Typography>
            </Box>
          )}
          {isFinished && result && (
            <Typography
              sx={{
                fontSize: "0.6rem",
                fontWeight: 900,
                color: resultColor,
                bgcolor: `${resultColor}22`,
                px: 0.9,
                py: 0.3,
                borderRadius: "6px",
                letterSpacing: 0.5,
              }}
            >
              {result}
            </Typography>
          )}
          {isPending && (
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "text.secondary",
                opacity: 0.65,
              }}
            >
              {formattedDate.dayMonth}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Main row: home | score/time | away */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          pb: 1.75,
          gap: 1,
        }}
      >
        {/* Home team */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}>
          <Box
            component="img"
            src={fixture.teams.home.logo}
            alt={fixture.teams.home.name}
            sx={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.85rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fixture.teams.home.name}
          </Typography>
        </Box>

        {/* Score / Time */}
        <Box
          sx={(t) => ({
            ...t.clay.box,
            flexShrink: 0,
            textAlign: "center",
            minWidth: 72,
            px: 1.5,
            py: 1,
            borderRadius: "14px",
          })}
        >
          {isPending ? (
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: "1rem",
                color: "text.secondary",
                lineHeight: 1,
              }}
            >
              {formattedDate.time}
            </Typography>
          ) : (
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: "1.1rem",
                color: isLive ? "primary.main" : "text.primary",
                letterSpacing: 1,
                lineHeight: 1,
              }}
            >
              {fixture.goals.home} – {fixture.goals.away}
            </Typography>
          )}
          {isFinished && (
            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 700,
                color: "text.secondary",
                opacity: 0.45,
                letterSpacing: 1,
                mt: 0.5,
              }}
            >
              FULL TIME
            </Typography>
          )}
        </Box>

        {/* Away team */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
            minWidth: 0,
            justifyContent: "flex-end",
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.85rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "right",
            }}
          >
            {fixture.teams.away.name}
          </Typography>
          <Box
            component="img"
            src={fixture.teams.away.logo}
            alt={fixture.teams.away.name}
            sx={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0 }}
          />
        </Box>
      </Box>
    </Box>
  );
}
