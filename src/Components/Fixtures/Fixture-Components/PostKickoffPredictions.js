import React from "react";
import ScorePredictionResults from "./ScorePredictionResults";

import LineupPredictor from "./LineupPredicter/LineupPredictor";

export default function PostKickoffPredictions({ fixture }) {
  return (
    <>
      <ScorePredictionResults fixture={fixture}></ScorePredictionResults>
      <LineupPredictor fixture={fixture} readOnly={true} />
    </>
  );
}
