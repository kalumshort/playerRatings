import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";

const CountdownTimer = ({ targetTime }) => {
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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <span className="fixture-countdown-title">Match starts in</span>
      <span className="fixture-countdown">{displayParts.join(" ")}</span>
    </div>
  );
};

// Helper function to calculate time left
const calculateTimeLeft = (targetTime) => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const diff = targetTime - now;

  if (diff <= 0) return null;

  const days = Math.floor(diff / (24 * 60 * 60));
  const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((diff % (60 * 60)) / 60);
  const seconds = diff % 60;

  return { days, hours, minutes, seconds };
};

export default CountdownTimer;
