import React, { useState, useEffect } from "react";
import useUserData from "../Hooks/useUserData";
import useGroupData from "../Hooks/useGroupsData";
import { Box, Button, Paper, TextField, Input } from "@mui/material";
import { SettingRow } from "./Header";
import { updateGroupField } from "../Firebase/Auth_Functions";
import { ColorPicker } from "./Helpers";

export default function GroupDashboard() {
  const { isGroupAdmin } = useUserData();
  const { activeGroup } = useGroupData();

  // Initialize state for form data
  const [formData, setFormData] = useState({
    name: activeGroup.name,
    slug: activeGroup.slug,
    accentColor: activeGroup.accentColor, // Assuming the activeGroup has accentColor
  });

  // Track which fields have been changed
  const [changedFields, setChangedFields] = useState({
    name: false,
    slug: false,
    accentColor: false,
  });

  useEffect(() => {
    // Reset changed fields when activeGroup changes
    setFormData({
      name: activeGroup.name,
      slug: activeGroup.slug,
      accentColor: activeGroup.accentColor,
    });

    setChangedFields({
      name: false,
      slug: false,
      accentColor: false,
    });
  }, [activeGroup]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    // Check if the field has been changed
    setChangedFields((prevChangedFields) => ({
      ...prevChangedFields,
      [field]: value !== activeGroup[field], // Mark as changed if new value is different
    }));
  };

  const handleUpdate = async () => {
    const updatedFields = [];
    // Loop through formData and check for fields that have changed
    for (let field in formData) {
      if (formData[field] !== activeGroup[field]) {
        await updateGroupField(activeGroup.id, field, formData[field]);
        updatedFields.push(field);
      }
    }

    if (updatedFields.length > 0) {
      console.log("Updated fields:", updatedFields);
      // You can make your API calls to update the fields here
    }
  };

  // Disable the button if no fields have been changed
  const isButtonDisabled = Object.values(changedFields).every(
    (changed) => !changed
  );

  return (
    <>
      <Paper
        style={{ marginTop: "30px", padding: "10px" }}
        className="containerMargin"
      >
        <SettingRow
          style={{ borderBottom: "1px solid grey", paddingBottom: "10px" }}
        >
          <h5
            style={{ padding: "0px", margin: "5px 0px", color: "grey" }}
            className=""
          >
            Customisation
          </h5>
        </SettingRow>
        <SettingRow>
          <Box>Group Name</Box>
          <TextField
            value={formData.name}
            onChange={handleFieldChange("name")}
            variant="outlined"
            size="small"
            sx={{ marginLeft: "10px", width: "150px" }}
          />
        </SettingRow>
        <SettingRow>
          <Box>Logo</Box>
          {/* <TextField
          value={formData.slug || ""}
          onChange={handleFieldChange("slug")}
          variant="outlined"
          size="small"
          sx={{ marginLeft: "10px", width: "150px" }}
        /> */}
        </SettingRow>
        <SettingRow>
          <Box>Page Slug</Box>
          <TextField
            value={formData.slug || ""}
            onChange={handleFieldChange("slug")}
            variant="outlined"
            size="small"
            sx={{ marginLeft: "10px", width: "150px" }}
          />
        </SettingRow>
        <SettingRow>
          <Box>Accent Colour</Box>

          <ColorPicker
            value={formData.accentColor}
            onChange={(newColor) =>
              handleFieldChange("accentColor")({ target: { value: newColor } })
            }
          />
        </SettingRow>
        <SettingRow
          sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdate}
            disabled={isButtonDisabled} // Disable the button if no changes are made
          >
            Update
          </Button>
        </SettingRow>
      </Paper>
      <Paper
        style={{ marginTop: "30px", padding: "10px" }}
        className="containerMargin"
      >
        <SettingRow
          style={{ borderBottom: "1px solid grey", paddingBottom: "10px" }}
        >
          <h5
            style={{ padding: "0px", margin: "5px 0px", color: "grey" }}
            className=""
          >
            Members
          </h5>
        </SettingRow>
      </Paper>
    </>
  );
}
