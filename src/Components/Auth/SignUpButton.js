import React, { useState } from "react";
import { Button, Box } from "@mui/material";
import { UserPlus } from "lucide-react";
import AuthModal from "./AuthModal";
import { useParams } from "react-router-dom";
import { slugToClub } from "../../Hooks/Helper_Functions";

const SignUpButton = () => {
  const [open, setOpen] = useState(false);
  const { clubSlug } = useParams();

  const clubConfig = slugToClub[clubSlug];
  const groupId = clubConfig?.teamId ? Number(clubConfig.teamId) : null;

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center", // Horizontal centering
        alignItems: "center", // Vertical centering

        width: "100%",
      }}
    >
      <Button
        variant="contained"
        onClick={handleOpen}
        startIcon={<UserPlus size={18} />}
        sx={{
          // 11Votes Glassmorphism Styling
          background: "rgba(127, 216, 128, 0.2)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "primary.main",
          padding: "12px 32px",
          fontSize: "1.1rem",
          fontWeight: "bold",
          borderRadius: "12px",
          "&:hover": {
            background: "rgba(127, 216, 128, 0.3)",
            transform: "scale(1.05)", // Subtle pop effect
            boxShadow: "0 0 20px rgba(127, 216, 128, 0.3)",
          },
        }}
      >
        Join This Club
      </Button>

      <AuthModal open={open} handleClose={handleClose} groupId={groupId} />
    </Box>
  );
};

export default SignUpButton;
