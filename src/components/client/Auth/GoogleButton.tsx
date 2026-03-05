"use client";

import React, { useState } from "react";
import { Button, Box, CircularProgress } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useRouter } from "next/navigation";
import { handleGoogleSignIn } from "@/lib/firebase/auth-actions";

export default function GoogleButton({
  groupId,
  text = "Sign In with Google",
}: {
  groupId?: string;
  text?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await handleGoogleSignIn(groupId);

      // Force Next.js to refresh server-side data now that we are logged in
      router.refresh();
      router.push("/");
    } catch (error: any) {
      console.error("Google Auth Error:", error.message);
      setLoading(false); // Reset only on error, otherwise the redirect handles it
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        variant="outlined"
        onClick={handleSignIn}
        disabled={loading} // Prevent double-clicks
        fullWidth
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <GoogleIcon />
          )
        }
      >
        {loading ? "Connecting..." : text}
      </Button>
    </Box>
  );
}
