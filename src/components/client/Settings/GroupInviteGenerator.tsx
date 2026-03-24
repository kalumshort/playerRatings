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
} from "@mui/material";
import {
  Copy,
  RefreshCw,
  Check,
  Trash2,
  History,
  AlertTriangle,
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

interface GroupInviteGeneratorProps {
  groupId: string;
}

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
    () => invites.filter((i) => i.active !== false),
    [invites],
  );

  const inactiveCount = useMemo(
    () => invites.filter((i) => i.active === false).length,
    [invites],
  );

  // 3. Actions
  const generateCode = async () => {
    setGenerating(true);
    const functions = getFunctions();
    const createInvite = httpsCallable(functions, "createInviteCode");

    try {
      await createInvite({ groupId });
    } catch (error) {
      console.error("Invite Generation Error:", error);
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
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
          startIcon={
            generating ? (
              <CircularProgress size={14} />
            ) : (
              <RefreshCw size={14} />
            )
          }
          onClick={generateCode}
          disabled={generating}
          sx={{ fontWeight: 700 }}
        >
          {generating ? "Generating..." : "New Code"}
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
            {activeInvites.map((invite) => (
              <Fade in={true} key={invite.id}>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: theme.shadows[1],
                    borderRadius: theme.shape.borderRadius,
                  }}
                >
                  <Box>
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
                    <Typography
                      variant="caption"
                      sx={{ color: "success.main", fontWeight: 600 }}
                    >
                      ● Active{" "}
                      {invite.usageCount > 0 && `• ${invite.usageCount} joins`}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Tooltip
                      title={copiedId === invite.id ? "Copied!" : "Copy Code"}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(invite.id, invite.id)}
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

                    <Tooltip title="Deactivate">
                      <IconButton
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
                </Paper>
              </Fade>
            ))}
          </Stack>
        )}

        {inactiveCount > 0 && (
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
              {inactiveCount} EXPIRED CODES IN HISTORY
            </Typography>
          </Box>
        )}
      </Box>

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
            This will expire the code <strong>{deactivateId}</strong>{" "}
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
