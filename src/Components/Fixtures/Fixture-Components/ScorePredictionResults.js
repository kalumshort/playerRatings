import React from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { useSelector } from "react-redux";

import { selectPredictionsByMatchId } from "../../../Selectors/predictionsSelectors";
import { useIsMobile, useLocalStorage } from "../../../Hooks/Helper_Functions";

import Barchart from "../../Charts/Barchart";
import Piechart from "../../Charts/Piechart";

export default function ScorePredictionResults({ fixture }) {
  // const dispatch = useDispatch();
  const isMobile = useIsMobile();

  const matchPredictions = useSelector(selectPredictionsByMatchId(fixture.id));
  const storedUsersPredictedScore = useLocalStorage(
    `userPredictedScore-${fixture.id}`
  );

  // Improved data mapping
  const getBarchartData = (data) => {
    return data
      ? Object.entries(data)
          .map(([key, value]) => ({ name: key, value }))
          .sort((a, b) => b.value - a.value) // Sort by value (largest to smallest)
      : [];
  };

  const barchartDataAwayGoals = getBarchartData(matchPredictions?.awayGoals);
  const barchartDataHomeGoals = getBarchartData(matchPredictions?.homeGoals);
  // const barchartDataScoreline = getBarchartData(
  //   matchPredictions?.scorePrecitions
  // );

  // Check if match predictions are loaded
  if (!matchPredictions) {
    return <div>Loading...</div>; // Or a spinner/loading component
  }

  return (
    <ContentContainer className="scorePredictionResultsContainer containerMargin animate__bounceIn">
      <div className="scorePredictionResultsInnerContainer">
        <h1 className="scorePredictionInnerHeading ">Your Predicted Score</h1>
        <span className="gradient-text usersScorePrediction">
          {storedUsersPredictedScore || "No prediction yet"}
        </span>
      </div>
      <div className="scorePredictionResultsInnerContainer">
        <h1 className="scorePredictionInnerHeading">Predicted Scoreline</h1>
        <Piechart
          chartData={matchPredictions?.scorePrecitions || []}
          width={isMobile ? 300 : 220}
          height={220}
          outerRadius={75}
        />
        {/* <Barchart
          barchartData={barchartDataScoreline}
          width={(isMobile && 200) || 300}
          height={(isMobile && 150) || 220}
        /> */}
      </div>
      <div className="scorePredictionResultsInnerContainer">
        <h1 className="scorePredictionInnerHeading">Predicted Home Goals</h1>
        <Barchart
          barchartData={barchartDataHomeGoals}
          width={300}
          height={(isMobile && 150) || 220}
        />
      </div>
      <div className="scorePredictionResultsInnerContainer">
        <h1 className="scorePredictionInnerHeading">Predicted Away Goals</h1>
        <Barchart
          barchartData={barchartDataAwayGoals}
          width={300}
          height={(isMobile && 150) || 220}
        />
      </div>
    </ContentContainer>
  );
}
