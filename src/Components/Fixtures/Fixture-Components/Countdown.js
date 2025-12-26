import React, { useState, useEffect } from "react";
import { Box, Typography, Stack, alpha } from "@mui/material";
import { styled } from "@mui/material/styles";

// --- STYLED COMPONENTS ---

const DigitBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "45px", // Compact for mobile
  padding: "4px",
  borderRadius: "8px",
  background: alpha(theme.palette.text.primary, 0.05),
  border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
  [theme.breakpoints.down("sm")]: {
    minWidth: "38px",
  },
}));

const DigitValue = styled(Typography)(({ theme }) => ({
  fontSize: "1.5rem",
  lineHeight: 1,
  color: theme.palette.text.primary,
  [theme.breakpoints.down("sm")]: {
    fontSize: "1.2rem",
  },
}));

const DigitLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.5rem",
  textTransform: "uppercase",
  fontWeight: 800,
  opacity: 0.6,
}));

const Separator = styled(Typography)(({ theme }) => ({
  fontSize: "1.2rem",
  opacity: 0.4,
  paddingBottom: "12px", // Visual alignment with digits
}));

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
// --- COMPONENT ---

export const CountdownTimer = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(targetTime);
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (!timeLeft) {
    return (
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: "0.75rem",
          color: "primary.main",
        }}
      >
        MATCH IN PROGRESS
      </Typography>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0.5} // Tighter spacing for mobile
    >
      {days > 0 && (
        <>
          <Digit value={days} label="Days" />
          <Separator>:</Separator>
        </>
      )}
      <Digit value={hours} label="Hrs" />
      <Separator>:</Separator>
      <Digit value={minutes} label="Min" />
      <Separator>:</Separator>
      <Digit value={seconds} label="Sec" />
    </Stack>
  );
};

// Internal Sub-component for cleaner layout
const Digit = ({ value, label }) => (
  <DigitBox>
    <DigitValue>{String(value).padStart(2, "0")}</DigitValue>
    <DigitLabel>{label}</DigitLabel>
  </DigitBox>
);
