import React from "react"; // Removed useEffect since we don't fetch here anymore
import { useSelector } from "react-redux";
import { useIsMobile } from "../Hooks/Helper_Functions";
import { Grid, Box } from "@mui/material";

// ✅ UPDATED IMPORTS: Use the new selectors
import {
  selectActiveClubFixtures,
  selectFixturesLoading,
} from "../Selectors/fixturesSelectors";

import LatestFixtureItem from "../Components/Fixtures/LatestFixtureItem";
import ScheduleContainer from "./ScheduleContainer";
import LatestTeamSeasonRating from "../Components/Widgets/LatestTeamSeasonRating";
import "./HomePage.css";
import useGroupData from "../Hooks/useGroupsData";
import LegacyGroupModal from "../Components/Widgets/legacyGroupModal";
import { Spinner } from "./Helpers";

export default function GroupHomePage() {
  // ✅ REPLACED: Fetching logic is gone. Now we just ask for the active data.
  // The 'selectActiveClubFixtures' selector automatically finds the right array
  // based on the user's current group ID.
  const fixtures = useSelector(selectActiveClubFixtures);
  const loading = useSelector(selectFixturesLoading);

  const isMobile = useIsMobile();
  const { userHomeGroup } = useGroupData();

  // Note: We don't check 'if (!fixtures)' anymore because 'useDataManager'
  // in App.js guarantees the data is requested when the route loads.

  if (loading && (!fixtures || fixtures.length === 0)) {
    return <Spinner text="Loading Fixtures..." />;
  }

  // Note: 'error' handling can be added if you export selectFixturesError
  // const error = useSelector(selectFixturesError);
  // if (error) return <p>Error: {error}</p>;

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
              position: { md: "sticky" },
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
