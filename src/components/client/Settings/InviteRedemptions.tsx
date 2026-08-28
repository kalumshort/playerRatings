"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Stack, CircularProgress } from "@mui/material";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

interface InviteRedemptionsProps {
  inviteId: string;
}

const formatJoinedAt = (joinedAt: any): string => {
  const millis =
    typeof joinedAt?.toMillis === "function"
      ? joinedAt.toMillis()
      : typeof joinedAt?.seconds === "number"
        ? joinedAt.seconds * 1000
        : null;

  if (!millis) return "";

  return new Date(millis).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

/**
 * Lists who redeemed a given invite. Written only by joinGroupByCode via the
 * Admin SDK; firestore.rules exposes the read to the group owner alone.
 */
export default function InviteRedemptions({ inviteId }: InviteRedemptionsProps) {
  const db = getFirestore();
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!inviteId) return;

    const unsubscribe = onSnapshot(
      collection(db, "groupInvites", inviteId, "redemptions"),
      (snapshot) => {
        setRedemptions(
          snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
            .sort((a, b) => (b.joinedAt?.seconds || 0) - (a.joinedAt?.seconds || 0)),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Redemption listener error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [inviteId, db]);

  if (loading) {
    return (
      <Box sx={{ py: 1.5, textAlign: "center" }}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  if (redemptions.length === 0) {
    return (
      <Typography
        variant="caption"
        sx={{ display: "block", py: 1.5, color: "text.disabled" }}
      >
        {/* Codes redeemed before this history existed still count toward
            usageCount, so a used code can legitimately have no entries. */}
        No join records for this code yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75} sx={{ py: 1.5 }}>
      {redemptions.map((entry) => (
        <Box
          key={entry.id}
          sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {entry.displayName || "Fan"}
            {entry.role === "admin" && (
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 0.75, color: "warning.main", fontWeight: 800 }}
              >
                ADMIN
              </Typography>
            )}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {formatJoinedAt(entry.joinedAt)}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
