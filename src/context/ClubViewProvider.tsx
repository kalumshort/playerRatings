"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useSelector } from "react-redux";

import { RootState } from "@/lib/redux/store";
import { isArchivedSeason } from "@/lib/config/season";

interface ClubViewContextValue {
  isGuestView: boolean;
  /**
   * Active season, mirrored from Redux by DataInitializer. Safe in Firestore paths
   * (allowlisted by resolveSeason). Server components that already know the season
   * should pass it as a prop instead — this lags by one render on archived pages.
   */
  season: string;
  isArchived: boolean;
  /** Interactive controls must be disabled when true. */
  isReadOnly: boolean;
}

const ClubViewContext = createContext<ClubViewContextValue | undefined>(
  undefined,
);

export function ClubViewProvider({
  isGuestView,
  children,
}: {
  isGuestView: boolean;
  children: ReactNode;
}) {
  const season = useSelector(
    (state: RootState) => state.globalData.currentYear,
  );

  const value = useMemo<ClubViewContextValue>(() => {
    const archived = isArchivedSeason(season);

    return {
      isGuestView,
      season,
      isArchived: archived,
      isReadOnly: isGuestView || archived,
    };
  }, [isGuestView, season]);

  return (
    <ClubViewContext.Provider value={value}>
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
