import { getRatingColor } from "@/lib/utils/football-logic";
import { Paper, Stack, Typography, Box } from "@mui/material";

export const CustomTooltip = ({
  active,
  payload,
  compareColor,
  primaryColor,
}: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedDate = data.date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    const hasCompare = data.compareName != null;
    const compareHasRating = data.compareRating != null;

    return (
      <Paper
        elevation={8}
        sx={{
          bgcolor: "rgba(26, 28, 30, 0.95)",
          color: "#fff",
          p: 2,
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center",
          minWidth: hasCompare ? 200 : 160,
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
          <img
            src={data.opponentLogo}
            style={{ height: 30, objectFit: "contain" }}
          />
        </Stack>

        {hasCompare ? (
          <Stack direction="row" spacing={2} justifyContent="center" mt={1}>
            <RatingColumn
              label={data.playerName || "Player"}
              rating={data.rating}
              accent={primaryColor}
              useRatingColor
            />
            <RatingColumn
              label={data.compareName}
              rating={compareHasRating ? data.compareRating : null}
              accent={compareColor}
            />
          </Stack>
        ) : (
          <>
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
          </>
        )}
      </Paper>
    );
  }
  return null;
};

function RatingColumn({
  label,
  rating,
  accent,
  useRatingColor,
}: {
  label: string;
  rating: number | null;
  accent: string;
  useRatingColor?: boolean;
}) {
  const color =
    rating == null
      ? "rgba(255,255,255,0.4)"
      : useRatingColor
        ? getRatingColor(rating)
        : accent;

  return (
    <Box sx={{ minWidth: 72 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: accent,
          mx: "auto",
          mb: 0.5,
        }}
      />
      <Typography
        variant="caption"
        sx={{
          display: "block",
          opacity: 0.7,
          fontWeight: 700,
          fontSize: "0.6rem",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: 90,
          mx: "auto",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={900}
        sx={{ color, mt: 0.25, lineHeight: 1 }}
      >
        {rating == null ? "—" : rating.toFixed(1)}
      </Typography>
    </Box>
  );
}
