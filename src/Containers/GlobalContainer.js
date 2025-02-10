import { styled } from "@mui/material/styles";

export const GlobalContainer = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.default, // Set dark/light background for the whole page
  color: theme.palette.text.primary,
  transition: "background-color 0.3s ease, color 0.3s ease",
  minHeight: "100vh",
  paddingTop: "5px",
}));

export const ContentContainer = styled("div")(({ theme }) => ({
  background: theme.palette.background.gradient,
  color: theme.palette.text.primary,
  borderRadius: "8px",
  boxShadow: theme.shadows[1],
}));
