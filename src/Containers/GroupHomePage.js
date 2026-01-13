import React from "react";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { useIsMobile } from "../Hooks/Helper_Functions";
import { Grid, Box } from "@mui/material";

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
  const fixtures = useSelector(selectActiveClubFixtures);
  const loading = useSelector(selectFixturesLoading);

  const isMobile = useIsMobile();
  const { activeGroup, userHomeGroup } = useGroupData();

  // --- STEP 1: CALCULATE METADATA IMMEDIATELY ---
  // Even if data is loading, we try to use activeGroup.
  // If activeGroup is null (loading), we fallback to "Football" or a safe default.
  const groupName = activeGroup?.name || activeGroup?.groupName || "Football";

  const metaTitle = `${groupName} Player Ratings & Fan Hub | 11Votes`;
  const metaDescription = `The ultimate ${groupName} fan community. Rate players after every match, track season stats, and see the real-time fan consensus.`;
  const canonicalUrl = `https://11votes.com/${activeGroup?.slug || ""}`;

  return (
    <div className="containerMargin">
      {/* --- STEP 2: RENDER HELMET ALWAYS (Before checking loading) --- */}
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />

        {/* Open Graph */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />

        {activeGroup?.logoUrl && (
          <meta property="og:image" content={activeGroup.logoUrl} />
        )}

        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      {/* --- STEP 3: NOW CHECK FOR LOADING --- */}
      {/* If loading, we show spinner, BUT Helmet has already updated the head! */}
      {loading && (!fixtures || fixtures.length === 0) ? (
        <Spinner text="Loading Fixtures..." />
      ) : (
        <Grid container spacing={3}>
          {/* --- LEFT COLUMN --- */}
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

          {/* --- RIGHT COLUMN --- */}
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
              <LatestTeamSeasonRating />
            </Box>
          </Grid>
        </Grid>
      )}

      {userHomeGroup?.groupId === "002" && <LegacyGroupModal />}
    </div>
  );
}
