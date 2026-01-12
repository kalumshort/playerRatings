import React from "react";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet-async"; // 1. Import Helmet
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
  // 2. We need 'activeGroup' for the page SEO, not just 'userHomeGroup'
  const { activeGroup, userHomeGroup } = useGroupData();

  if (loading && (!fixtures || fixtures.length === 0)) {
    return <Spinner text="Loading Fixtures..." />;
  }

  // 3. DEFINE SEO VARIABLES
  // Fallback to "Football" if data is missing, but activeGroup should exist here
  const groupName = activeGroup?.name || "Football";

  const metaTitle = `${groupName} Player Ratings & Fan Hub | 11Votes`;
  const metaDescription = `The ultimate ${groupName} fan community. Rate players after every match, track season stats, and see the real-time fan consensus.`;
  const canonicalUrl = `https://11votes.com/${activeGroup?.slug || ""}`;

  return (
    <div className="containerMargin">
      {/* 4. INJECT SEO DATA */}
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />

        {/* Open Graph (Facebook/WhatsApp/Twitter Cards) */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />

        {/* Optional: Add a group logo if you have one in activeGroup.logoUrl */}
        {activeGroup?.logoUrl && (
          <meta property="og:image" content={activeGroup.logoUrl} />
        )}

        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

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
            <LatestTeamSeasonRating />
          </Box>
        </Grid>
      </Grid>
      {userHomeGroup?.groupId === "002" && <LegacyGroupModal />}
    </div>
  );
}
