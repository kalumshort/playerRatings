"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { clientDB } from "@/lib/firebase/client";
import {
  ClubDirectory,
  EMPTY_CLUB_DIRECTORY,
  normaliseClubDirectory,
} from "@/lib/clubDirectory";

// Module-level cache: the directory changes once a night, and StadiumSwitcher
// can be opened repeatedly in a session. Shared across every mount so the
// dialog only ever costs one read per page load.
let cachedDirectory: ClubDirectory | null = null;
let inflight: Promise<ClubDirectory> | null = null;

const loadDirectory = (): Promise<ClubDirectory> => {
  if (cachedDirectory) return Promise.resolve(cachedDirectory);

  if (!inflight) {
    inflight = getDoc(doc(clientDB, "config", "clubDirectory"))
      .then((snapshot) => {
        cachedDirectory = snapshot.exists()
          ? normaliseClubDirectory(snapshot.data())
          : EMPTY_CLUB_DIRECTORY;
        return cachedDirectory;
      })
      .catch((error) => {
        console.error("Club directory fetch failed:", error);
        return EMPTY_CLUB_DIRECTORY;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
};

/**
 * Reads `config/clubDirectory` — the club list the picker and transfer market
 * render. Public doc, so this works signed out too.
 *
 * @param enabled - Skip the read until it's needed (e.g. dialog closed).
 */
export default function useClubDirectory(enabled = true) {
  const [directory, setDirectory] = useState<ClubDirectory | null>(
    cachedDirectory,
  );
  const [loading, setLoading] = useState(enabled && !cachedDirectory);

  useEffect(() => {
    if (!enabled || cachedDirectory) return;

    let active = true;
    setLoading(true);

    loadDirectory().then((result) => {
      if (!active) return;
      setDirectory(result);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { directory, clubs: directory?.clubs ?? [], loading };
}
