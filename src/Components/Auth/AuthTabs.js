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

const AuthTabs = () => {
  const [value, setValue] = useState(0); // To manage the active tab (Sign Up or Login)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Handle Tab Change
  const handleTabChange = (event, newValue) => {
    setValue(newValue);
    setError(""); // Clear error message when switching tabs
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await handleCreateAccount({ email: email, password: password });
      alert("Account created successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in successfully!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderRadius: 2,
          boxShadow: 3,
          padding: 3,
        }}
      >
        {/* Tabs */}
        <Tabs value={value} onChange={handleTabChange} centered>
          <Tab label="Sign Up" />
          <Tab label="Login" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ paddingTop: 2 }}>
          {value === 0 ? (
            <form onSubmit={handleSignUp}>
              <Typography variant="p" gutterBottom align="center">
                Create an Account
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
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 2,
                }}
              >
                <Button variant="contained" color="primary" type="submit">
                  Sign Up
                </Button>
              </Box>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <Typography variant="p" gutterBottom align="center">
                Log In
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
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 2,
                }}
              >
                <Button variant="contained" color="primary" type="submit">
                  Log In
                </Button>
              </Box>
            </form>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default AuthTabs;
