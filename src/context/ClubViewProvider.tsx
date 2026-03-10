"use client";

import { createContext, useContext, ReactNode } from "react";

const ClubViewContext = createContext<{ isGuestView: boolean } | undefined>(
  undefined,
);

export function ClubViewProvider({
  isGuestView,
  children,
}: {
  isGuestView: boolean;
  children: ReactNode;
}) {
  return (
    <ClubViewContext.Provider value={{ isGuestView }}>
      {children}
    </ClubViewContext.Provider>
  );
}

// Custom hook for easy access
export const useClubView = () => {
  const context = useContext(ClubViewContext);
  if (context === undefined) {
    throw new Error("useClubView must be used within a ClubViewProvider");
  }
  return context;
};
