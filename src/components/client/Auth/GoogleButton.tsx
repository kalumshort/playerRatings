"use client";

import React, { useState } from "react";
import { Button, Box, CircularProgress } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useRouter } from "next/navigation";
import { handleGoogleSignIn } from "@/lib/firebase/auth-actions";
import { toast } from "sonner";

export default function GoogleButton({
  groupId,
  text = "Sign In with Google",
  redirectTo = "/",
}: {
  groupId?: string;
  text?: string;
  // null keeps the user where they are, for hosts that navigate themselves —
  // the invite page redeems the code first and then routes into the group.
  redirectTo?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await handleGoogleSignIn(groupId);

      // Force Next.js to refresh server-side data now that we are logged in
      router.refresh();
      if (redirectTo) router.push(redirectTo);
      else setLoading(false);
    } catch (error: any) {
      console.error("Google Auth Error:", error.message);
      toast.error("Google sign-in failed. Please try again.");
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
