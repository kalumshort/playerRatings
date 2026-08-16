import { AppBar, styled, Box } from "@mui/material";

// Background and border deliberately come from the MuiAppBar theme override,
// not from here: this used to set `border: "none"`, which deleted the bar's
// bottom divider and left the header with no edge against the page.
export const GlassAppBar = styled(AppBar)(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  borderRadius: 0,
  zIndex: theme.zIndex.appBar + 1,
  margin: 0,
}));

export const NavContainer = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
});
