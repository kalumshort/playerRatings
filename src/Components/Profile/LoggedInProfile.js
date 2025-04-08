import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Paper,
  TextField,
} from "@mui/material";
import { SettingRow } from "../../Containers/Header";
import UpdateButton from "../HelpfulComponents";
import { updateUserField } from "../../Firebase/Auth_Functions";
import useUserData from "../../Hooks/useUserData";

export default function LoggedInProfile({}) {
  const { userData } = useUserData();

  const [displayName, setDisplayName] = useState(userData.displayName);

  if (!userData) {
    return (
      <Typography variant="h6" align="center">
        Please sign in to view your profile.
      </Typography>
    );
  }
  const handleNameChange = (e) => {
    setDisplayName(e.target.value);
  };
  const handleChangeDisplayName = async () => {
    if (displayName !== userData.displayName) {
      const userId = userData.uid; // Replace with actual userData ID
      const field = "displayName"; // The field you want to update
      const newValue = displayName; // New value for the field

      await updateUserField(userId, field, newValue);
    }
  };
  return (
    <>
      <Card
        className="containerMargin"
        variant="outlined"
        sx={{ textAlign: "center" }}
      >
        <CardContent>
          <Avatar
            src={userData.photoURL}
            alt="Profile"
            sx={{
              width: 100,
              height: 100,
              margin: "0 auto 20px",
              border: "4px solid rgb(78, 84, 255)",
            }}
          />
          <Typography variant="h4" sx={{ marginBottom: 2 }}>
            {userData.displayName}
          </Typography>
          <Typography variant="body1" sx={{ marginBottom: 2 }}>
            <strong>{userData.email}</strong>
          </Typography>
        </CardContent>
      </Card>
      <Paper className="containerMargin" style={{ padding: "15px" }}>
        <SettingRow>
          <Box>Display Name</Box>
          <TextField
            value={displayName}
            onChange={handleNameChange}
            variant="outlined"
            size="small"
            sx={{ marginLeft: "10px", width: "150px" }}
          />
          <UpdateButton onClick={handleChangeDisplayName} />
        </SettingRow>
      </Paper>
    </>
  );
}
