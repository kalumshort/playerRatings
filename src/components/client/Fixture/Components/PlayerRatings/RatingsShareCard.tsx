"use client";

import React from "react";
import { useSelector } from "react-redux";
import { Avatar, Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import { Trophy } from "lucide-react";

import { RootState } from "@/lib/redux/store";
import {
  selectMatchMotmById,
  selectMotmPercentages,
} from "@/lib/redux/selectors/ratingsSelectors";
import { selectSeasonSquadDataObject } from "@/lib/redux/selectors/squadSelectors";
import { getRatingChipSx } from "@/lib/utils/football-logic";
import RatingLineupPlayer from "@/components/client/PlayerRatings/RatingLineupPlayer";
import ShareFrame from "@/components/ui/ShareFrame";
import ShareFixtureLine, {
  fixtureSubtitle,
} from "@/components/ui/ShareFixtureLine";

interface RatingsShareCardProps {
  fixture: any;
  frameRef: React.Ref<HTMLDivElement>;
  /**
   * Which set of numbers the card is built from. The parent has already
   * resolved this — a "Personal" toggle with no personal ratings behind it
   * arrives here as "Group".
   */
  source: "Group" | "Personal";
  /** Formation rows as the pitch draws them: back line first. */
  formationRows: any[][];
  /** Substitutes who actually came on. */
  subs: any[];
  /** Resolves one player's score in whichever source is active. */
  getRating: (playerId: string | number) => number | null;
  /** The user's own MOTM pick. Used instead of the crowd winner when personal. */
  personalMotmId?: string | null;
  groupName?: string;
}

/**
 * The post-match ratings image: the Man of the Match over the XI that produced
 * the result, every player carrying their score, with the impact subs beneath.
 *
 * A dedicated card rather than a capture of the live RatingLineup, because that
 * view is built around a <Select> and two CSS keyframe animations — html2canvas
 * would rasterise the dropdown as a dead form control and freeze the MOTM medal
 * mid-bounce. The pitch itself is the real RatingLineupPlayer, so the exported
 * image and the screen cannot drift apart.
 *
 * Two readings of the same shape, picked by the toggle the user is looking at:
 *
 *   MY RATINGS  -> their own pick for Man of the Match, and the score they
 *                  personally gave every player.
 *   STADIUM AVG -> the voted MOTM with their share of the vote, over the
 *                  group's averages.
 *
 * Every value comes from selectors already populated for the visible view, or
 * from props the pitch has computed, so mounting this offscreen costs no extra
 * Firestore reads.
 */
export default function RatingsShareCard({
  fixture,
  frameRef,
  source,
  formationRows,
  subs,
  getRating,
  personalMotmId,
  groupName,
}: RatingsShareCardProps) {
  const squadDict = useSelector(selectSeasonSquadDataObject);

  const motm = useSelector((s: RootState) =>
    selectMotmPercentages(s, fixture.id),
  );
  const motmMeta = useSelector((s: RootState) =>
    selectMatchMotmById(s, fixture.id),
  );

  const isPersonal = source === "Personal";
  const winner = isPersonal
    ? personalMotm(personalMotmId, squadDict, getRating)
    : crowdMotm(motm?.[0], motmMeta?.motmTotalVotes ?? 0);

  return (
    <ShareFrame
      frameRef={frameRef}
      eyebrow={isPersonal ? "My Ratings" : "Fan Ratings"}
      subtitle={fixtureSubtitle(fixture)}
      footerNote={groupName}
      width={540}
    >
      <Box sx={{ mb: 2 }}>
        <ShareFixtureLine fixture={fixture} />
      </Box>

      {winner && (
        <MotmBlock
          label={isPersonal ? "My Man of the Match" : "Man of the Match"}
          {...winner}
        />
      )}

      <Stack spacing={0.5}>
        {formationRows.map((rowPlayers, idx) => (
          <Stack
            key={`row-${idx}`}
            direction="row"
            justifyContent="space-around"
            alignItems="center"
          >
            {rowPlayers.map((p: any) => (
              <RatingLineupPlayer
                key={p.id}
                player={p}
                playerRating={getRating(p.id)}
              />
            ))}
          </Stack>
        ))}
      </Stack>

      {subs.length > 0 && (
        <Box
          sx={(t: any) => ({
            mt: 1.5,
            pt: 2,
            borderTop: `1px dashed ${alpha(t.palette.divider, 0.8)}`,
          })}
        >
          <Typography
            variant="overline"
            align="center"
            display="block"
            sx={{ fontWeight: 900, opacity: 0.55, letterSpacing: 2, mb: 1.5 }}
          >
            Impact Substitutes
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            {subs.map((p: any) => (
              <RatingLineupPlayer
                key={p.id}
                player={p}
                playerRating={getRating(p.id)}
              />
            ))}
          </Box>
        </Box>
      )}
    </ShareFrame>
  );
}

// --- Man of the Match -------------------------------------------------------

interface MotmWinner {
  name: string;
  img?: string;
  /** The user's own score for their pick. Personal card only. */
  rating?: number | null;
  /** "63% of 41 votes". Crowd card only. */
  footnote?: string;
}

const crowdMotm = (
  top: { name: string; img: string; percentage: string } | undefined,
  totalVotes: number,
): MotmWinner | null =>
  top
    ? {
        name: top.name,
        img: top.img,
        footnote: `${top.percentage}% of ${votes(totalVotes)}`,
      }
    : null;

const personalMotm = (
  motmId: string | null | undefined,
  squadDict: Record<string, any>,
  getRating: (playerId: string | number) => number | null,
): MotmWinner | null => {
  if (!motmId) return null;
  const id = String(motmId);
  return {
    name: squadDict?.[id]?.name || "Unknown",
    // Same fallback RatingLineupPlayer uses: the squad dictionary is the good
    // source, the id-derived URL is what exists for anyone missing from it.
    img:
      squadDict?.[id]?.photo ||
      `https://media.api-sports.io/football/players/${id}.png`,
    rating: getRating(id),
  };
};

const MotmBlock = ({
  label,
  name,
  img,
  rating,
  footnote,
}: MotmWinner & { label: string }) => {
  const theme = useTheme() as any;

  return (
    <Stack alignItems="center" sx={{ mb: 2 }}>
      <Box sx={{ position: "relative", mb: 1 }}>
        {/*
          The border is load-bearing, not decoration. html2canvas only inherits
          an ancestor's `overflow: hidden` clip when that ancestor's border box
          differs from its padding box (ElementPaint.getEffects, html2canvas
          1.4.1), so a BORDERLESS round avatar has its <img> child drawn
          unclipped — which is why this portrait came out of the exporter as a
          bare square. The pitch avatars below always looked right because
          RatingLineupPlayer already had one.
        */}
        <Avatar
          src={img}
          alt={name}
          sx={(t: any) => ({
            width: 84,
            height: 84,
            border: `4px solid ${t.palette.background.paper}`,
            backgroundColor: t.palette.background.default,
            color: t.palette.text.secondary,
            boxShadow: t.shadows[3],
            "& img": { objectFit: "cover" },
          })}
        />
        {/* Static, unlike FanMOTMHighlight's floatPulse medal — an
            animation frozen mid-bounce reads as a rendering bug in a still. */}
        <Box
          sx={{
            position: "absolute",
            bottom: -4,
            right: -4,
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: `linear-gradient(145deg, ${theme.palette.motm.goldStart} 0%, ${theme.palette.motm.goldEnd} 100%)`,
          }}
        >
          <Trophy size={15} color={theme.palette.motm.bronze} strokeWidth={2.5} />
        </Box>
      </Box>

      <Typography
        variant="overline"
        sx={{ color: "primary.main", letterSpacing: 2.5, lineHeight: 1.4 }}
      >
        {label}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: -0.3,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {name}
        </Typography>
        {rating != null && Number.isFinite(rating) && (
          <Box
            sx={{
              px: 1,
              py: 0.1,
              borderRadius: "8px",
              fontWeight: 900,
              fontSize: 16,
              lineHeight: 1.4,
              // A filled pill, not coloured text: the ramp's pale bands need an
              // outline to read in light mode, and html2canvas strokes text with
              // the raw CSS px lineWidth, which exports as a hollow letterform.
              ...getRatingChipSx(rating),
            }}
          >
            {rating.toFixed(1)}
          </Box>
        )}
      </Stack>

      {footnote && (
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", fontWeight: 700 }}
        >
          {footnote}
        </Typography>
      )}
    </Stack>
  );
};

/** "1 vote", not "1 votes". */
const votes = (n: number) => `${n} ${n === 1 ? "vote" : "votes"}`;
