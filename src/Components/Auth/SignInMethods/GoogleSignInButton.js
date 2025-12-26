import React from "react";
import { Button, Box } from "@mui/material";

import GoogleIcon from "@mui/icons-material/Google";

import { handleCreateAccountGoogle } from "../../../Firebase/Auth_Functions";
import { useNavigate } from "react-router-dom";

const GoogleSignInButton = ({ groupId, text = "Sign In with Google" }) => {
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

          textTransform: "none",
        }}
        fullWidth
      >
        <GoogleIcon sx={{ marginRight: 1 }} />
        {text}
      </Button>
    </Box>
  );
};

export default GoogleSignInButton;
