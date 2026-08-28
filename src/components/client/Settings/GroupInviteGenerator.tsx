"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Collapse,
  Divider,
} from "@mui/material";
import {
  Copy,
  RefreshCw,
  Check,
  Trash2,
  History,
  AlertTriangle,
  Share2,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import InviteRedemptions from "./InviteRedemptions";

interface GroupInviteGeneratorProps {
  groupId: string;
}

// Mirrors INVITABLE_ROLES in functions/helperFunctions.js. "owner" is absent by
// design — an owner code would be a transferable bearer token for the group.
const ROLE_OPTIONS = [
  { value: "member", label: "Member", hint: "Can vote and rate players" },
  { value: "admin", label: "Admin", hint: "Can also manage the club" },
];

const EXPIRY_OPTIONS = [
  { value: "", label: "Never expires" },
  { value: "1", label: "24 hours" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
];

const USES_OPTIONS = [
  { value: "", label: "Unlimited" },
  { value: "1", label: "1 use" },
  { value: "5", label: "5 uses" },
  { value: "25", label: "25 uses" },
];

const toMillis = (value: any): number | null => {
  if (!value) return null;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return null;
};

/** An invite can be spent or timed out before any server write flips `active`. */
const isSpent = (invite: any) => {
  if (invite.active === false) return true;

  const expiresAt = toMillis(invite.expiresAt);
  if (expiresAt && expiresAt <= Date.now()) return true;

  return invite.maxUses != null && (invite.usageCount || 0) >= invite.maxUses;
};

const formatExpiry = (invite: any): string | null => {
  const expiresAt = toMillis(invite.expiresAt);
  if (!expiresAt) return null;

  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) return "Expired";

  const hours = Math.round(remainingMs / 3600000);
  if (hours < 1) return "Expires in under an hour";
  if (hours < 24) return `Expires in ${hours}h`;

  return `Expires in ${Math.round(hours / 24)}d`;
};

export default function GroupInviteGenerator({
  groupId,
}: GroupInviteGeneratorProps) {
  const theme = useTheme();
  const db = getFirestore();

  // State
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New-code configuration
  const [configOpen, setConfigOpen] = useState(false);
  const [role, setRole] = useState("member");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [label, setLabel] = useState("");

  // Deactivation Modal State
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // 1. Listen to all invites for this group (Active and Inactive)
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "groupInvites"),
      where("groupId", "==", groupId),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setInvites(
        data.sort(
          (a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds,
        ),
      );
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, db]);

  // 2. Performance: Memoize filtered lists
  const activeInvites = useMemo(
    () => invites.filter((i) => !isSpent(i)),
    [invites],
  );

  const retiredCount = useMemo(
    () => invites.filter((i) => isSpent(i)).length,
    [invites],
  );

  // 3. Actions
  const generateCode = async () => {
    setGenerating(true);
    const functions = getFunctions();
    const createInvite = httpsCallable(functions, "createInviteCode");

    try {
      await createInvite({
        groupId,
        role,
        // "" means the owner left it unlimited; the function treats absent as no cap.
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        label: label.trim() || undefined,
      });

      setConfigOpen(false);
      setLabel("");
    } catch (error: any) {
      console.error("Invite Generation Error:", error);
      toast.error(error?.message || "Couldn't create an invite link. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateId) return;
    setIsDeactivating(true);
    try {
      const inviteRef = doc(db, "groupInvites", deactivateId);
      await updateDoc(inviteRef, {
        active: false,
        deactivatedAt: serverTimestamp(),
      });
      setDeactivateId(null);
    } catch (e) {
      console.error("Deactivation Error", e);
      toast.error("Couldn't deactivate that invite. Try again.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const inviteUrl = (code: string) =>
    typeof window === "undefined" ? code : `${window.location.origin}/join/${code}`;

  const handleCopy = (code: string) => {
    // The link, not the bare code — it's what people actually paste into a chat,
    // and it carries the group preview for whoever receives it.
    navigator.clipboard.writeText(inviteUrl(code));
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (code: string, groupName?: string) => {
    try {
      await navigator.share({
        title: groupName ? `Join ${groupName} on 11votes` : "Join me on 11votes",
        text: "Rate players and vote every match day.",
        url: inviteUrl(code),
      });
    } catch (error: any) {
      // AbortError just means they dismissed the sheet.
      if (error?.name !== "AbortError") handleCopy(code);
    }
  };

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 800,
            ml: 0.5,
            letterSpacing: 1,
          }}
        >
          INVITE SYSTEM
        </Typography>
        <Button
          size="small"
          variant="text"
          startIcon={<RefreshCw size={14} />}
          onClick={() => setConfigOpen(true)}
          sx={{ fontWeight: 700 }}
        >
          New Code
        </Button>
      </Stack>

      <Box>
        {loading ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : activeInvites.length === 0 ? (
          <Box sx={{ py: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No active codes. Generate one to invite members.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {activeInvites.map((invite) => {
              const expiryText = formatExpiry(invite);
              const isExpanded = expandedId === invite.id;

              return (
                <Fade in={true} key={invite.id}>
                  <Paper
                    sx={{
                      p: 2,
                      boxShadow: theme.shadows[1],
                      borderRadius: theme.shape.borderRadius,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 900,
                            letterSpacing: 2,
                            lineHeight: 1,
                            color: "text.primary",
                          }}
                        >
                          {invite.id}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                          flexWrap="wrap"
                          sx={{ mt: 0.75, rowGap: 0.5 }}
                        >
                          {invite.role === "admin" && (
                            <Chip
                              size="small"
                              label="ADMIN"
                              color="warning"
                              sx={{ fontWeight: 800, height: 20 }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            sx={{ color: "success.main", fontWeight: 600 }}
                          >
                            ●{" "}
                            {invite.maxUses != null
                              ? `${invite.usageCount || 0}/${invite.maxUses} used`
                              : invite.usageCount > 0
                                ? `${invite.usageCount} joins`
                                : "Active"}
                          </Typography>
                          {expiryText && (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.disabled", fontWeight: 600 }}
                            >
                              • {expiryText}
                            </Typography>
                          )}
                          {invite.label && (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.disabled", fontStyle: "italic" }}
                            >
                              • {invite.label}
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={0.5}>
                        <Tooltip
                          title={
                            copiedId === invite.id ? "Copied!" : "Copy invite link"
                          }
                        >
                          <IconButton
                            aria-label="Copy invite link"
                            size="small"
                            onClick={() => handleCopy(invite.id)}
                            sx={{
                              color:
                                copiedId === invite.id
                                  ? "success.main"
                                  : "primary.main",
                            }}
                          >
                            {copiedId === invite.id ? (
                              <Check size={20} />
                            ) : (
                              <Copy size={20} />
                            )}
                          </IconButton>
                        </Tooltip>

                        {canShare && (
                          <Tooltip title="Share">
                            <IconButton
                              aria-label="Share invite link"
                              size="small"
                              onClick={() =>
                                handleShare(invite.id, invite.groupName)
                              }
                              sx={{ color: "primary.main" }}
                            >
                              <Share2 size={20} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Deactivate">
                          <IconButton
                            aria-label="Deactivate invite link"
                            size="small"
                            onClick={() => setDeactivateId(invite.id)}
                            sx={{
                              color: "text.disabled",
                              "&:hover": { color: "error.main" },
                            }}
                          >
                            <Trash2 size={20} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>

                    {(invite.usageCount || 0) > 0 && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        <Button
                          size="small"
                          startIcon={<Users size={14} />}
                          endIcon={
                            isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )
                          }
                          onClick={() =>
                            setExpandedId(isExpanded ? null : invite.id)
                          }
                          sx={{ fontWeight: 700, color: "text.secondary" }}
                        >
                          Who joined
                        </Button>
                        <Collapse in={isExpanded} unmountOnExit>
                          <InviteRedemptions inviteId={invite.id} />
                        </Collapse>
                      </>
                    )}
                  </Paper>
                </Fade>
              );
            })}
          </Stack>
        )}

        {retiredCount > 0 && (
          <Box
            sx={{
              mt: 1.5,
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <History size={12} color={theme.palette.text.disabled} />
            <Typography
              variant="caption"
              sx={{ color: "text.disabled", fontWeight: 600 }}
            >
              {retiredCount} RETIRED{" "}
              {retiredCount === 1 ? "CODE" : "CODES"} IN HISTORY
            </Typography>
          </Box>
        )}
      </Box>

      {/* New code configuration */}
      <Dialog
        open={configOpen}
        onClose={() => !generating && setConfigOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>New invite code</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={generating}
              helperText={ROLE_OPTIONS.find((r) => r.value === role)?.hint}
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Expires"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              disabled={generating}
            >
              {EXPIRY_OPTIONS.map((option) => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Max uses"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              disabled={generating}
            >
              {USES_OPTIONS.map((option) => (
                <MenuItem key={option.label} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Label (optional)"
              placeholder="e.g. WhatsApp group"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={generating}
              inputProps={{ maxLength: 40 }}
              helperText="Only you see this — it helps you tell codes apart."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfigOpen(false)}
            disabled={generating}
            sx={{ fontWeight: 700, color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            onClick={generateCode}
            variant="contained"
            disabled={generating}
            startIcon={
              generating && <CircularProgress size={16} color="inherit" />
            }
            sx={{ fontWeight: 800 }}
          >
            {generating ? "Generating..." : "Create code"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        open={Boolean(deactivateId)}
        onClose={() => !isDeactivating && setDeactivateId(null)}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 800,
          }}
        >
          <AlertTriangle color={theme.palette.warning.main} /> Deactivate Code?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will retire the code <strong>{deactivateId}</strong>{" "}
            immediately. New members will no longer be able to use it to join
            this group.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeactivateId(null)}
            disabled={isDeactivating}
            sx={{ fontWeight: 700, color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeactivate}
            variant="contained"
            color="error"
            disabled={isDeactivating}
            startIcon={
              isDeactivating && <CircularProgress size={16} color="inherit" />
            }
          >
            {isDeactivating ? "Deactivating..." : "Confirm Deactivation"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
