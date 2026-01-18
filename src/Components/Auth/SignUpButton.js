import React, { useState } from "react";
import { Button, Box } from "@mui/material";
import { UserPlus } from "lucide-react";
import AuthModal from "./AuthModal";

import useGroupData from "../../Hooks/useGroupsData";

const SignUpButton = () => {
  const [open, setOpen] = useState(false);
  const { activeGroup } = useGroupData();

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
      >
        Join This Club
      </Button>

      <AuthModal
        open={open}
        handleClose={handleClose}
        groupId={activeGroup?.groupId}
      />
    </Box>
  );
};

export default SignUpButton;
