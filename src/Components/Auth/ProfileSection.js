import React from "react";
import { Box, Typography, Avatar } from "@mui/material";

import useUserData from "../../Hooks/useUserData";

const ProfileSection = () => {
  const { userData } = useUserData();

  return (
    <Box
      sx={{
        padding: "30px 10px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        position: "relative",
      }}
    >
      <Avatar
        alt="Profile Picture"
        src={userData.photoURL || "https://via.placeholder.com/150"}
        sx={{ width: 50, height: 50, marginBottom: 2 }}
      />
      <Box>
        <Typography variant="h6" align="left">
          {userData.displayName}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="left"
          sx={{ marginBottom: 2 }}
        >
          {userData.email}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileSection;
