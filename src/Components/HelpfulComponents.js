import React, { createContext, useContext, useState, useCallback } from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

import { IconButton } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check"; // Material-UI Check Icon

const AlertContext = createContext();

export function useAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showAlert = useCallback((message, severity = "info") => {
    setAlert({ open: true, message, severity });
  }, []);

  const handleClose = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleClose}
          severity={alert.severity}
          elevation={6}
          variant="filled"
        >
          {alert.message}
        </MuiAlert>
      </Snackbar>
    </AlertContext.Provider>
  );
}

export default function UpdateButton({ onClick }) {
  return (
    <IconButton onClick={onClick} color="primary">
      <CheckIcon />
    </IconButton>
  );
}
