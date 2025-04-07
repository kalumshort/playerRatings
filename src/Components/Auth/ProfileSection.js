import React, { useState, useEffect } from "react";
import { Box, Typography, Avatar } from "@mui/material";

import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../Firebase/Firebase";

const ProfileSection = () => {
  const [userData, setUserData] = useState({
    email: "",
    displayName: "",
    profilePictureUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch user data from Firestore when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserData({
              email: userDoc.data().email,
              displayName: userDoc.data().displayName || "No Name",
              profilePictureUrl: userDoc.data().profilePictureUrl || "",
            });
          } else {
            setError("No user data found");
          }
        } catch (err) {
          setError("Error fetching user data: " + err.message);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box
      sx={{
        padding: "30px 10px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        position: "relative",
      }}
    >
      <Avatar
        alt="Profile Picture"
        src={userData.profilePictureUrl || "https://via.placeholder.com/150"} // Placeholder image if no profile picture
        sx={{ width: 50, height: 50, marginBottom: 2 }}
      />
      <Box>
        <Typography variant="h6" align="left">
          {userData.displayName}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="left"
          sx={{ marginBottom: 2 }}
        >
          {userData.email}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileSection;
