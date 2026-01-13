import { styled } from "@mui/material";
import React, { createContext, useState, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

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
    slug: "arsenal",
    logo: "https://media.api-sports.io/football/teams/42.png",
    accent: "#EF0107",
  },
  {
    teamId: 746,
    name: "Sunderland",
    slug: "sunderland",
    logo: "https://media.api-sports.io/football/teams/746.png",
    accent: "#FF0000",
  },
  {
    teamId: 50,
    name: "Manchester City",
    slug: "man-city",
    logo: "https://media.api-sports.io/football/teams/50.png",
    accent: "#6CABDD",
  },
  {
    teamId: 33,
    name: "Manchester United",
    slug: "man-united",
    logo: "https://media.api-sports.io/football/teams/33.png",
    accent: "#DA291C",
  },
  {
    teamId: 35,
    name: "Bournemouth",
    slug: "bournemouth",
    logo: "https://media.api-sports.io/football/teams/35.png",
    accent: "#B50E12",
  },
  {
    teamId: 40,
    name: "Liverpool",
    slug: "liverpool",
    logo: "https://media.api-sports.io/football/teams/40.png",
    accent: "#C8102E",
  },
  {
    teamId: 47,
    name: "Tottenham",
    slug: "tottenham",
    logo: "https://media.api-sports.io/football/teams/47.png",
    accent: "#132257",
  },
  {
    teamId: 49,
    name: "Chelsea",
    slug: "chelsea",
    logo: "https://media.api-sports.io/football/teams/49.png",
    accent: "#034694",
  },
  {
    teamId: 52,
    name: "Crystal Palace",
    slug: "crystal-palace",
    logo: "https://media.api-sports.io/football/teams/52.png",
    accent: "#1B458F",
  },
  {
    teamId: 55,
    name: "Brentford",
    slug: "brentford",
    logo: "https://media.api-sports.io/football/teams/55.png",
    accent: "#E30613",
  },
  {
    teamId: 34,
    name: "Newcastle",
    slug: "newcastle",
    logo: "https://media.api-sports.io/football/teams/34.png",
    accent: "#241F20",
  },
  {
    teamId: 66,
    name: "Aston Villa",
    slug: "aston-villa",
    logo: "https://media.api-sports.io/football/teams/66.png",
    accent: "#670E36",
  },
  {
    teamId: 51,
    name: "Brighton",
    slug: "brighton",
    logo: "https://media.api-sports.io/football/teams/51.png",
    accent: "#0057B7",
  },
  {
    teamId: 45,
    name: "Everton",
    slug: "everton",
    logo: "https://media.api-sports.io/football/teams/45.png",
    accent: "#003399",
  },
  {
    teamId: 63,
    name: "Leeds",
    slug: "leeds",
    logo: "https://media.api-sports.io/football/teams/63.png",
    accent: "#FFCD00",
  },
  {
    teamId: 36,
    name: "Fulham",
    slug: "fulham",
    logo: "https://media.api-sports.io/football/teams/36.png",
    accent: "#FFFFFF",
  },
  {
    teamId: 44,
    name: "Burnley",
    slug: "burnley",
    logo: "https://media.api-sports.io/football/teams/44.png",
    accent: "#6C1D45",
  },
  {
    teamId: 65,
    name: "Nottingham Forest",
    slug: "nottingham-forest",
    logo: "https://media.api-sports.io/football/teams/65.png",
    accent: "#DD0000",
  },
  {
    teamId: 48,
    name: "West Ham",
    slug: "west-ham",
    logo: "https://media.api-sports.io/football/teams/48.png",
    accent: "#7A263A",
  },
  {
    teamId: 39,
    name: "Wolves",
    slug: "wolves",
    logo: "https://media.api-sports.io/football/teams/39.png",
    accent: "#FDB913",
  },
];

// Map for URL -> Data (SEO/Public view)
export const slugToClub = teamList.reduce((acc, team) => {
  acc[team.slug] = team;
  return acc;
}, {});

// Map for ID -> Data (Logged in user/Internal state)
export const idToClub = teamList.reduce((acc, team) => {
  acc[team.teamId] = team;
  return acc;
}, {});
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

export const useAppPaths = () => {
  const { clubSlug } = useParams(); // Priority 1: Current URL context

  // Access both the transient silo (activeGroup) and persistent home team (userHomeGroup)
  const { activeGroup, userHomeGroup } = useSelector(
    (state) => state.groupData
  );

  /**
   * Determine the current context slug.
   * Priority 1: The slug currently in the URL (browsing context).
   * Priority 2: The slug of the user's Home Group (persistent preference).
   * Priority 3: The transient activeGroup(backup context).
   */
  const currentSlug = clubSlug || userHomeGroup?.slug || activeGroup?.slug;

  /**
   * Generates a context-aware path string
   * @param {string} path - The internal route (e.g., "/schedule")
   */
  const getPath = (path) => {
    // 1. Define paths that should never be prepended with a club slug
    const globalPaths = ["/profile", "/global-select", "/"];

    // 2. If it's a global path, return it exactly as requested
    if (globalPaths.includes(path)) return path;

    // 3. Ensure the path starts with a leading slash for clean concatenation
    const formattedPath = path.startsWith("/") ? path : `/${path}`;

    // 4. Prepend the slug if available (e.g., "/man-utd/schedule"),
    // otherwise return the base path (e.g., "/schedule")
    return currentSlug ? `/${currentSlug}${formattedPath}` : formattedPath;
  };

  return { getPath, currentSlug };
};
