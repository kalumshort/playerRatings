import React from "react";
import Login from "../Auth/Login";
import { Box } from "@mui/material";

export default function LoggedOutProfile() {
  return (
    <Box>
      <Box style={{ padding: 15 }}>
        <Login />
      </Box>
    </Box>
  );
}
