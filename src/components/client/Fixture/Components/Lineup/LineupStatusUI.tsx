import {
  Whatshot,
  AcUnit,
  ArrowDownward,
  InfoOutlined,
  Close,
} from "@mui/icons-material";
import { Box, Typography, IconButton, Paper, Fade, Stack } from "@mui/material";

// Small status badge that appears over player heads
export const StatusBadge = ({ status, visible }: any) => {
  if (!visible || !status) return null;

  let icon = null;
  let color = "";

  if (status.wantsSubOut) {
    icon = <ArrowDownward sx={{ fontSize: 16 }} />;
    color = "#d32f2f";
  } else if (status.isHot) {
    icon = <Whatshot sx={{ fontSize: 16 }} />;
    color = "linear-gradient(135deg, #ff9800, #f44336)";
  } else if (status.isCold) {
    icon = <AcUnit sx={{ fontSize: 16 }} />;
    color = "linear-gradient(135deg, #4fc3f7, #0288d1)";
  }

  if (!icon) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: -15,
        left: "50%",
        transform: "translateX(-50%)",
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid white",
        boxShadow: 3,
        zIndex: 10,
        animation: "bob 2s ease-in-out infinite",
        "@keyframes bob": { "0%, 100%": { top: -15 }, "50%": { top: -19 } },
      }}
    >
      {icon}
    </Box>
  );
};

// Collapsible Legend
export const StatusLegend = ({ open, setOpen, active }: any) => {
  if (!active) return <Box />;

  if (!open)
    return (
      <Box
        onClick={() => setOpen(true)}
        sx={{
          bgcolor: "rgba(0,0,0,0.4)",
          borderRadius: "20px",
          px: 1.5,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <InfoOutlined sx={{ color: "white", fontSize: 16, mr: 0.5 }} />
        <Typography
          variant="caption"
          sx={{ color: "white", fontWeight: "bold" }}
        >
          KEY
        </Typography>
      </Box>
    );

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: "16px",
        minWidth: 160,
        bgcolor: "background.paper",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography variant="caption" fontWeight={900}>
          STATUS KEY
        </Typography>
        <IconButton size="small" onClick={() => setOpen(false)}>
          <Close fontSize="small" />
        </IconButton>
      </Stack>
      <LegendRow
        icon={<Whatshot sx={{ fontSize: 12 }} />}
        label="Top Performer"
        color="orange"
      />
      <LegendRow
        icon={<AcUnit sx={{ fontSize: 12 }} />}
        label="Struggling"
        color="blue"
      />
      <LegendRow
        icon={<ArrowDownward sx={{ fontSize: 12 }} />}
        label="Fans want Sub"
        color="red"
      />
    </Paper>
  );
};

const LegendRow = ({ icon, label, color }: any) => (
  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
    <Box
      sx={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid white",
        bgcolor: color,
      }}
    >
      {icon}
    </Box>
    <Typography variant="caption">{label}</Typography>
  </Stack>
);
