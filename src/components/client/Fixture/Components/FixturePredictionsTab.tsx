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
    <Stack direction={{ xs: "column", md: "row" }}>
      {[WinnerPredict, ScorePrediction, PreMatchMOTM].map(
        (Component, index) => (
          <span key={index}>
            <Component
              fixture={fixture}
              groupId={groupId}
              currentYear={currentYear}
              groupData={groupData}
              isPreMatch={isPreMatch}
              isGuestView={isGuestView}
            />
          </span>
        ),
      )}
    </Stack>
  );
};

export default FixturePredictionsTab;
