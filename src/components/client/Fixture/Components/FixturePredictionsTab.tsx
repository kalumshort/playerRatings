"use client";

import React from "react";
import { Stack, Box } from "@mui/material";
import WinnerPredict from "./WinnerPredict";
import ScorePrediction from "./ScorePrediction";
import PreMatchMOTM from "./PreMatchMOTM";

interface FixturePredictionsTabProps {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
  isPreMatch: boolean;
  isGuestView: boolean;
}

const FixturePredictionsTab = ({
  fixture,
  groupId,
  currentYear,
  groupData,
  isPreMatch,
  isGuestView,
}: FixturePredictionsTabProps) => {
  return (
    <Stack
      // Switch to column on mobile, but keep horizontal row on tablet/desktop
      direction={{ xs: "column", md: "row" }}
      spacing={3}
      sx={{
        width: "100%",
        // "stretch" ensures all children expand to the height of the tallest item
        alignItems: "stretch",
        justifyContent: "center",
        px: { xs: 2, md: 0 },
      }}
    >
      {/* WRAPPER BOXES: 
          1. flex: 1 ensures equal width on Desktop
          2. display: flex + flexDirection: column ensures internal content stretches 
      */}
      {[WinnerPredict, ScorePrediction, PreMatchMOTM].map(
        (Component, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              // This is the key: it forces the inner component to fill the box
              "& > *": {
                flexGrow: 1,
                height: "100%",
              },
            }}
          >
            <Component
              fixture={fixture}
              groupId={groupId}
              currentYear={currentYear}
              groupData={groupData}
              isPreMatch={isPreMatch}
              isGuestView={isGuestView}
            />
          </Box>
        ),
      )}
    </Stack>
  );
};

export default FixturePredictionsTab;
