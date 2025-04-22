import React, { useState } from "react";
import { Popover, IconButton, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

export default function MOTMPopover({ motmPercentages }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget); // Set the popover anchor
  };

  const handleClose = () => {
    setAnchorEl(null); // Close the popover
  };

  const open = Boolean(anchorEl); // Boolean for whether the popover is open
  const id = open ? "simple-popover" : undefined;

  return (
    <>
      <IconButton
        onClick={handleClick}
        style={{ position: "absolute", right: "5px", top: "5px" }}
      >
        <InfoIcon />
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom", // Popover appears below the button
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <ul
          style={{
            margin: "5px",
            color: "grey",
            display: "flex",
            flexDirection: "column",
            fontSize: "15px",
          }}
        >
          {motmPercentages?.map((player) => (
            <li>
              {player.name} - {player.percentage}%
            </li>
          ))}
        </ul>
      </Popover>
    </>
  );
}
