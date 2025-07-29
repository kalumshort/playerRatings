import React from "react";
import ScorePredictionResults from "./ScorePredictionResults";

import LineupPredictor from "./LineupPredicter/LineupPredictor";
import { selectUserMatchData } from "../../../Selectors/userDataSelectors";
import { useSelector } from "react-redux";

export default function PostKickoffPredictions({ fixture }) {
  const usersMatchData = useSelector(selectUserMatchData(fixture.id));

  const storedUsersPredictedScore = usersMatchData?.ScorePrediction;
  return (
    <div className="pkopredictions-container containerMargin">
      <ScorePredictionResults
        fixture={fixture}
        storedUsersPredictedScore={storedUsersPredictedScore}
      />
      <LineupPredictor fixture={fixture} readOnly={true} />
    </div>
  );
}
