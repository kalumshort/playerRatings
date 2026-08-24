"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from "@mui/material";
import { LogOut, ChevronRight } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getNavItems } from "./NavItems";

import Login from "../Auth/Login";
import ThemeToggle from "../Theme/ThemeToggle";
import SwitcherTrigger from "../Groups/SwitcherTrigger";
import useUserData from "@/Hooks/useUserData";
import UserProgressPanel from "@/components/client/Gamification/UserProgressPanel";

// import GroupExplorer from "./GroupExplorer";

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

/**
 * Drawer shell. Deliberately holds no Redux subscription of its own.
 *
 * The header renders above the club layout, and that layout's
 * GroupClientInitializer dispatches into the store during its render phase to
 * keep the server HTML and the hydrated tree in agreement. Anything up here
 * that subscribes to the store therefore gets updated mid-render — React's
 * "Cannot update a component while rendering a different component". Keeping
 * the subscriptions inside DrawerBody, which only mounts while the drawer is
 * open, keeps the header out of that render pass entirely.
 */
export default function NavDrawer({ open, onClose, isMobile }: NavDrawerProps) {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? "280px" : "320px",
          // Background comes from the MuiDrawer override; it was pinned to
          // background.default here, i.e. the same colour as the page underneath.
          backdropFilter: "blur(20px)",
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {/* Only while open — the Drawer already unmounts its children when
          closed, which is also what keeps the progress listeners idle. */}
      {open && <DrawerBody onClose={onClose} />}
    </Drawer>
  );
}

function DrawerBody({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { clubSlug } = useParams();
  const { userData } = useUserData();

  const navItems = getNavItems(clubSlug, { isAuthed: Boolean(user) });

  const accentColor = theme.palette.primary.main;

  const handleLogout = async () => {
    onClose();
    // The context's signOut, not firebase's: it also awaits the deletion of the
    // httpOnly session cookie. Signing out of Firebase alone left the cookie in
    // place, so the server still saw a session at "/" and redirected the fan
    // straight back to the club they had just signed out of.
    if (!(await signOut())) return;
    // A full document load, not router.push. Signing out has to drop the RSC
    // cache, the Redux store and every Firestore listener at once — a soft
    // navigation keeps all three, and on a private club the now-unauthorised
    // listeners simply never resolve, which is the hang.
    window.location.assign("/");
  };

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <Box
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        // Signed out, the drawer holds a login form *and* the nav list, which
        // is taller than a phone. Without this the sign-out/theme footer and
        // the lower nav entries are simply unreachable.
        overflowY: "auto",
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        {!user ? (
          <>
            <Login />
            <Divider sx={{ my: 2, opacity: 0.5 }} />
          </>
        ) : (
          /* Level and XP. Above the nav rather than in the footer: it is
             the first thing a returning fan looks for, and the drawer
             unmounts its children when closed, so the two progress
             listeners only run while it is actually open.
             Taps through to the full progress page, and closes the drawer
             on the way so the fan isn't left staring at the nav. */
          <Box sx={{ mb: 2 }}>
            <UserProgressPanel variant="bar" onNavigate={onClose} />
          </Box>
        )}

        {/* Main Nav. Rendered signed out too — a guest who lands on a public
            club otherwise gets a drawer containing nothing but a login form,
            and no way to reach the rest of the site. */}
        <List>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigateTo(item.path)}
                sx={{
                  borderRadius: "12px",
                  "&:hover": { backgroundColor: `${accentColor}15` },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: accentColor }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ variant: "body2" }}
                />
                <ChevronRight size={16} style={{ opacity: 0.3 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {user && (
          <>
            <Divider sx={{ my: 2, opacity: 0.5 }} />
            {userData?.userGroups && <SwitcherTrigger />}
          </>
        )}
      </Box>

      {/* Footer Area */}
      <Box sx={{ mt: "auto", pt: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Theme
          </Typography>
          <ThemeToggle />
        </Box>

        {user && (
          <ListItemButton
            onClick={handleLogout}
            sx={{ borderRadius: "12px", color: "error.main" }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText
              primary="Sign Out"
              primaryTypographyProps={{ fontWeight: 700 }}
            />
          </ListItemButton>
        )}
      </Box>
    </Box>
  );
}
