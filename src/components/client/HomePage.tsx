"use client";

import { useState } from "react";
import { Box, Container, Stack } from "@mui/material";
import { DirectoryClub } from "@/lib/clubDirectory";
import {
  EMPTY_SHOWCASE,
  HomepageShowcase,
  clubForRow,
} from "@/lib/homepageShowcase";
import AuthDialog from "@/components/client/Auth/AuthDialog";

import Hero from "@/components/client/Home/Hero";
import FeatureRow from "@/components/client/Home/FeatureRow";
import CompetitionsBand from "@/components/client/Home/CompetitionsBand";
import ClubFinder from "@/components/client/Home/ClubFinder";
import CreatorBand from "@/components/client/Home/CreatorBand";
import FinalCta from "@/components/client/Home/FinalCta";
import PredictionsDemo from "@/components/client/Home/demos/PredictionsDemo";
import LineupDemo from "@/components/client/Home/demos/LineupDemo";
import LivePulseDemo from "@/components/client/Home/demos/LivePulseDemo";
import ReactionsDemo from "@/components/client/Home/demos/ReactionsDemo";
import RatingsDemo from "@/components/client/Home/demos/RatingsDemo";

/**
 * The logged-out landing page.
 *
 * Ordered by the matchday itself — predict, pick the XI, live the 90 minutes,
 * react, then rate — so the phase eyebrows carry the structure that used to
 * need a "Three phases. One consensus." header and a separate feature grid
 * saying the same things a second time.
 *
 * The rule for copy on this page, unchanged: every claim must point at a
 * component. If a line can't, it doesn't belong. The demo panels are the
 * argument; the prose is a caption.
 */
const scrollToClubs = () => {
  if (typeof window === "undefined") return;
  const el = document.getElementById("clubs");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function HomePage({
  clubs,
  showcase = EMPTY_SHOWCASE,
}: {
  clubs: DirectoryClub[];
  /** Real fixture, squad players and match events for the demo panels. */
  showcase?: HomepageShowcase;
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const openAuth = () => setAuthOpen(true);

  // One club per row, in FEATURE_CLUBS order: Manchester United, Arsenal,
  // Liverpool, Chelsea, Manchester City. Five recognisable squads down the
  // page instead of the same one five times. Any row whose club is missing
  // (cold season, failed read) falls back to the panel's own empty state.
  const rowClub = (index: number) => clubForRow(showcase, index);

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Hero clubs={clubs} onSignUp={openAuth} onBrowse={scrollToClubs} />

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack spacing={{ xs: 10, md: 16 }}>
          <FeatureRow
            eyebrow="BEFORE KICKOFF"
            title="Call it before kick-off"
            body="Pick the winner, set the scoreline, and name the player you think decides it — then watch the crowd's numbers move."
            specs={["Winner", "Scoreline", "Player to watch"]}
            demo={<PredictionsDemo club={rowClub(0)} />}
          />

          <FeatureRow
            eyebrow="BEFORE KICKOFF"
            title="Build the XI you'd start"
            body="Pick a shape, fill eleven slots, and find out how many of the real starters you called."
            specs={["19 formations", "Consensus XI", "Hit / miss scoring", "Shareable PNG"]}
            demo={<LineupDemo club={rowClub(1)} />}
            reverse
          />

          <FeatureRow
            eyebrow="LIVE"
            title="Feel it, and manage it"
            body="Tap your mood as the match swings, call players hot or cold, and shout for a substitution while it still matters."
            specs={["6 moods", "Minute by minute", "🔥 hot / ❄️ cold", "Sub shouts"]}
            demo={<LivePulseDemo club={rowClub(2)} />}
          />

          <FeatureRow
            eyebrow="LIVE"
            title="React to the moment"
            body="Eleven emoji, on any goal, card or substitution, landing live on the match feed."
            specs={["11 reactions", "Goals, cards, subs", "Live feed"]}
            demo={<ReactionsDemo club={rowClub(3)} />}
            reverse
          />

          <FeatureRow
            eyebrow="FULL TIME"
            title="Rate them. Crown one."
            body="Ratings open at the 80th minute — not before. Score everyone who featured, and the votes crown the Fan Man of the Match."
            specs={["1.0 – 10.0", "Opens at 80'", "You vs team average", "Season leaderboard"]}
            demo={<RatingsDemo club={rowClub(4)} />}
          />
        </Stack>
      </Container>

      <CompetitionsBand />

      <ClubFinder clubs={clubs} />

      {/* The other way in, for someone who brings their own audience. */}
      <CreatorBand />

      <FinalCta onSignUp={openAuth} onBrowse={scrollToClubs} />

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </Box>
  );
}
