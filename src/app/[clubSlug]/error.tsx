"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ui/ErrorState";

export default function ClubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Club route error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load this club"
      description="We hit a problem fetching this club's season data. Try again, or head back and pick another."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
