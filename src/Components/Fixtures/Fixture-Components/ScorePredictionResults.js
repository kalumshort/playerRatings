import React from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { useSelector } from "react-redux";

import { selectPredictionsByMatchId } from "../../../Selectors/predictionsSelectors";
import { useIsMobile, useLocalStorage } from "../../../Hooks/Helper_Functions";

import Barchart from "../../Charts/Barchart";
import Piechart from "../../Charts/Piechart";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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
  let highestScorePredictions;
  if (matchPredictions?.scorePrecitions) {
    const maxValue = Math.max(
      ...Object.values(matchPredictions?.scorePrecitions)
    );

    // Filter keys that have the maximum value
    highestScorePredictions = Object.keys(
      matchPredictions?.scorePrecitions
    ).filter((key) => matchPredictions?.scorePrecitions[key] === maxValue);
  }

  return (
    <ContentContainer className="scorePredictionResultsContainer containerMargin animate__bounceIn">
      <div style={{ display: "flex" }}>
        <div className="scorePredictionResultsInnerContainer">
          <h1 className="scorePredictionInnerHeading ">Your Score</h1>
          <span className="gradient-text usersScorePrediction">
            {storedUsersPredictedScore || "na"}
          </span>
        </div>
        <div className="scorePredictionResultsInnerContainer">
          <h1 className="scorePredictionInnerHeading ">Community Score</h1>
          <span className="gradient-text usersScorePrediction">
            {highestScorePredictions?.[0] || "na"}
          </span>
        </div>
      </div>

      <Accordion
        style={{
          borderRadius: "8px",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          style={{
            borderRadius: "8px",
          }}
        >
          <Typography component="span">Prediction Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <>
            <div className="scorePredictionResultsInnerContainer">
              <h1 className="scorePredictionInnerHeading">
                Predicted Scoreline
              </h1>
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
              <h1 className="scorePredictionInnerHeading">
                Predicted Home Goals
              </h1>
              <Barchart
                barchartData={barchartDataHomeGoals}
                width={300}
                height={(isMobile && 150) || 220}
              />
            </div>
            <div className="scorePredictionResultsInnerContainer">
              <h1 className="scorePredictionInnerHeading">
                Predicted Away Goals
              </h1>
              <Barchart
                barchartData={barchartDataAwayGoals}
                width={300}
                height={(isMobile && 150) || 220}
              />
            </div>
          </>
        </AccordionDetails>
      </Accordion>
    </ContentContainer>
  );
}
