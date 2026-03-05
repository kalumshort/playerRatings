"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

  // Ref to prevent unnecessary dispatches if data hasn't actually changed
  const lastUpdateRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Validation & Setup
    if (!clubId || !fixtureId || !currentYear) {
      return;
    }

    const sYear = String(currentYear);
    const sFixtureId = String(fixtureId);
    const sClubId = String(clubId);

    // 2. Reference Construction
    const fixtureRef = doc(db, "fixtures", sYear, "fixtures", sFixtureId);

    // 3. Listener Logic
    const unsubscribe = onSnapshot(
      fixtureRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data();

        // Simple stringified check to avoid Redux dispatch loops if data is identical
        const dataFingerprint = JSON.stringify(data);

        if (lastUpdateRef.current !== dataFingerprint) {
          lastUpdateRef.current = dataFingerprint;

          dispatch(
            updateSingleFixture({
              id: snapshot.id,
              data: data,
              year: sYear,
              clubId: sClubId,
            }),
          );
        }
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
