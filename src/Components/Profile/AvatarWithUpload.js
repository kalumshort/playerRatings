import React, { useState } from "react";
import { Avatar, IconButton, Box, LinearProgress } from "@mui/material";
import { Upload } from "@mui/icons-material";
import { storage, db } from "../../Firebase/Firebase"; // Firebase imports
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateDoc, doc } from "firebase/firestore";

export default function UploadAvatar({ userData }) {
  const [isHovering, setIsHovering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleHover = (state) => setIsHovering(state);

  const handleAvatarClick = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*"; // Only accept images
    input.click();

    input.onchange = async (e) => {
      const file = e.target.files[0];

      if (file) {
        setUploading(true);
        const storageRef = ref(storage, `avatars/${userData.uid}`); // Firebase storage reference
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Monitor upload progress
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
          },
          (error) => {
            console.error("Error during image upload:", error);
            setUploading(false);
            alert("Failed to upload the image. Please try again.");
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(storageRef); // Get the download URL of the uploaded file
              await updateDoc(doc(db, "users", userData.uid), {
                photoURL: downloadURL,
              }); // Update Firestore with the new URL
              setUploading(false);
              setProgress(0);
            } catch (err) {
              console.error(
                "Error updating Firestore with the new image URL:",
                err
              );
              setUploading(false);
              alert("Failed to update your profile picture. Please try again.");
            }
          }
        );
      } else {
        alert("No file selected");
        setUploading(false);
      }
    };
  };

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-block",
        cursor: uploading ? "progress" : "pointer", // Set cursor to progress during upload
      }}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <Avatar
        alt="Profile Picture"
        src={userData.photoURL || "https://via.placeholder.com/150"}
        sx={{
          width: 100,
          height: 100,
          border: "4px solid rgb(78, 84, 255)",
        }}
      />
      {isHovering && !uploading && (
        <IconButton
          onClick={handleAvatarClick}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
          }}
        >
          <Upload />
        </IconButton>
      )}
      {uploading && (
        <LinearProgress
          sx={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
          variant="determinate"
          value={progress} // Display progress value
        />
      )}
    </Box>
  );
}
