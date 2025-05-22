import React from "react";
import { Box } from "@mui/material";

import AuthTabs from "./AuthTabs";
import GoogleSignInButton from "./SignInMethods/GoogleSignInButton";

const Login = ({ groupId }) => {
  return (
    <div style={{ maxWidth: "550px", margin: "auto" }}>
      <Box>
        <AuthTabs groupId={groupId} />
      </Box>
      <h3
        style={{ padding: "0", margin: "20px 0px 0px 0px", fontSize: "12px" }}
      >
        Other Sign-in options
      </h3>
      <Box>
        <GoogleSignInButton groupId={groupId} />
      </Box>
    </div>
  );
};

export default Login;
