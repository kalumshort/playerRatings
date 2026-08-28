"use client";

import React, { useState } from "react";
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { joinGroupByCodeClient } from "@/lib/firebase/client-user-actions";

// Must match INVITE_ALPHABET in functions/index.js: no O/0 or I/1, so a code
// read aloud or off a screenshot can't be mistyped into a different one.
const INVITE_ALPHABET = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g;
const INVITE_CODE_LENGTH = 6;

/**
 * Pulls a code out of whatever the user pasted. People share the whole invite
 * link far more often than the bare code, so accept both rather than making
 * them edit the URL down by hand.
 */
export function extractInviteCode(raw: string): string {
  const trimmed = String(raw || "").trim();

  const fromUrl = trimmed.match(/\/join\/([^/?#\s]+)/i);
  const candidate = fromUrl ? fromUrl[1] : trimmed;

  return candidate
    .toUpperCase()
    .replace(INVITE_ALPHABET, "")
    .slice(0, INVITE_CODE_LENGTH);
}

interface InviteCodeEntryProps {
  /** Called after a successful join, e.g. to close the surrounding dialog. */
  onJoined?: () => void;
  /** Show the "HAVE AN INVITE CODE?" heading above the field. */
  showHeading?: boolean;
}

export default function InviteCodeEntry({
  onJoined,
  showHeading = true,
}: InviteCodeEntryProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const isComplete = code.length === INVITE_CODE_LENGTH;

  const handleJoin = async () => {
    if (!isComplete || isJoining) return;

    setIsJoining(true);
    try {
      const result = await joinGroupByCodeClient({ inviteCode: code });

      // The callable throws on every failure path, so a falsy success here
      // means a deployment mismatch rather than a rejected code.
      if (!result?.success) {
        toast.error(result?.message || "That invite code didn't work.");
        return;
      }

      toast.success(
        result.groupName ? `Welcome to ${result.groupName}!` : "You're in!",
      );
      setCode("");
      onJoined?.();

      // Server components gate on membership, so the cache must be dropped
      // before we land on the group page.
      router.refresh();
      if (result.groupSlug) router.push(`/${result.groupSlug}`);
    } catch (err: any) {
      console.error("Join by invite code failed:", err);
      toast.error(err?.message || "That invite code didn't work.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Box>
      {showHeading && (
        <Typography
          variant="caption"
          sx={{
            mb: 1.5,
            display: "block",
            fontWeight: 800,
            color: "text.secondary",
            letterSpacing: 1,
          }}
        >
          HAVE AN INVITE CODE?
        </Typography>
      )}

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          value={code}
          // Paste a link or type the code — both land in the same place.
          onChange={(e) => setCode(extractInviteCode(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin();
          }}
          disabled={isJoining}
          placeholder="AB3K9P"
          inputProps={{
            "aria-label": "Invite code",
            autoCapitalize: "characters",
            autoCorrect: "off",
            spellCheck: false,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: "background.paper",
            },
            "& input": {
              fontFamily: "monospace",
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: "uppercase",
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleJoin}
          disabled={!isComplete || isJoining}
          sx={{
            borderRadius: "12px",
            fontWeight: 900,
            px: 3,
            minWidth: "100px",
          }}
        >
          {isJoining ? <CircularProgress size={20} /> : "JOIN"}
        </Button>
      </Stack>

      <Typography
        variant="caption"
        sx={{ mt: 1, display: "block", color: "text.disabled" }}
      >
        6 characters, or paste the full invite link.
      </Typography>
    </Box>
  );
}
