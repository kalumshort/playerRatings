import React from "react";
import { Box } from "@mui/material";

import AuthTabs from "./AuthTabs";
import GoogleSignInButton from "./SignInMethods/GoogleSignInButton";

const Login = () => {
  return (
    <>
      <Box>
        <AuthTabs />
      </Box>
      <h3 style={{ padding: "0", margin: "0", fontSize: "12px" }}>
        Other Sign-in options
      </h3>
      <Box>
        <GoogleSignInButton />
      </Box>
    </>
  );
};

export default Login;
