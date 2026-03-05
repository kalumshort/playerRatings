"use client";

import { Tooltip, tooltipClasses, Zoom } from "@mui/material";
import { styled } from "@mui/material/styles";

export const HtmlTooltip = styled(({ className, ...props }: any) => (
  <Tooltip
    {...props}
    TransitionComponent={Zoom}
    classes={{ popper: className }}
  />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "12px",
    padding: "12px",
    boxShadow: theme.shadows[4],
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.paper,
  },
}));
