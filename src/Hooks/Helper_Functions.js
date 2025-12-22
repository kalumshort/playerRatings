import { Stack, styled, Typography } from "@mui/material";
import React, { createContext, useState, useContext, useEffect } from "react";

const calculateTimeLeft = (targetTime) => {
  const difference = +new Date(targetTime * 1000) - +new Date();
  let timeLeft = null;

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return timeLeft;
};

export const CountdownTimer = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  if (!timeLeft) {
    return (
      <Typography variant="caption" color="primary" sx={{ fontWeight: "bold" }}>
        MATCH HAS STARTED!
      </Typography>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={{ xs: 1, md: 2 }}
    >
      <TimeUnit value={days} label="Days" />
      <TimeSeparator />
      <TimeUnit value={hours} label="Hrs" />
      <TimeSeparator />
      <TimeUnit value={minutes} label="Mins" />
      <TimeSeparator />
      <TimeUnit value={seconds} label="Secs" />
    </Stack>
  );
};

// Internal Sub-components for clean horizontal layout
const TimeUnit = ({ value, label }) => (
  <Stack alignItems="center">
    <Typography
      variant="h5"
      sx={{
        lineHeight: 1,
        minWidth: "1.5em",
        textAlign: "center",
      }}
    >
      {String(value).padStart(2, "0")}
    </Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        fontSize: "0.6rem",
        textTransform: "uppercase",
        opacity: 0.8,
      }}
    >
      {label}
    </Typography>
  </Stack>
);

const TimeSeparator = () => (
  <Typography
    variant="h5"
    sx={{
      opacity: 0.3,
      pb: 1.5, // Offset to align with the center of the numbers
    }}
  >
    :
  </Typography>
);

export const generateCustomId = (string) => {
  const sanitizedGroupName = string
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-") // Replace non-alphanumeric characters with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single one
    .substring(0, 30); // Optionally limit length (Firestore has a 1500 character limit)

  const randomString = Math.random().toString(36).substring(2, 7);

  const customId = `${sanitizedGroupName}-${randomString}`;

  return customId;
};
export const useLocalStorage = (key) => {
  const [value, setValue] = useState(localStorage.getItem(key));

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        setValue(e.newValue);
      }
    };

    // Add event listener for "storage" changes
    window.addEventListener("storage", handleStorageChange);

    // Add custom event listener for single-tab updates
    const handleCustomEvent = (e) => {
      if (e.detail.key === key) {
        setValue(e.detail.value);
      }
    };
    window.addEventListener("localStorageChange", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("localStorageChange", handleCustomEvent);
    };
  }, [key]);

  return value;
};

// Wrapper function for updating localStorage and emitting events
export const setLocalStorageItem = (key, value) => {
  localStorage.setItem(key, value);
  const event = new CustomEvent("localStorageChange", {
    detail: { key, value },
  });
  window.dispatchEvent(event);
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 450);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 450);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

export const footballClubsColours = {
  33: "#DA291C", // Manchester United
  40: "#C8102E", // Liverpool
  50: "#6CABDD", // Manchester City
  42: "#EF0107", // Arsenal
  65: "#DD0000", // Nottingham Forest
  34: "#241F20", // Newcastle
  49: "#034694", // Chelsea
  35: "#DA291C", // Bournemouth
  66: "#660033", // Aston Villa
  36: "#FFFFFF", // Fulham
  51: "#005DAA", // Brighton
  55: "#D20000", // Brentford
  52: "#1B458F", // Crystal Palace
  48: "#7C2C3B", // West Ham
  47: "#132257", // Tottenham
  45: "#003399", // Everton
  39: "#FDB913", // Wolves
  57: "#1C3473", // Ipswich
  46: "#0053A0", // Leicester
  41: "#D71920", // Southampton
  746: "#E03A3E", // Sunderland
  44: "#6C1D45", // Burnley
  63: "#FFCD00", // Leeds United
};
// 4. SOLID RATING BADGE (High Contrast)
export const RatingBadge = styled("div")(({ score, theme }) => {
  // Determine color class
  let bgColor = theme.palette.grey[800]; // Default
  if (score >= 8.0) bgColor = "#1b5e5aff"; // Deep Green
  else if (score >= 7.0) bgColor = "#2e7d32"; // Green
  else if (score >= 6.0) bgColor = "#ed6c02"; // Orange
  else if (score > 0) bgColor = "#d32f2f"; // Red

  return {
    backgroundColor: bgColor,
    color: "#fff",
    padding: "6px 0",
    width: "48px",
    borderRadius: "6px",
    fontWeight: 800,
    fontSize: "1rem",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  };
});

/**
 * Extracts all relevant events for a specific player from a fixture.
 * Returns an array of objects: { type, label, time }
 */
