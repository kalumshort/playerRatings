"use client";

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Timestamp, collection, doc, onSnapshot } from "firebase/firestore";
import { clientDB } from "@/lib/firebase/client";
import {
  fetchMatchPlayerRatingsAction,
  matchMotmVotesAction,
} from "@/lib/redux/slices/ratingsSlice";

interface GroupRatingsListenerProps {
  groupId: string | number;
  matchId: string | number;
  currentYear: string | number;
}

// Rating aggregates are plain numbers, but a Cloud Function may stamp a
// computed MOTM winner onto the match doc via the Admin SDK. Matches the
// sanitizeData convention used by the ratings/user thunks.
const sanitize = (data: any) => {
  const clean = { ...data };
  Object.keys(clean).forEach((key) => {
    if (clean[key] instanceof Timestamp) {
      clean[key] = clean[key].toDate().toISOString();
    }
  });
  return clean;
};

/**
 * Real-time community ratings for one fixture.
 *
 * Without this, group aggregates were hydrated once from the SSR snapshot in
 * FixtureClientWrapper and never moved again: "TEAM AVG" on a rated card,
 * "STADIUM AVG" on the pitch view and the FanMOTMHighlight winner all stayed
 * frozen at page load, and never even included the viewer's own vote.
 *
 * Two subscriptions, because the data sits at two levels:
 *   playerRatings/{matchId}          -> the MOTM tally
 *   playerRatings/{matchId}/players  -> per-player totalRating / totalSubmits
 *
 * Both are covered by `read: if canReadGroup(groupId)` in firestore.rules.
 */
export const GroupRatingsListener = ({
  groupId,
  matchId,
  currentYear,
}: GroupRatingsListenerProps) => {
  const dispatch = useDispatch();

  // Fingerprint guards, matching GroupPredictionsListener: a snapshot fires for
  // metadata changes too, and re-dispatching identical data would replace the
  // players map with a fresh object identity and re-render every card.
  const lastPlayersRef = useRef<string | null>(null);
  const lastMotmRef = useRef<string | null>(null);

  useEffect(() => {
    if (!groupId || !matchId || !currentYear) return;

    const gid = String(groupId);
    const mid = String(matchId);
    const year = String(currentYear);
    const basePath = `groups/${gid}/seasons/${year}/playerRatings`;

    const logError = (label: string) => (error: any) => {
      console.error(
        "%c🚨 [RatingsListener] Firestore Error:",
        "color: #ef4444; font-weight: bold;",
      );
      console.error(`Path: ${basePath}/${mid}${label}`);
      console.error("Message:", error.message);
    };

    // 1. Per-player aggregates.
    // normalizePlayerRatings in the slice already accepts the array-of-
    // { id, ...data } shape, so no reducer change is needed for this writer.
    const unsubPlayers = onSnapshot(
      collection(
        clientDB,
        "groups",
        gid,
        "seasons",
        year,
        "playerRatings",
        mid,
        "players",
      ),
      (snapshot) => {
        const players = snapshot.docs.map((d) => ({
          id: d.id,
          ...sanitize(d.data()),
        }));

        const fingerprint = JSON.stringify(players);
        if (lastPlayersRef.current === fingerprint) return;
        lastPlayersRef.current = fingerprint;

        dispatch(
          fetchMatchPlayerRatingsAction({
            groupId: gid,
            matchId: mid,
            data: players,
          }),
        );
      },
      logError("/players"),
    );

    // 2. MOTM tally on the match doc.
    const unsubMotm = onSnapshot(
      doc(clientDB, "groups", gid, "seasons", year, "playerRatings", mid),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = sanitize(snapshot.data());
        const fingerprint = JSON.stringify(data);
        if (lastMotmRef.current === fingerprint) return;
        lastMotmRef.current = fingerprint;

        dispatch(
          matchMotmVotesAction({ groupId: gid, matchId: mid, data }),
        );
      },
      logError(""),
    );

    return () => {
      unsubPlayers();
      unsubMotm();
    };
  }, [groupId, matchId, currentYear, dispatch]);

  return null;
};
