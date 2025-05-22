import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Container,
} from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../Firebase/Firebase";
import { handleCreateAccount } from "../../Firebase/Auth_Functions";
import { useNavigate } from "react-router-dom";

const AuthTabs = ({ groupId }) => {
  const [value, setValue] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
    setError(""); // Clear error message when switching tabs
  };

  const validateForm = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return "Please enter a valid email.";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formError = validateForm();
    if (formError) {
      setError(formError);
      return;
    }

    try {
      if (value === 0) {
        await handleCreateAccount({ email, password, groupId });
        navigate("/"); // Redirect to the home page after successful sign-up
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container style={{ padding: "0px" }}>
      <Box>
        <Tabs value={value} onChange={handleTabChange} centered>
          <Tab label="Sign Up" />
          <Tab label="Login" />
        </Tabs>

        <Box sx={{ paddingTop: 2 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="p" gutterBottom align="center">
              {value === 0 ? "Create an Account" : "Log In"}
            </Typography>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
            />
            {error && (
              <Typography color="error" sx={{ marginBottom: 2 }}>
                {error}
              </Typography>
            )}
            <Box
              sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}
            >
              <Button variant="contained" color="primary" type="submit">
                {value === 0 ? "Sign Up" : "Log In"}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Container>
  );
};

export default AuthTabs;
