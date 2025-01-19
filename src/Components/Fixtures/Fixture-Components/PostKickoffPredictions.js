import React, { useState } from "react";
import ScorePredictionResults from "./ScorePredictionResults";
import { IconButton } from "@mui/material";

import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { CommunityTeamStats } from "./LineupPredicter/LineupPredictor";

export default function PostKickoffPredictions({ fixture }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <ContentContainer style={{ width: "100%", margin: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2
          style={{ fontSize: "20px", fontWeight: "500", letterSpacing: "2px" }}
        >
          Predictions
        </h2>
        <IconButton
          onClick={toggleExpand}
          aria-label="toggle expand"
          color="primary"
          size="large"
        >
          {isExpanded ? (
            <ExpandLess size="large" />
          ) : (
            <ExpandMore size="large" />
          )}
        </IconButton>
      </div>

      <div
        style={{
          width: "100%",
          overflow: "hidden", // Ensures hidden content doesn't overflow
          maxHeight: isExpanded ? "1000px" : "0", // Transition between 0 and a fixed max height
          opacity: isExpanded ? 1 : 0, // Fade in/out during transition
          transition: "max-height 1s ease, opacity 1s ease", // Smooth transition for max-height and opacity
        }}
      >
        <ScorePredictionResults fixture={fixture}></ScorePredictionResults>
        <CommunityTeamStats fixture={fixture} />
      </div>
    </ContentContainer>
  );
}
