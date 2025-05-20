import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
} from "@mui/material";

import { SettingRow } from "../../Containers/Header";
import { updateUserField } from "../../Firebase/Auth_Functions";
import useUserData from "../../Hooks/useUserData";
import useGroupData from "../../Hooks/useGroupsData";

import UploadAvatar from "./AvatarWithUpload";
import CustomSelect from "../Inputs/CustomSelect";
import Logout from "../Auth/Logout";
import { useDispatch } from "react-redux";
import { clearTeamSquads } from "../../redux/Reducers/teamSquads";
import { clearRatings } from "../../redux/Reducers/playerRatingsReducer";
import { clearFixtures } from "../../redux/Reducers/fixturesReducer";

export default function LoggedInProfile() {
  const dispatch = useDispatch();

  const { userData } = useUserData();
  const { groupData, activeGroup } = useGroupData();

  const options = convertToSelectOptions(groupData);

  const handleSelectChange = async (event) => {
    await updateUserField(userData.uid, "activeGroup", event.target.value);
    dispatch(clearTeamSquads());
    dispatch(clearRatings());
    dispatch(clearFixtures());
  };

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

  const [groupCodeInput, setGroupCodeInput] = useState("");

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

  const handleGroupJoin = () => {
    console.log(groupCodeInput);
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
          <UploadAvatar userData={userData} />

          {/* <Avatar
            src={userData.photoURL}
            alt="Profile"
            sx={{
              width: 100,
              height: 100,
              margin: "0 auto 20px",
              border: "4px solid rgb(78, 84, 255)",
            }}
          /> */}
          <Typography variant="h4" sx={{ marginBottom: 2 }}>
            {userData.displayName}
          </Typography>
          <Typography variant="body1" sx={{ marginBottom: 2 }}>
            <strong>{userData.email}</strong>
          </Typography>
        </CardContent>
      </Card>
      <Paper className="containerMargin" style={{ padding: "15px" }}>
        <h5
          style={{ padding: "0px", margin: "5px 0px", color: "grey" }}
          className=""
        >
          Profile Settings
        </h5>
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
            variant="text"
            color="primary"
            onClick={handleUpdate}
            disabled={Object.values(changedFields).every((field) => !field)} // Disable button if no field changed
          >
            Update
          </Button>
        </Box>
      </Paper>
      <Paper className="containerMargin" style={{ padding: "15px" }}>
        <h5
          style={{ padding: "0px", margin: "5px 0px", color: "grey" }}
          className=""
        >
          Group Settings
        </h5>
        <SettingRow>
          <Box>Change Group</Box>
          <CustomSelect
            options={options}
            label="Choose an Option"
            value={activeGroup.groupId}
            onChange={handleSelectChange}
          />
        </SettingRow>
        <SettingRow>
          <Box>Group Code </Box>

          <TextField
            value={groupCodeInput}
            onChange={(e) => setGroupCodeInput(e)}
            variant="outlined"
            size="small"
            sx={{ marginLeft: "10px", width: "100px" }}
            disabled
          />
          <Button
            variant="text"
            color="primary"
            onClick={handleGroupJoin}
            // disabled={!groupCodeInput}
            disabled
          >
            Join
          </Button>
        </SettingRow>
        <SettingRow>
          <Box>Create Group </Box>

          <Button variant="text" color="primary" disabled>
            Coming Soon
          </Button>
        </SettingRow>
      </Paper>
      <div className="containerMargin" style={{ padding: "15px" }}>
        <SettingRow>
          <Box></Box>
          <Logout />
        </SettingRow>
      </div>
    </div>
  );
}

function convertToSelectOptions(data) {
  return Object.keys(data).map((key) => ({
    label: data[key].name, // the label will be the 'name' field
    value: data[key].groupId, // the value will be the 'groupId' field
    imageURL: data[key].imageURL, // you can also include the imageURL if needed
  }));
}
