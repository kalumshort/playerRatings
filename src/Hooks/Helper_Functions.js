import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

export const CountdownTimer = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTime));
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [targetTime]);

  if (!timeLeft) {
    return <Typography variant="subtitle1">Match has started!</Typography>;
  }

  const { days, hours, minutes, seconds } = timeLeft;

  const displayParts = [];
  if (days) displayParts.push(`${days}d`);
  if (hours) displayParts.push(`${hours}h`);
  if (minutes) displayParts.push(`${minutes}m`);
  if (seconds || displayParts.length === 0) displayParts.push(`${seconds}s`);

  return (
    <div className="countdownContianer">
      <div className="countdownInterval">
        <span className="gradient-text">{days}</span>
        <span className="countdownIntervalSmall">Days</span>
      </div>
      <div className="countdownInterval">
        <span className="gradient-text">{hours}</span>
        <span className="countdownIntervalSmall">Hrs</span>
      </div>
      <div className="countdownInterval">
        <span className="gradient-text">{minutes}</span>
        <span className="countdownIntervalSmall">Mins</span>
      </div>
      <div className="countdownInterval">
        <span className="gradient-text">{seconds}</span>
        <span className="countdownIntervalSmall">Secs</span>
      </div>
    </div>
  );
};

export const calculateTimeLeft = (targetTime) => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const diff = targetTime - now;

  if (diff <= 0) return null;

  const days = Math.floor(diff / (24 * 60 * 60))
    .toString()
    .padStart(2, "0");
  const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60))
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((diff % (60 * 60)) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (diff % 60).toString().padStart(2, "0");

  return { days, hours, minutes, seconds };
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};
