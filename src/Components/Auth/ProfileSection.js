import React from "react";
import { Typography, Avatar, Card, CardContent } from "@mui/material";
import { Link } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import useUserData from "../../Hooks/useUserData";

const ProfileSection = () => {
  const { userData } = useUserData();

  return (
    <>
      <Link to="/profile" style={{ textDecoration: "none" }}>
        <Card
          className="containerMargin"
          variant="outlined"
          sx={{ textAlign: "center" }}
          style={{ position: "relative" }}
        >
          <CardContent>
            <Avatar
              src={userData.photoURL || "https://via.placeholder.com/150"}
              alt="Profile"
              sx={{
                width: 75,
                height: 75,
                margin: "0 auto 20px",
                border: "4px solid rgb(78, 84, 255)",
              }}
            />
            <Typography variant="h5" sx={{ marginBottom: 2 }}>
              {userData.displayName}
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: 2 }}>
              <strong>{userData.email}</strong>
            </Typography>
          </CardContent>

          <ArrowForwardRoundedIcon
            style={{ position: "absolute", bottom: "5px", right: "5px" }}
            fontSize="small"
          />
        </Card>
      </Link>
    </>
  );
};

export default ProfileSection;
