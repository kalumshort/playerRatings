import React from "react";
import { Card, CardContent, Typography, Avatar, Box } from "@mui/material";

export default function LoggedInProfile({ user }) {
  if (!user) {
    return (
      <Typography variant="h6" align="center">
        Please sign in to view your profile.
      </Typography>
    );
  }

  return (
    <>
      <Card variant="outlined" sx={{ textAlign: "center", margin: 3 }}>
        <CardContent>
          <Avatar
            src={user.photoURL}
            alt="Profile"
            sx={{
              width: 100,
              height: 100,
              margin: "0 auto 20px",
              border: "4px solid rgb(78, 84, 255)",
            }}
          />
          <Typography variant="h4" sx={{ marginBottom: 2 }}>
            {user.displayName}
          </Typography>
          <Typography variant="body1" sx={{ marginBottom: 2 }}>
            <strong>{user.email}</strong>
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
