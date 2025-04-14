import React from "react";
import { Select, MenuItem, FormControl, ListItemText } from "@mui/material";

export default function CustomSelect({ options, label, onChange, value }) {
  return (
    <FormControl>
      <Select value={value} onChange={onChange} size="small">
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
