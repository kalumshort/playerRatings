import React, { useState } from "react";
import { ContentContainer } from "../../../Containers/GlobalContainer";
import { useSelector } from "react-redux";

import { selectPredictionsByMatchId } from "../../../Selectors/predictionsSelectors";
import { useIsMobile, useLocalStorage } from "../../../Hooks/Helper_Functions";

import Barchart from "../../Charts/Barchart";
import Piechart from "../../Charts/Piechart";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { Modal, Box, Button, Typography } from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function ScorePredictionResults({ fixture }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
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
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    borderRadius: "8px",
    boxShadow: 24,
    p: 4,
  };
  return (
    <ContentContainer className="scorePredictionResultsContainer containerMargin animate__bounceIn">
      <div style={{ display: "flex" }}>
        <div className="scorePredictionResultsInnerContainer">
          <h1 className="scorePredictionInnerHeading">Your Score</h1>
          <span className=" usersScorePrediction">
            {storedUsersPredictedScore || "-"}
          </span>
        </div>
        <div className="scorePredictionResultsInnerContainer">
          <h1 className="scorePredictionInnerHeading ">Community Score</h1>
          <span className=" usersScorePrediction">
            {highestScorePredictions?.[0] || "-"}
          </span>
        </div>
      </div>
      <Button onClick={handleOpen} variant="outlined">
        Prediction Details
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
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
        </Box>
      </Modal>
    </ContentContainer>
  );
}
