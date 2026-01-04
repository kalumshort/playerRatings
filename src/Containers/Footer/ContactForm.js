import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  MenuItem,
  Collapse,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useAuth } from "../../Providers/AuthContext";
import { submitContactForm } from "../../Firebase/Firebase";

const SUBJECT_OPTIONS = [
  { value: "bug", label: "Report a Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "advertising", label: "Advertising / Partnership" },
  { value: "account_support", label: "Account Issue" },
  { value: "other", label: "Other Inquiry" },
];

const ContactForm = () => {
  const theme = useTheme();
  const { user } = useAuth(); // Auto-fill email if logged in
  const isDark = theme.palette.mode === "dark";

  // Form State
  const [formData, setFormData] = useState({
    email: user?.email || "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.subject || !formData.message) {
      setStatus("error");
      setFeedbackMsg("Please fill in all fields.");
      return;
    }

    setStatus("loading");

    // Calls the Cloud Function wrapper we created in Firebase.js
    const result = await submitContactForm({
      ...formData,
      userId: user?.uid || null, // Optional: attaches ID if logged in
    });

    if (result.success) {
      setStatus("success");
      setFeedbackMsg("Message received. We'll be in touch.");
      // Reset form
      setFormData({
        email: user?.email || "",
        subject: "",
        message: "",
      });
    } else {
      setStatus("error");
      setFeedbackMsg(result.message || "Failed to send. Please try again.");
    }
  };

  // Glassmorphism Input Styles
  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)",
      backdropFilter: "blur(4px)",
      borderRadius: "16px",
      transition: "all 0.2s ease",
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.text.secondary },
      "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
    },
    "& .MuiInputLabel-root": {
      fontFamily: "'Space Mono', monospace",
      color: theme.palette.text.secondary,
      "&.Mui-focused": { color: theme.palette.primary.main },
    },
    "& .MuiInputBase-input": {
      fontFamily: "'Space Mono', monospace",
    },
    // Fix for Select dropdown menu styles
    "& .MuiSelect-icon": {
      color: theme.palette.text.secondary,
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 5 },
        maxWidth: "600px",
        mx: "auto",
        width: "100%",
        // The theme automatically applies the glass effect via ThemeContext overrides
      }}
    >
      <Typography
        variant="h4"
        align="center"
        sx={{
          fontFamily: "'VT323', monospace",
          mb: 1,
          textTransform: "uppercase",
          color: theme.palette.text.primary,
        }}
      >
        Contact The Team
      </Typography>

      <Typography
        variant="body2"
        align="center"
        sx={{
          fontFamily: "'Space Mono', monospace",
          color: theme.palette.text.secondary,
          mb: 4,
        }}
      >
        Select a category below to get your message to the right person.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Email Input */}
        <TextField
          label="Your Email"
          name="email"
          type="email"
          fullWidth
          value={formData.email}
          onChange={handleChange}
          disabled={status === "loading"}
          sx={{ ...inputStyle, mb: 3 }}
        />

        {/* Subject Dropdown */}
        <TextField
          select
          label="Subject / Category"
          name="subject"
          fullWidth
          value={formData.subject}
          onChange={handleChange}
          disabled={status === "loading"}
          sx={{ ...inputStyle, mb: 3 }}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: {
                  borderRadius: "16px",
                  mt: 1,
                  background: isDark
                    ? "rgba(20,20,20,0.95)"
                    : "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${theme.palette.divider}`,
                },
              },
            },
          }}
        >
          {SUBJECT_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{ fontFamily: "'Space Mono', monospace" }}
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Message Input */}
        <TextField
          label="Message"
          name="message"
          multiline
          rows={5}
          fullWidth
          value={formData.message}
          onChange={handleChange}
          disabled={status === "loading"}
          sx={{ ...inputStyle, mb: 4 }}
        />

        {/* Feedback Alert */}
        <Collapse in={status === "success" || status === "error"}>
          <Alert
            severity={status === "success" ? "success" : "error"}
            sx={{
              mb: 3,
              borderRadius: "12px",
              fontFamily: "'Space Mono', monospace",
              alignItems: "center",
            }}
          >
            {feedbackMsg}
          </Alert>
        </Collapse>

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={status === "loading"}
          endIcon={
            status === "loading" ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon />
            )
          }
          sx={{
            py: 1.5,

            fontSize: "1.1rem",
            borderRadius: "12px",
            backgroundColor: theme.palette.primary.main,
            color: "#000",
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
              transform: "translateY(-2px)",
              boxShadow: `0 4px 20px ${theme.palette.primary.main}50`,
            },
            transition: "all 0.3s ease",
          }}
        >
          {status === "loading" ? "SENDING..." : "SUBMIT"}
        </Button>
      </Box>
    </Paper>
  );
};

export default ContactForm;
