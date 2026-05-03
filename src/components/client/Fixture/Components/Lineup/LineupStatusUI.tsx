import {
  Whatshot,
  AcUnit,
  ArrowDownward,
  InfoOutlined,
  Close,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Fade,
  Stack,
  alpha,
  useTheme,
} from "@mui/material";

// Small status badge that appears over player heads
export const StatusBadge = ({ status, visible }: any) => {
  const theme = useTheme();
  if (!visible || !status) return null;

  let icon = null;
  let color = "";

  if (status.wantsSubOut) {
    icon = <ArrowDownward sx={{ fontSize: 16 }} />;
    color = theme.palette.error.main;
  } else if (status.isHot) {
    icon = <Whatshot sx={{ fontSize: 16 }} />;
    color = theme.palette.form.poor;
  } else if (status.isCold) {
    icon = <AcUnit sx={{ fontSize: 16 }} />;
    color = theme.palette.form.inForm;
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
      <Paper
        variant="pill"
        onClick={() => setOpen(true)}
        sx={{
          px: 1.5,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <InfoOutlined sx={{ color: "common.white", fontSize: 16, mr: 0.5 }} />
        <Typography variant="caption" sx={{ color: "common.white" }}>
          KEY
        </Typography>
      </Paper>
    );

  return (
    <Paper
      variant="sm"
      sx={{
        p: 2,
        minWidth: 160,
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
        bgcolor: color,
      }}
    >
      {icon}
    </Box>
    <Typography variant="caption">{label}</Typography>
  </Stack>
);
