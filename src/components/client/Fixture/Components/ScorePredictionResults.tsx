"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Modal,
  Fade,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  BarChartRounded,
  CloseRounded,
  SportsSoccerRounded,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";

interface ScoreResultsProps {
  fixture: any;
  storedUsersPredictedScore?: string;
  groupId: string;
}

export default function ScorePredictionResults({
  fixture,
  storedUsersPredictedScore,
  groupId,
}: ScoreResultsProps) {
  const theme = useTheme() as any;
  const [open, setOpen] = useState(false);
  const matchId = String(fixture.id);

  // 1. SELECTOR
  const matchPredictions = useSelector(
    (state: RootState) => state.predictions.byGroupId[groupId]?.[matchId],
  );

  // 2. DATA PROCESSING
  const scoreData = useMemo(() => {
    const data = matchPredictions?.scorePredictions || {};
    const totalVotes = Object.values(data).reduce(
      (a: any, b: any) => a + b,
      0,
    ) as number;

    return Object.entries(data)
      .map(([score, count]: [string, any]) => ({
        score,
        count,
        percent: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [matchPredictions]);

  const hasData = scoreData.length > 0;
  const consensusScore = hasData ? scoreData[0]?.score : "-";

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // Matches the height and spacing of the input component
          justifyContent: "space-between",
          height: "100%",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* --- HEADER --- */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <SportsSoccerRounded color="primary" sx={{ fontSize: 20 }} />
          <Typography
            variant="h4"
            sx={{
              letterSpacing: 1.5,
              fontWeight: 900,
              fontSize: "0.75rem",
            }}
          >
            SCORE CONSENSUS
          </Typography>
        </Stack>

        {/* --- MAIN STATS AREA --- */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ width: "100%", my: 2 }}
        >
          <BigStat
            label="YOU"
            value={storedUsersPredictedScore || "-"}
            highlight
          />
          <Typography
            variant="h6"
            sx={{ color: "text.disabled", fontWeight: 900 }}
          >
            VS
          </Typography>
          <BigStat label="GROUP" value={consensusScore} />
        </Stack>

        {/* --- ACTION BUTTON --- */}
        <Button
          fullWidth
          onClick={() => setOpen(true)}
          disabled={!hasData}
          startIcon={<BarChartRounded />}
          sx={{
            ...theme.clay?.button,
            borderRadius: "16px",
            py: 1.5,
            fontWeight: 900,
            fontSize: "0.75rem",
            bgcolor: "background.paper",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {hasData ? "VIEW BREAKDOWN" : "AWAITING VOTES"}
        </Button>
      </Paper>

      {/* --- ANALYTICS MODAL --- */}
      <Modal open={open} onClose={() => setOpen(false)} closeAfterTransition>
        <Fade in={open}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90vw",
              maxWidth: 400,
              bgcolor: "background.paper",
              borderRadius: "28px",
              boxShadow: 24,
              p: 3,
              outline: "none",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <Typography variant="h6" fontWeight={900}>
                SCORE DISTRIBUTION
              </Typography>
              <IconButton onClick={() => setOpen(false)} size="small">
                <CloseRounded />
              </IconButton>
            </Stack>

            <Stack spacing={2}>
              {scoreData.map((item) => (
                <Box key={item.score}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 0.5 }}
                  >
                    <Typography variant="caption" fontWeight={900}>
                      {item.score}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={900}
                      color="primary"
                    >
                      {item.percent}%
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      width: "100%",
                      height: 8,
                      bgcolor: "action.hover",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${item.percent}%`,
                        height: "100%",
                        bgcolor:
                          item.score === storedUsersPredictedScore
                            ? "secondary.main"
                            : "primary.main",
                        transition: "width 1s ease-in-out",
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

const BigStat = ({ label, value, highlight = false }: any) => {
  const theme = useTheme() as any;
  return (
    <Box
      sx={{
        ...theme.clay?.box,
        flex: 1,
        textAlign: "center",
        p: 2,
        borderRadius: "20px",
        border: highlight
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.divider}`,
        bgcolor: "background.default",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 900,
          color: "text.secondary",
          mb: 0.5,
          fontSize: "0.65rem",
        }}
      >
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        {value}
      </Typography>
    </Box>
  );
};
