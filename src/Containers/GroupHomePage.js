import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useIsMobile } from "../Hooks/Helper_Functions";
import { Grid, Box } from "@mui/material";

import { fetchFixtures } from "../Hooks/Fixtures_Hooks";
import LatestFixtureItem from "../Components/Fixtures/LatestFixtureItem";
import ScheduleContainer from "./ScheduleContainer";
import LatestTeamSeasonRating from "../Components/Widgets/LatestTeamSeasonRating";
import "./HomePage.css"; // Make sure to import the new CSS
import useGroupData from "../Hooks/useGroupsData";
import LegacyGroupModal from "../Components/Widgets/legacyGroupModal";
// import SeasonPredictions from "../Components/Widgets/SeasonPredictions";

export default function GroupHomePage() {
  const { fixtures, loading, error } = useSelector((state) => state.fixtures);
  const isMobile = useIsMobile();
  const { userHomeGroup } = useGroupData();

  const dispatch = useDispatch();

  useEffect(() => {
    if (!fixtures) {
      console.log("Fetching fixtures... In GroupHomePage");
      dispatch(fetchFixtures());
    }
  }, [dispatch, fixtures]);

  if (loading) return <p>Loading fixtures...</p>;
  if (error) return <p>Error: {error}</p>;

  // ... inside your component return:

  return (
    <div className="containerMargin">
      <Grid container spacing={3}>
        {/* --- LEFT COLUMN: MAIN CONTENT (66% width) --- */}
        <Grid item xs={12} md={8}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <LatestFixtureItem />
            <ScheduleContainer
              limitAroundLatest={isMobile ? 2 : 3}
              showLink={true}
              scroll={false}
              scrollOnLoad={false}
            />
          </div>
        </Grid>

        {/* --- RIGHT COLUMN: SIDEBAR (33% width) --- */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              position: { md: "sticky" }, // Optional: Makes sidebar sticky on scroll
              top: 20,
            }}
          >
            {/* <SeasonPredictions /> */}
            <LatestTeamSeasonRating />
          </Box>
        </Grid>
      </Grid>
      {userHomeGroup?.groupId === "002" && <LegacyGroupModal />}
    </div>
  );
}