export const getPlayersFixtureEvents = (fixture, playerId) => {
  if (!fixture || !fixture.events || !playerId) return [];

  const pId = Number(playerId);
  const events = [];

  fixture.events.forEach((event) => {
    console.log(event);
    const eventTime =
      event.time.elapsed +
      (event.time.extra ? `+${event.time.extra}` : "") +
      "'";

    // 1. GOALS & PENALTIES
    if (event.type === "Goal") {
      if (event.player.id === pId) {
        if (event.detail === "Penalty") {
          events.push({
            type: "penalty",
            label: "Penalty Scored",
            time: eventTime,
          });
        } else if (event.detail !== "Missed Penalty") {
          events.push({ type: "goal", label: "Goal", time: eventTime });
        }
      }
      // ASSISTS
      if (event.assist.id === pId && event.player.id !== pId) {
        events.push({
          type: "assist",
          label: `Assist (to ${event.player.name})`,
          time: eventTime,
        });
      }
    }

    // 2. CARDS
    if (event.type === "Card" && event.player.id === pId) {
      if (event.detail === "Yellow Card") {
        events.push({ type: "yellow", label: "Yellow Card", time: eventTime });
      } else if (event.detail === "Red Card") {
        events.push({ type: "red", label: "Red Card", time: eventTime });
      }
    }

    // 3. SUBSTITUTIONS
    if (event.type === "subst") {
      if (event.player.id === pId) {
        events.push({ type: "subOut", label: "Subbed Out", time: eventTime });
      }
      if (event.assist.id === pId) {
        events.push({ type: "subIn", label: "Subbed In", time: eventTime });
      }
    }
  });

  return events;
};
export const teamList = [
  {
    teamId: 42,
    name: "Arsenal",
    logo: "https://media.api-sports.io/football/teams/42.png",
  },
  {
    teamId: 746,
    name: "Sunderland",
    logo: "https://media.api-sports.io/football/teams/746.png",
  },
  {
    teamId: 50,
    name: "Manchester City",
    logo: "https://media.api-sports.io/football/teams/50.png",
  },
  {
    teamId: 33,
    name: "Manchester United",
    logo: "https://media.api-sports.io/football/teams/33.png",
  },
  {
    teamId: 35,
    name: "Bournemouth",
    logo: "https://media.api-sports.io/football/teams/35.png",
  },
  {
    teamId: 40,
    name: "Liverpool",
    logo: "https://media.api-sports.io/football/teams/40.png",
  },
  {
    teamId: 47,
    name: "Tottenham",
    logo: "https://media.api-sports.io/football/teams/47.png",
  },
  {
    teamId: 49,
    name: "Chelsea",
    logo: "https://media.api-sports.io/football/teams/49.png",
  },
  {
    teamId: 52,
    name: "Crystal Palace",
    logo: "https://media.api-sports.io/football/teams/52.png",
  },
  {
    teamId: 55,
    name: "Brentford",
    logo: "https://media.api-sports.io/football/teams/55.png",
  },
  {
    teamId: 34,
    name: "Newcastle",
    logo: "https://media.api-sports.io/football/teams/34.png",
  },
  {
    teamId: 66,
    name: "Aston Villa",
    logo: "https://media.api-sports.io/football/teams/66.png",
  },
  {
    teamId: 51,
    name: "Brighton",
    logo: "https://media.api-sports.io/football/teams/51.png",
  },
  {
    teamId: 45,
    name: "Everton",
    logo: "https://media.api-sports.io/football/teams/45.png",
  },
  {
    teamId: 63,
    name: "Leeds",
    logo: "https://media.api-sports.io/football/teams/63.png",
  },
  {
    teamId: 36,
    name: "Fulham",
    logo: "https://media.api-sports.io/football/teams/36.png",
  },
  {
    teamId: 44,
    name: "Burnley",
    logo: "https://media.api-sports.io/football/teams/44.png",
  },
  {
    teamId: 65,
    name: "Nottingham Forest",
    logo: "https://media.api-sports.io/football/teams/65.png",
  },
  {
    teamId: 48,
    name: "West Ham",
    logo: "https://media.api-sports.io/football/teams/48.png",
  },
  {
    teamId: 39,
    name: "Wolves",
    logo: "https://media.api-sports.io/football/teams/39.png",
  },
];

export const blendColors = (color1, color2, weight) => {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r = Math.round((c1 >> 16) * (1 - weight) + (c2 >> 16) * weight);
  const g = Math.round(
    ((c1 >> 8) & 0xff) * (1 - weight) + ((c2 >> 8) & 0xff) * weight
  );
  const b = Math.round((c1 & 0xff) * (1 - weight) + (c2 & 0xff) * weight);

  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

export const getRatingClass = (rating) => {
  if (rating < 4) return "ratingPoor";
  if (rating < 6) return "ratingAverage";
  if (rating < 8) return "ratingGood";
  return "ratingGreat";
};
export const getRatingLineupClass = (rating) => {
  if (rating < 4) return "ratingLineupPoor";
  if (rating < 6) return "ratingLineupAverage";
  if (rating < 8) return "ratingLineupGood";
  return "ratingLineupGreat";
};

export const missingPlayerImg =
  "https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png";

const DragContext = createContext();

export const useDrag = () => useContext(DragContext);

export const DragProvider = ({ children }) => {
  const [isAnyItemDragging, setIsAnyItemDragging] = useState(false);

  return (
    <DragContext.Provider value={{ isAnyItemDragging, setIsAnyItemDragging }}>
      {children}
    </DragContext.Provider>
  );
};
