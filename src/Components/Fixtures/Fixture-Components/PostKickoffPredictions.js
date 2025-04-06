import React from "react";
import ScorePredictionResults from "./ScorePredictionResults";

import LineupPredictor from "./LineupPredicter/LineupPredictor";

export default function PostKickoffPredictions({ fixture }) {
  return (
    <div className="pkopredictions-container">
      <ScorePredictionResults fixture={fixture} />
      <LineupPredictor fixture={fixture} readOnly={true} />
    </div>
  );
}
