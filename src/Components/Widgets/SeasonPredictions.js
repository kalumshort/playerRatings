import React from "react";
import { ContentContainer } from "../../Containers/GlobalContainer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function SeasonPredictions() {
  return (
    <ContentContainer style={{ padding: "10px" }}>
      <div>
        <h2 className="globalHeading">Season Predictions</h2>
        <h2 className="subHeadingGlobal">
          What are you predicting for the season ahead?
        </h2>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Link to="/season-predictions">
          <Button variant="contained">
            <ArrowForwardIcon fontSize="small" />
          </Button>
        </Link>
      </div>
    </ContentContainer>
  );
}
