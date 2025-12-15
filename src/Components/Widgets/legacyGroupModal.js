import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress"; // Import Spinner
import { useAuth } from "../../Providers/AuthContext";
import { handleAddUserToGroup } from "../../Firebase/Auth_Functions";

const LegacyGroupModal = () => {
  const [open] = useState(true);
  const [loading, setLoading] = useState(false); // 1. Add loading state
  const { user } = useAuth();

  const handleJoinClick = async () => {
    if (loading) return; // Prevent double clicks
    setLoading(true); // Start loading

    try {
      // ⚠️ Use your actual imported API function here, not the local function name
      await handleAddUserToGroup({
        userData: user,
        groupId: "33",
      });

      // Optional: Close modal after success
      // setOpen(false);
    } catch (e) {
      console.error("Error joining group:", e);
    } finally {
      setLoading(false); // Stop loading (whether success or fail)
    }
  };

  return (
    <div>
      <Dialog open={open} fullWidth maxWidth="sm">
        <DialogTitle>Action Required</DialogTitle>

        <DialogContent dividers>
          <Typography gutterBottom variant="h6">
            <strong>You are in a Legacy Beta Group</strong>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This group is no longer supported. To access the latest fixtures,
            live match chat, and features, you need to join the new{" "}
            <strong>Global Manchester United Group</strong>.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleJoinClick}
            variant="contained"
            color="primary"
            disabled={loading} // Disable button while loading
            startIcon={
              loading && <CircularProgress size={20} color="inherit" />
            }
          >
            {loading ? "Joining..." : "Join Global Group"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LegacyGroupModal;
