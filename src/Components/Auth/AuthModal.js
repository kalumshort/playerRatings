import React from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Fade,
  Backdrop,
} from "@mui/material";
import { Close, PersonAdd } from "@mui/icons-material";
import Login from "./Login";

export default function AuthModal({ open, handleClose }) {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: { timeout: 500, sx: { backdropFilter: "blur(8px)" } },
      }}
    >
      <Fade in={open}>
        {/* All content MUST be inside this single Box child */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 400 },

            backdropFilter: "blur(10px)", // Glassmorphism effect
            boxShadow: 24,
            p: 4,
            outline: "none",
            textAlign: "center",
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "text.secondary",
            }}
          >
            <Close />
          </IconButton>

          <PersonAdd color="primary" sx={{ fontSize: 48, mb: 2 }} />

          <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
            JOIN THE CONSENSUS
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
            Sign up to save your choices and see how your opinions compare to
            the rest of the fans.
          </Typography>

          {/* Move Login inside the Box. 
             Ensure Login component doesn't have its own Modal wrapper inside it.
          */}
          <Login />
        </Box>
      </Fade>
    </Modal>
  );
}
