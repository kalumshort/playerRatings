"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Paper,
  Container,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Lock, ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { joinGroupByCodeClient } from "@/lib/firebase/client-user-actions";
import type { InvitePreview } from "@/lib/firebase/firebase-admin-queries";
import Login from "../Auth/Login";

interface JoinInviteClientProps {
  preview: InvitePreview;
  isLoggedIn: boolean;
  alreadyMember: boolean;
}

// Copy for the three ways an invite can be unusable. The server collapses
// "never existed" and "deactivated" into `invalid` on purpose.
const FAILURE_COPY: Record<string, { title: string; body: string }> = {
  invalid: {
    title: "This invite isn't valid",
    body: "The link may have been deactivated, or the code was mistyped. Ask whoever invited you for a fresh link.",
  },
  expired: {
    title: "This invite has expired",
    body: "Invite links can be set to run out after a while. Ask the club owner to send you a new one.",
  },
  exhausted: {
    title: "This invite is used up",
    body: "This link hit the number of joins its owner allowed. Ask them for a new one.",
  },
};

export default function JoinInviteClient({
  preview,
  isLoggedIn,
  alreadyMember,
}: JoinInviteClientProps) {
  const router = useRouter();
  const { user, userLoading } = useAuth();

  const [isJoining, setIsJoining] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // Whether the visitor still needed to authenticate when this page rendered.
  // If so, signing in *is* their intent to join, so we redeem automatically
  // rather than making them press Join a second time.
  const neededAuthOnArrival = useRef(!isLoggedIn);
  const hasAttempted = useRef(false);

  const groupHref = preview.valid && preview.groupSlug ? `/${preview.groupSlug}` : "/";

  const redeem = useCallback(async () => {
    if (!preview.valid || hasAttempted.current) return;
    hasAttempted.current = true;
    setIsJoining(true);

    try {
      const result = await joinGroupByCodeClient({ inviteCode: preview.code });
      toast.success(result.message || `Welcome to ${preview.groupName}!`);

      // The server components behind groupHref read the session cookie, so the
      // cache has to be dropped before we navigate or they'll render the
      // guest view for a user who just joined.
      router.refresh();
      router.push(groupHref);
    } catch (err: any) {
      const message = String(err?.message || "");

      // Redeeming twice is a normal outcome of re-opening a link, not an error.
      if (message.includes("already a member")) {
        router.refresh();
        router.push(groupHref);
        return;
      }

      hasAttempted.current = false;
      setFailure(message || "We couldn't add you to this club.");
      setIsJoining(false);
    }
  }, [preview, groupHref, router]);

  // Auto-redeem once auth completes for someone who arrived logged out.
  // Gated on userLoading so the session cookie has been minted first —
  // otherwise the group page we land on still sees an anonymous visitor.
  useEffect(() => {
    if (!user || userLoading) return;
    if (!neededAuthOnArrival.current) return;
    if (alreadyMember) return;

    redeem();
  }, [user, userLoading, alreadyMember, redeem]);

  // --- Dead ends -----------------------------------------------------------

  if (!preview.valid) {
    // Explicit narrow: the project builds with `strict: false`, which stops TS
    // discriminating this union on the falsy branch on its own.
    const { reason } = preview as Extract<InvitePreview, { valid: false }>;
    const copy = FAILURE_COPY[reason] ?? FAILURE_COPY.invalid;

    return (
      <Shell>
        <IconBadge tone="error">
          <CircleAlert size={38} />
        </IconBadge>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.5}>
          {copy.title}
        </Typography>
        <Typography color="text.secondary" sx={{ px: 2 }}>
          {copy.body}
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push("/")}
          sx={{ mt: 2, fontWeight: 800 }}
        >
          Browse clubs
        </Button>
      </Shell>
    );
  }

  if (alreadyMember) {
    return (
      <Shell>
        <GroupCrest preview={preview} />
        <IconBadge tone="success">
          <CircleCheck size={38} />
        </IconBadge>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.5}>
          You're already in
        </Typography>
        <Typography color="text.secondary">
          You're a member of <strong>{preview.groupName}</strong>.
        </Typography>
        <Button
          variant="contained"
          endIcon={<ArrowRight size={18} />}
          onClick={() => router.push(groupHref)}
          sx={{ mt: 2, fontWeight: 800 }}
        >
          Go to {preview.groupName}
        </Button>
      </Shell>
    );
  }

  // --- The invite itself ---------------------------------------------------

  const isBusy = isJoining || (Boolean(user) && neededAuthOnArrival.current);

  return (
    <Shell>
      <GroupCrest preview={preview} />

      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          letterSpacing: 1.5,
          color: "primary.main",
        }}
      >
        YOU'VE BEEN INVITED
      </Typography>

      <Typography variant="h5" fontWeight={900} letterSpacing={-0.5}>
        {preview.groupName}
      </Typography>

      <Typography color="text.secondary" sx={{ px: 2 }}>
        {preview.role === "admin"
          ? "You've been invited to help run this club. Rate players, predict line-ups and vote every match day."
          : "Join the club to rate players, predict line-ups and vote every match day."}
      </Typography>

      {failure && (
        <Typography
          variant="body2"
          sx={{ color: "error.main", fontWeight: 600, px: 2 }}
        >
          {failure}
        </Typography>
      )}

      {user ? (
        <Button
          variant="contained"
          size="large"
          disabled={isBusy}
          onClick={redeem}
          startIcon={
            isBusy ? <CircularProgress size={18} color="inherit" /> : null
          }
          endIcon={!isBusy ? <ArrowRight size={18} /> : null}
          sx={{ mt: 2, fontWeight: 900, px: 4 }}
        >
          {isBusy ? "Joining..." : `Join ${preview.groupName}`}
        </Button>
      ) : (
        <Box sx={{ width: "100%", mt: 1 }}>
          <Divider sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              SIGN IN TO JOIN
            </Typography>
          </Divider>

          {/* redirectTo={null}: this page redeems the code and routes into the
              group itself, so the auth components must not navigate to "/". */}
          <Login mode="auth" redirectTo={null} />
        </Box>
      )}
    </Shell>
  );
}

// --- Layout pieces ---------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <Paper
          sx={{
            p: { xs: 3, sm: 5 },
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 1.5,
          }}
        >
          {children}
        </Paper>
      </Box>
    </Container>
  );
}

function GroupCrest({ preview }: { preview: Extract<InvitePreview, { valid: true }> }) {
  return (
    <Avatar
      src={preview.groupLogo?.replace(/"/g, "") || undefined}
      sx={{
        width: 88,
        height: 88,
        mb: 1,
        borderRadius: "20px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
      variant="rounded"
    >
      <Lock size={32} />
    </Avatar>
  );
}

function IconBadge({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: `${tone}.main`,
        color: `${tone}.contrastText`,
        mb: 1,
      }}
    >
      {children}
    </Box>
  );
}
