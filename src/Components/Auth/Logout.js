import React, { useState, useRef } from "react";
import { Button, Popper, Paper, Typography, Box } from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "../../Firebase/Firebase";

const Logout = () => {
  const [open, setOpen] = useState(false); // Controls the visibility of the Popper
  const anchorRef = useRef(null); // Reference for the anchor element (the text button)

  // Handle the confirmation popper
  const handleClick = () => {
    setOpen((prevOpen) => !prevOpen); // Toggle popper visibility
  };

  // Handle the logout process
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      setOpen(false); // Close the popper after logout
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  // Handle canceling the logout action
  const handleCancel = () => {
    setOpen(false); // Close the popper without logging out
  };

  return (
    <div>
      {/* Log out text button */}
      <Button
        ref={anchorRef}
        onClick={handleClick}
        variant="outlined"
        color="white"
      >
        Log Out
      </Button>

      {/* Popper with confirmation */}
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{
          zIndex: 1300, // Ensure the popper appears above the drawer
        }}
      >
        <Paper elevation={3} sx={{ padding: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to log out?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={handleLogout} color="white" variant="outlined">
              Yes
            </Button>
            <Button onClick={handleCancel} color="white" variant="outlined">
              No
            </Button>
          </Box>
        </Paper>
      </Popper>
    </div>
  );
};

export default Logout;
