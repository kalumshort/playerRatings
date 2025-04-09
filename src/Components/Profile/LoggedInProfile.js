import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Paper,
  TextField,
  Button,
} from "@mui/material";
import { SettingRow } from "../../Containers/Header";
import { updateUserField } from "../../Firebase/Auth_Functions";
import useUserData from "../../Hooks/useUserData";

export default function LoggedInProfile() {
  const { userData } = useUserData();

  // Initialize state for all fields
  const [formData, setFormData] = useState({
    displayName: userData.displayName,

    // Add other fields here in the future
  });

  // Track which fields have been changed
  const [changedFields, setChangedFields] = useState({
    displayName: false,

    // Add other fields here in the future
  });

  useEffect(() => {
    // Update changed fields dynamically based on form data changes
    setChangedFields({
      displayName: formData.displayName !== userData.displayName,

      // Add logic for new fields here in the future
    });
  }, [formData, userData]);

  const handleFieldChange = (field) => (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: e.target.value,
    }));
  };

  const handleUpdate = async () => {
    const updatedFields = [];
    // Loop through formData and check for fields that have changed
    for (let field in formData) {
      if (formData[field] !== userData[field]) {
        await updateUserField(userData.uid, field, formData[field]);
        updatedFields.push(field);
      }
    }

    if (updatedFields.length > 0) {
      console.log("Updated fields:", updatedFields);
    }
  };

  if (!userData) {
    return (
      <Typography variant="h6" align="center">
        Please sign in to view your profile.
      </Typography>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "auto" }}>
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
            value={formData.displayName}
            onChange={handleFieldChange("displayName")}
            variant="outlined"
            size="small"
            sx={{ marginLeft: "10px", width: "150px" }}
          />
        </SettingRow>

        {/* Add more fields as needed here in the future */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdate}
            disabled={Object.values(changedFields).every((field) => !field)} // Disable button if no field changed
          >
            Update
          </Button>
        </Box>
      </Paper>
    </div>
  );
}
