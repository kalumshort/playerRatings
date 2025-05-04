import React, { useState } from "react";
import { Avatar, IconButton, Box, LinearProgress } from "@mui/material";
import { Upload } from "@mui/icons-material";
import { db } from "../../Firebase/Firebase"; // Firebase imports
import { updateDoc, doc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

export default function UploadAvatar({ userData }) {
  const [isHovering, setIsHovering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const storage = getStorage();
  storage.maxUploadRetryTime = 50000;

  const handleHover = (state) => setIsHovering(state);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      console.log("File size:", file.size);
      console.log("File type:", file.type);

      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB. Please choose a smaller file.");
        return;
      }

      setUploading(true);

      const metadata = {
        contentType: file.type,
      };

      const storageRef = ref(
        storage,
        `users/${userData.uid}/avatars/profile.jpg`
      );
      console.log("Storage reference path:", storageRef.fullPath);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
          console.log("Snapshot state:", snapshot.state);
          console.log("Bytes transferred:", snapshot.bytesTransferred);
          console.log("Total bytes:", snapshot.totalBytes);
          setProgress(progress);
        },
        (error) => {
          console.error(
            "Error during image upload:",
            error.code,
            error.message,
            error
          );
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File available at", downloadURL);
            await updateDoc(doc(db, "users", userData.uid), {
              photoURL: downloadURL,
            });
            setUploading(false);
            setProgress(0);
          } catch (err) {
            console.error(
              "Error updating Firestore with the new image URL:",
              err
            );
            setUploading(false);
          }
        }
      );
    } else {
      alert("No file selected");
    }
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
          component="label"
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
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange} // Trigger file upload
          />
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
