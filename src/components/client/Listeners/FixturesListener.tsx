"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import { clientDB } from "@/lib/firebase/client";
import { updateSingleFixture } from "@/lib/redux/slices/fixturesSlice";

/**
 * 11VOTES MIGRATION NOTE:
 * When using this inside a parent component with MUI, remember:
 * <Grid container>
 * <Grid size={{ xs: 12, md: 8 }}> <--- New Syntax (no 'item' prop)
 * </Grid>
 */

interface FixturesListenerProps {
  fixtureId: string | number;
  currentYear: string | number;
  clubId: string | number;
}

export const FixtureListener = ({
  fixtureId,
  currentYear,
  clubId,
}: FixturesListenerProps) => {
  const dispatch = useDispatch();

  // Per-key fingerprints, so we can dispatch only the fields that actually
  // changed rather than the whole document.
  const lastKeyJsonRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // 1. Validation & Setup
    if (!clubId || !fixtureId || !currentYear) {
      return;
    }

    const sYear = String(currentYear);
    const sFixtureId = String(fixtureId);
    const sClubId = String(clubId);

    // New subscription: forget the previous fixture's keys.
    lastKeyJsonRef.current = {};

    // 2. Reference Construction
    const fixtureRef = doc(clientDB, "fixtures", sYear, "fixtures", sFixtureId);

    // 3. Listener Logic
    const unsubscribe = onSnapshot(
      fixtureRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data();

        // Diff per key, not over the whole document.
        //
        // A live match emits a snapshot roughly every minute, and usually only
        // `status.elapsed` has moved. Dispatching the entire doc gave `events`,
        // `lineups` and `teams` fresh object identities every time, which
        // invalidated every downstream useMemo keyed on them — the whole
        // fixture hub recomputed once a minute for a clock tick.
        //
        // updateSingleFixture merges ({...prev, ...data}), so sending only the
        // changed keys leaves the untouched ones reference-stable.
        const changed: Record<string, unknown> = {};
        const nextFingerprints: Record<string, string> = {};

        for (const [key, value] of Object.entries(data)) {
          const json = JSON.stringify(value ?? null);
          nextFingerprints[key] = json;
          if (lastKeyJsonRef.current[key] !== json) changed[key] = value;
        }

        lastKeyJsonRef.current = nextFingerprints;

        if (Object.keys(changed).length === 0) return;

        dispatch(
          updateSingleFixture({
            id: snapshot.id,
            data: changed,
            year: sYear,
            clubId: sClubId,
          }),
        );
      },
      (error) => {
        console.error(
          "%c🚨 [FixtureListener] Firestore Error:",
          "color: #ef4444; font-weight: bold;",
        );
        console.error("Code:", error.code);
        console.error("Message:", error.message);

        if (error.code === "permission-denied") {
          console.error(
            "👉 Check if your Firebase Security Rules allow reading this path for the current Auth state.",
          );
        }
      },
    );

    // 4. Cleanup on Unmount
    return () => {
      unsubscribe();
    };
  }, [fixtureId, clubId, currentYear, dispatch]);

  // This is a logic-only component (Provider pattern)
  return null;
};
