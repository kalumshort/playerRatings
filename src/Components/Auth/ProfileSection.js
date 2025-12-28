import React from "react";
import { Typography, Card, CardContent } from "@mui/material";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import useUserData from "../../Hooks/useUserData";
import { useAppNavigate } from "../../Hooks/useAppNavigate";

const ProfileSection = ({ setDrawerOpen }) => {
  const appNavigate = useAppNavigate();

  const { userData } = useUserData();
  const handleClick = () => {
    setDrawerOpen(false);
    appNavigate("/profile");
  };
  return (
    <>
      <Card
        onClick={() => handleClick()}
        variant="outlined"
        sx={{ textAlign: "center" }}
        style={{ position: "relative", cursor: "pointer" }}
      >
        <CardContent>
          {/* <Avatar
            src={userData.photoURL || "https://via.placeholder.com/150"}
            alt="Profile"
            sx={{
              width: 75,
              height: 75,
              margin: "0 auto 20px",
              border: "4px solid rgb(78, 84, 255)",
            }}
          /> */}
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
    </>
  );
};

export default ProfileSection;
