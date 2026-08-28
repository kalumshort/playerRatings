"use client";

import { useRouter, usePathname } from "next/navigation";
import { IconButton, type IconButtonProps } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function BackButton({ sx, ...props }: IconButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Logic: Split the pathname (e.g., "/liverpool/fixtures" -> ["", "liverpool", "fixtures"])
  // If the path has 2 or fewer segments (e.g., /liverpool), we are at "Home".
  const segments = pathname.split("/").filter(Boolean);
  const isHome = segments.length <= 1;

  if (isHome) return null;

  const handleBack = () => {
    // If the browser history is empty (direct deep link),
    // go to the parent folder rather than leaving the app.
    if (window.history.length <= 1) {
      router.push(`/${segments[0]}`);
    } else {
      router.back();
    }
  };

  return (
    <IconButton
      onClick={handleBack}
      aria-label="go back"
      color="primary"
      sx={{
        borderRadius: "12px",
        marginLeft: 2,
        transition: "all 0.2s ease",
        "&:active": { transform: "scale(0.95)" },
        ...sx,
      }}
      {...props}
    >
      <ArrowBackIcon />
    </IconButton>
  );
}
