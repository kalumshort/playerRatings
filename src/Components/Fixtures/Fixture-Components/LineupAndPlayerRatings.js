import React, { useState } from "react";
import Lineup from "./Lineup";
import { Box, Tab, Tabs } from "@mui/material";
import PlayerRatings from "./PlayerRatings/PlayerRatings";
import { ContentContainer } from "../../../Containers/GlobalContainer";

export default function LineupAndPlayerRatings({ fixture }) {
  const [selectedTab, setSelectedTab] = useState("lineup");

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <ContentContainer className="lineupAndRatings-Container containerMargin">
      <Box>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          scrollButtons="auto"
          aria-label="Player Position Tabs"
        >
          <Tab label="Lineup" value="lineup" />
          <Tab label="Ratings" value="ratings" />
        </Tabs>
        {selectedTab === "lineup" && <Lineup fixture={fixture} />}
        {selectedTab === "ratings" && <PlayerRatings fixture={fixture} />}
      </Box>
    </ContentContainer>
  );
}
