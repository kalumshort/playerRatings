import { styled } from "@mui/material/styles";

export const GlobalContainer = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.default, // Set dark/light background for the whole page
  color: theme.palette.text.primary,
  transition: "background-color 0.3s ease, color 0.3s ease",
  minHeight: "100vh",
  [theme.breakpoints.up("md")]: {
    // Apply marginTop only on large screens
    paddingTop: "90px",
  },
}));

export const ContentContainer = styled("div")(({ theme }) => ({
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderRadius: "8px",
  boxShadow: theme.shadows[1],
}));

export const InnerContent = styled("div")(({ theme }) => ({
  background:
    theme.palette.mode === "light"
      ? "#ededed" // slightly darker than paper (#f7f7f7)
      : "#242424", // slightly lighter than paper (#1e1e1e)
  color: theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius,
  [theme.breakpoints.up("md")]: {
    // Apply marginTop only on large screens
    paddingRight: "250px",
    paddingLeft: "250px",
  },
  padding: "16px",
  margin: "8px 0",
}));
