import React, { useState } from "react";

import Lottie from "react-lottie";
import animationData from "../assets/animations/football-loader.json"; // Import the Lottie JSON data
import whiteLogo from "../assets/logo/11votes-nobg-clear-white.png";

import { ChromePicker } from "react-color";
import { Box, Button, Popover } from "@mui/material";

export function Spinner({ text }) {
  const defaultOptions = {
    loop: true,
    autoplay: true, // Animation will autoplay
    animationData: animationData, // Provide the animation JSON data
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice", // Make sure the animation fits the container
    },
  };

  return (
    <div className="spinner-container">
      <Lottie options={defaultOptions} height={200} width={100} />
      <img
        src={whiteLogo}
        alt="11Votes Logo"
        style={{ height: "50px", position: "absolute", bottom: "15px" }}
      />
      {text && <p style={{ color: "white" }}>{text}</p>}
    </div>
  );
}

export function ColorPicker({ value, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <Button onClick={handleClick} />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left", // This ensures it opens to the bottom-left
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <ChromePicker color={value} onChange={(color) => onChange(color.hex)} />
      </Popover>
    </Box>
  );
}
