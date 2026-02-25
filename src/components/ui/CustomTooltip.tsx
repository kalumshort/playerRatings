import { getRatingColor } from "@/lib/utils/football-logic";
import { Paper, Stack, Typography } from "@mui/material";

export const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedDate = data.date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    return (
      <Paper
        elevation={8}
        sx={{
          bgcolor: "rgba(26, 28, 30, 0.95)", // Deep Dark Slate
          color: "#fff",
          p: 2,
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
          minWidth: 160,
        }}
      >
        <Typography
          variant="caption"
          sx={{ opacity: 0.6, fontWeight: 700, display: "block", mb: 1 }}
        >
          {formattedDate}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          mb={1}
        >
          <Typography variant="caption" fontWeight={700}>
            vs
          </Typography>
          <img
            src={data.opponentLogo}
            style={{ width: 24, height: 24, objectFit: "contain" }}
          />
          <Typography
            variant="body2"
            fontWeight={800}
            noWrap
            sx={{ maxWidth: 80 }}
          >
            {data.opponentName}
          </Typography>
        </Stack>

        <Typography
          variant="h4"
          fontWeight={900}
          sx={{ color: getRatingColor(data.rating), my: 0.5 }}
        >
          {data.rating}
        </Typography>

        <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 800 }}>
          RATING
        </Typography>
      </Paper>
    );
  }
  return null;
};
