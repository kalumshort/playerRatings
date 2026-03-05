import { AppBar, styled, Box } from "@mui/material";

export const GlassAppBar = styled(AppBar)(({ theme }) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  background: theme.palette.background.paper,
  borderRadius: 0,
  zIndex: theme.zIndex.appBar + 1,
  margin: 0,
  border: "none",
}));

export const NavContainer = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
});
