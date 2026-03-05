"use client";

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
  alpha,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { motion } from "framer-motion";

// CUSTOM HOOKS & UTILS
import { useAuth } from "@/context/AuthContext";
import { submitContactForm } from "@/lib/firebase/client-actions";

const SUBJECT_OPTIONS = [
  { value: "bug", label: "Report a Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "advertising", label: "Partnership" },
  { value: "account_support", label: "Account Issue" },
  { value: "other", label: "Other Inquiry" },
];

export default function ContactForm() {
  const theme = useTheme() as any;
  const { user } = useAuth();
  const isDark = theme.palette.mode === "dark";

  const [formData, setFormData] = useState({
    email: user?.email || "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.subject || !formData.message) {
      setStatus("error");
      setFeedbackMsg("Tactical error: Please fill in all fields.");
      return;
    }

    setStatus("loading");

    try {
      const result = await submitContactForm({
        ...formData,
        userId: user?.uid || null,
      });

      if (result.success) {
        setStatus("success");
        setFeedbackMsg("Message received. Check your inbox soon.");
        setFormData({ email: user?.email || "", subject: "", message: "" });
      } else {
        throw new Error(result.message || "Submission failed.");
      }
    } catch (err: any) {
      setStatus("error");
      setFeedbackMsg(err.message || "Failed to send. Please try again.");
    }
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      bgcolor: alpha(theme.palette.background.paper, 0.4),
      backdropFilter: "blur(4px)",
      borderRadius: "16px",
      transition: "all 0.2s ease",
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.primary.main },
    },
    "& .MuiInputLabel-root": {
      fontFamily: "'Space Mono', monospace",
      color: theme.palette.text.secondary,
    },
    "& .MuiInputBase-input": {
      fontFamily: "'Space Mono', monospace",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          maxWidth: "600px",
          mx: "auto",
          width: "100%",
          ...theme.clay?.card,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            fontFamily: "'VT323', monospace",
            mb: 1,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Contact The Team
        </Typography>

        <Typography
          variant="body2"
          align="center"
          sx={{
            fontFamily: "'Space Mono', monospace",
            color: "text.secondary",
            mb: 4,
          }}
        >
          Define your inquiry category to bypass the noise.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
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
                    bgcolor: alpha(theme.palette.background.paper, 0.95),
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
                sx={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.85rem",
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </TextField>

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

          <Collapse in={status === "success" || status === "error"}>
            <Alert
              severity={status === "success" ? "success" : "error"}
              sx={{
                mb: 3,
                borderRadius: "12px",
                fontFamily: "'Space Mono', monospace",
                bgcolor:
                  status === "success"
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
              }}
            >
              {feedbackMsg}
            </Alert>
          </Collapse>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
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
              fontWeight: 900,
              fontFamily: "'VT323', monospace",
              fontSize: "1.2rem",
              letterSpacing: 1,
            }}
          >
            {status === "loading" ? "SENDING..." : "SUBMIT INQUIRY"}
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}
