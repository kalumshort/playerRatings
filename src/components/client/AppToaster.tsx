"use client";

import { Toaster } from "sonner";
import { use11VotesTheme } from "@/components/client/ThemeRegistry";

/**
 * sonner defaults to `theme="light"` and never reads MUI's palette, so without
 * this wrapper every toast rendered light — including the write confirmations
 * and error toasts from `useAsyncAction`, which are the app's main feedback
 * channel. `layout.tsx` is a server component and can't read the theme context
 * itself, hence the separate client file.
 */
export default function AppToaster() {
  const { themeMode } = use11VotesTheme();

  return (
    <Toaster
      theme={themeMode === "dark" ? "dark" : "light"}
      richColors
      position="top-right"
      closeButton
      duration={4000}
    />
  );
}
