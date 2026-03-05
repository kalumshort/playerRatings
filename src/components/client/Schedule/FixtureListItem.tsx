"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { styled, keyframes, useTheme, alpha } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import { RootState } from "@/lib/redux/store";
import { useParams } from "next/navigation";

// --- ANIMATIONS ---
const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.5; }
`;

// --- STYLED COMPONENTS ---

const ItemContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "statusColor" && prop !== "active",
})<{ statusColor: string; active?: boolean }>(
  ({ theme, statusColor, active }) => ({
    backgroundColor: theme.palette.background.paper,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    margin: "8px 0",
    borderRadius: "16px",
    borderLeft: `6px solid ${statusColor}`,
    border: active
      ? `1px solid ${statusColor}`
      : `1px solid ${theme.palette.divider}`,
    transition: "all 0.2s ease-in-out",
    cursor: "pointer",
    overflow: "hidden",
    boxShadow: active ? `0 4px 12px ${alpha(statusColor, 0.2)}` : "none",
    "&:hover": {
      backgroundColor: alpha(theme.palette.action.hover, 0.04),
      transform: "translateX(4px)",
    },
    [theme.breakpoints.down("sm")]: {
      padding: "10px 12px",
    },
  }),
);

const TeamBox = styled(Box)<{ align?: "left" | "right" }>(
  ({ theme, align }) => ({
    display: "flex",
    alignItems: "center",
    flex: 1,
    gap: "12px",
    flexDirection: align === "right" ? "row-reverse" : "row",
    minWidth: 0,
    [theme.breakpoints.down("sm")]: {
      gap: "8px",
    },
  }),
);

const TeamName = styled(Typography)(({ theme }) => ({
  fontSize: "0.85rem",
  fontWeight: 700,
  color: theme.palette.text.primary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.75rem",
  },
}));

const Logo = styled("img")(({ theme }) => ({
  width: "32px",
  height: "32px",
  objectFit: "contain",
  [theme.breakpoints.down("sm")]: {
    width: "24px",
    height: "24px",
  },
}));

const CenterInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "90px",
  flexShrink: 0,
});

const ScoreText = styled(Box, {
  // This tells MUI not to forward the $isLive prop to the DOM
  shouldForwardProp: (prop) => prop !== "$isLive",
})<{ $isLive?: boolean }>(({ theme, $isLive }) => ({
  fontSize: "1.2rem",
  fontWeight: 900,
  color: $isLive ? theme.palette.primary.main : theme.palette.text.primary,
  lineHeight: 1,
}));

const LiveBadge = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  backgroundColor: alpha(theme.palette.error.main, 0.1),
  padding: "2px 6px",
  borderRadius: "4px",
  marginTop: "4px",
}));

const LiveDot = styled("span")(({ theme }) => ({
  width: "6px",
  height: "6px",
  backgroundColor: theme.palette.error.main,
  borderRadius: "50%",
  animation: `${pulse} 1.5s ease-in-out infinite`,
}));

// --- COMPONENT ---

export default function FixtureListItem({
  fixture,
  handleFixtureClick,
  highlight = false,
}: any) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);

  // Get active club ID from your new Redux Store
  const activeGroupId = useSelector(
    (state: RootState) => state.groupData.activeGroupId,
  );
  const activeGroup = useSelector((state: RootState) =>
    activeGroupId ? state.groupData.byGroupId[activeGroupId] : null,
  );
  const groupClubId = Number(activeGroup?.groupClubId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const status = fixture.fixture.status.short;
  const isPending = ["NS", "TBD", "PST"].includes(status);
  const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(status);
  const isFinished = ["FT", "AET", "PEN"].includes(status);

  const formattedDate = useMemo(() => {
    if (!fixture.fixture.timestamp) return { dayMonth: "", time: "" };
    const date = new Date(fixture.fixture.timestamp * 1000);
    return {
      dayMonth: `${date.getDate()}/${date.getMonth() + 1}`,
      time: date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };
  }, [fixture.fixture.timestamp]);

  const statusColor = useMemo(() => {
    if (isPending) return theme.palette.divider;
    if (isLive) return theme.palette.primary.main;

    const isHome = fixture.teams.home.id === groupClubId;
    const teamWon = isHome
      ? fixture.teams.home.winner
      : fixture.teams.away.winner;
    const isDraw =
      fixture.teams.home.winner === null && fixture.teams.away.winner === null;

    if (isDraw) return theme.palette.warning.main;
    return teamWon ? theme.palette.success.main : theme.palette.error.main;
  }, [fixture, groupClubId, isPending, isLive, theme]);

  // Prevent server-side timestamp mismatch
  if (!mounted) return null;

  return (
    <ItemContainer
      statusColor={statusColor}
      active={highlight}
      onClick={() => handleFixtureClick(fixture.fixture.id)}
    >
      <TeamBox align="left">
        <Logo src={fixture.teams.home.logo} alt="home" />
        <TeamName>{fixture.teams.home.name}</TeamName>
      </TeamBox>

      <CenterInfo>
        {isPending ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "primary.main",
              }}
            >
              {formattedDate.dayMonth}
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>
              {formattedDate.time}
            </Typography>
          </Box>
        ) : (
          <>
            <ScoreText $isLive={isLive}>
              {fixture.goals.home} - {fixture.goals.away}
            </ScoreText>
            {isLive && (
              <LiveBadge>
                <LiveDot />
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 900,
                    color: "error.main",
                  }}
                >
                  {fixture.fixture.status.elapsed}'
                </Typography>
              </LiveBadge>
            )}
            {isFinished && (
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  opacity: 0.6,
                  fontWeight: 700,
                  mt: 0.5,
                }}
              >
                FT
              </Typography>
            )}
          </>
        )}
      </CenterInfo>

      <TeamBox align="right">
        <Logo src={fixture.teams.away.logo} alt="away" />
        <TeamName>{fixture.teams.away.name}</TeamName>
      </TeamBox>
    </ItemContainer>
  );
}
