import React from "react";
import { Button, Box } from "@mui/material";

import GoogleIcon from "@mui/icons-material/Google";

import { handleCreateAccountGoogle } from "../../../Firebase/Auth_Functions";
import { useNavigate } from "react-router-dom";

const GoogleSignInButton = ({ groupId }) => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      await handleCreateAccountGoogle({ groupId });
      navigate("/");
    } catch (error) {
      console.error("Error signing in with Google:", error.message);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", marginTop: 1 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleGoogleSignIn}
        sx={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#4285F4",
          color: "white",
          borderRadius: "8px",
          padding: "20px 30px",
          textTransform: "none",
        }}
        fullWidth
      >
        <GoogleIcon sx={{ marginRight: 1 }} />
        Sign In with Google
      </Button>
    </Box>
  );
};

export default GoogleSignInButton;
