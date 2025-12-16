import React, { useMemo } from "react";
import { styled, keyframes, useTheme } from "@mui/material/styles";
import useGroupData from "../../Hooks/useGroupsData";

// --- STYLED COMPONENTS ---

const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
`;

const ItemContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "statusColor" && prop !== "active",
})(({ theme, statusColor }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px", // Remove vertical padding, rely on height
  height: "50px", // Fixed minimal height
  backgroundColor: "transparent", // Explicitly transparent

  borderBottom: `1px solid ${theme.palette.divider}`,
  borderLeft: `4px solid ${statusColor}`, // The only color indicator

  cursor: "pointer",

  // Optional: subtle text color shift on hover instead of background
  "&:hover .team-name": {
    color: theme.palette.text.primary,
  },
}));

const TeamBox = styled("div")(({ align }) => ({
  display: "flex",
  alignItems: "center",
  flex: 1,
  gap: "10px", // Slightly more breathing room
  flexDirection: align === "right" ? "row-reverse" : "row",
  overflow: "hidden",
}));

const TeamName = styled("span", {
  shouldForwardProp: (prop) => prop !== "isMyTeam",
})(({ theme, isMyTeam }) => ({
  className: "team-name", // For hover targeting
  fontSize: "0.85rem",
  fontWeight: isMyTeam ? 700 : 400,
  color: isMyTeam ? theme.palette.text.primary : theme.palette.text.secondary,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "110px",
  transition: "color 0.2s ease",
}));

const Logo = styled("img")({
  width: "24px",
  height: "24px",
  objectFit: "contain",
});

const CenterInfo = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "60px",
  flexShrink: 0,
});

const ScoreText = styled("div", {
  shouldForwardProp: (prop) => prop !== "isLive",
})(({ theme, isLive }) => ({
  fontSize: "1rem",
  fontWeight: 800,
  color: isLive ? theme.palette.error.main : theme.palette.text.primary,
  lineHeight: 1,
  marginBottom: "2px",
}));

const PendingTimeText = styled("div")(({ theme }) => ({
  fontSize: "0.85rem",
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

// This uses the pulseAnimation now
const LiveStatusContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: theme.palette.error.main,
}));

const LiveDot = styled("span")(({ theme }) => ({
  width: "6px",
  height: "6px",
  backgroundColor: theme.palette.error.main,
  borderRadius: "50%",
  display: "block",
  animation: `${pulseAnimation} 1.5s infinite`, // Animation applied here
}));

const MetaText = styled("span")(({ theme }) => ({
  fontSize: "0.65rem",
  color: theme.palette.error.main,
  fontWeight: 700,
}));

const FinishedText = styled("span")(({ theme }) => ({
  fontSize: "0.65rem",
  color: theme.palette.text.secondary,
  textTransform: "uppercase",
  fontWeight: 600,
}));

// --- COMPONENT ---

export default function FixtureListItem({
  fixture,
  matchTime,
  handleFixtureClick,
  highlight = false,
}) {
  const theme = useTheme();
  const { activeGroup } = useGroupData();
  const groupClubId = Number(activeGroup.groupClubId);

  // 1. Determine State
  const statusShort = fixture.fixture.status.short;
  const isPending = ["NS", "TBD", "PST"].includes(statusShort);
  const isLive = ["1H", "2H", "HT", "ET", "P", "BT"].includes(statusShort);
  const isFinished = ["FT", "AET", "PEN"].includes(statusShort);

  // 2. Logic for Border Color
  const statusColor = useMemo(() => {
    if (isPending) return theme.palette.divider;
    if (isLive) return theme.palette.info.main;

    // Draw
    if (!fixture.teams.home.winner && !fixture.teams.away.winner) {
      return theme.palette.warning.main;
    }

    // Win/Loss check
    const homeWin = fixture.teams.home.winner;
    const isHome = fixture.teams.home.id === groupClubId;

    if ((isHome && homeWin) || (!isHome && !homeWin)) {
      return theme.palette.success.main;
    }

    return theme.palette.error.main;
  }, [fixture.teams, groupClubId, isPending, isLive, theme]);

  // 3. Render Center Content
  const renderCenter = () => {
    if (isPending) {
      return (
        <CenterInfo>
          <PendingTimeText>
            {matchTime.includes(":") ? matchTime.split(" ").pop() : matchTime}
          </PendingTimeText>
        </CenterInfo>
      );
    }

    return (
      <CenterInfo>
        <ScoreText isLive={isLive}>
          {fixture.goals.home} - {fixture.goals.away}
        </ScoreText>

        {isLive && (
          <LiveStatusContainer>
            <LiveDot />
            <MetaText>{fixture.fixture.status.elapsed}'</MetaText>
          </LiveStatusContainer>
        )}

        {isFinished && <FinishedText>FT</FinishedText>}
      </CenterInfo>
    );
  };

  return (
    <ItemContainer
      statusColor={statusColor}
      active={highlight}
      onClick={() => handleFixtureClick(fixture.id)}
    >
      {/* Home Team (Left) */}
      <TeamBox align="left">
        {fixture.teams.home.logo && (
          <Logo src={fixture.teams.home.logo} alt="home" />
        )}
        <TeamName isMyTeam={fixture.teams.home.id === groupClubId}>
          {fixture.teams.home.name}
        </TeamName>
      </TeamBox>

      {/* Center Score/Time */}
      {renderCenter()}

      {/* Away Team (Right) */}
      <TeamBox align="right">
        {fixture.teams.away.logo && (
          <Logo src={fixture.teams.away.logo} alt="away" />
        )}
        <TeamName isMyTeam={fixture.teams.away.id === groupClubId}>
          {fixture.teams.away.name}
        </TeamName>
      </TeamBox>
    </ItemContainer>
  );
}
