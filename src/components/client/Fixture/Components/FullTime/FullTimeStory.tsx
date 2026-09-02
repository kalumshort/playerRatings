"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Divider, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { SportsSoccerRounded } from "@mui/icons-material";
import { doc, getDoc } from "firebase/firestore";
import { motion, useReducedMotion } from "framer-motion";

import { clientDB } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import type { LiveStatsDoc, StanceMap } from "@/lib/live/heat";
import { buildSubVerdicts, hasLiveStory, rateSquad } from "@/lib/live/matchStory";

import MomentumTimeline from "./MomentumTimeline";
import HeatXI, { type SquadLookup } from "./HeatXI";
import SubVerdicts from "./SubVerdicts";
import MoodArc from "./MoodArc";
import YourMatch from "./YourMatch";

interface FullTimeStoryProps {
  fixture: any;
  groupId: string;
  currentYear: string;
  groupData: any;
  isGuestView: boolean;
}

/**
 * What happened to the fans during the match, told at full time.
 *
 * Every read here is a one-shot getDoc rather than a listener. Nothing in a
 * finished match changes again, and the live pitch's two onSnapshot
 * subscriptions were the reason this data was expensive to look at in the
 * first place.
 */
export default function FullTimeStory({
  fixture,
  groupId,
  currentYear,
  groupData,
  isGuestView,
}: FullTimeStoryProps) {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const matchId = String(fixture?.fixture?.id ?? "");
  const clubId = groupData?.groupClubId;

  const [liveStats, setLiveStats] = useState<LiveStatsDoc | null>(null);
  const [moods, setMoods] = useState<Record<string, any> | null>(null);
  const [stances, setStances] = useState<StanceMap>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!matchId || !groupId) return;
    let cancelled = false;

    const base = `groups/${groupId}/seasons/${currentYear}`;

    (async () => {
      try {
        // The fan's own stance doc is only fetched for a signed-in member —
        // a guest has none, and asking for one is a guaranteed denied read.
        const wantsOwn = Boolean(user?.uid) && !isGuestView;

        const [statsSnap, moodSnap, voterSnap] = await Promise.all([
          getDoc(doc(clientDB, `${base}/livePlayerStats`, matchId)),
          getDoc(doc(clientDB, `${base}/fixtureMoods`, matchId)),
          wantsOwn
            ? getDoc(
                doc(
                  clientDB,
                  `${base}/livePlayerStats`,
                  matchId,
                  "voters",
                  user!.uid,
                ),
              )
            : Promise.resolve(null),
        ]);

        if (cancelled) return;
        setLiveStats(statsSnap.exists() ? (statsSnap.data() as LiveStatsDoc) : {});
        setMoods(moodSnap.exists() ? moodSnap.data() : null);
        setStances(voterSnap?.exists() ? (voterSnap.data()?.stances ?? {}) : {});
        setStatus("ready");
      } catch (error) {
        console.error("Full time story failed to load:", error);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [matchId, groupId, currentYear, user?.uid, isGuestView]);

  /** id -> name/photo for everyone on the teamsheet, both sides' subs included. */
  const squad: SquadLookup = useMemo(() => {
    const map: SquadLookup = {};
    const team = fixture?.lineups?.find(
      (t: any) => Number(t?.team?.id) === Number(clubId),
    );
    [...(team?.startXI ?? []), ...(team?.substitutes ?? [])].forEach(
      (entry: any) => {
        const p = entry?.player;
        if (p?.id) map[String(p.id)] = { name: p.name, photo: p.photo };
      },
    );
    return map;
  }, [fixture?.lineups, clubId]);

  const rated = useMemo(() => rateSquad(liveStats), [liveStats]);
  const verdicts = useMemo(
    () => buildSubVerdicts(liveStats, fixture?.events ?? [], clubId),
    [liveStats, fixture?.events, clubId],
  );

  const finalMinute = fixture?.fixture?.status?.elapsed ?? 90;
  const told = hasLiveStory(liveStats);

  if (status === "loading") {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width={180} height={32} />
        <Skeleton variant="rounded" height={190} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={90} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (status === "error") {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Couldn&apos;t load the full-time story. Try refreshing.
        </Typography>
      </Paper>
    );
  }

  // A match nobody voted in has no story, and an empty chart is worse than
  // saying so.
  if (!told && !moods) {
    return (
      <Paper sx={{ p: 4 }}>
        <Stack alignItems="center" spacing={1}>
          <SportsSoccerRounded sx={{ fontSize: 32, color: "text.secondary" }} />
          <Typography variant="subtitle2" fontWeight={900}>
            No fan story for this one
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center">
            Nobody rated a player or tapped the vibe check during this match.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const sections = [
    told && liveStats ? (
      <MomentumTimeline
        key="momentum"
        liveStats={liveStats}
        events={fixture?.events ?? []}
        finalMinute={finalMinute}
      />
    ) : null,
    rated.length > 0 ? <HeatXI key="xi" rated={rated} squad={squad} /> : null,
    verdicts.length > 0 ? (
      <SubVerdicts key="subs" verdicts={verdicts} squad={squad} />
    ) : null,
    moods ? <MoodArc key="mood" matchMoods={moods as any} events={fixture?.events ?? []} /> : null,
    Object.keys(stances).length > 0 ? (
      <YourMatch key="you" stances={stances} rated={rated} squad={squad} />
    ) : null,
  ].filter(Boolean) as React.ReactElement[];

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={900}>
          Full time
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {(liveStats?.voterCount ?? 0) > 0
            ? `How ${liveStats?.voterCount} fan${liveStats?.voterCount === 1 ? "" : "s"} lived through it.`
            : "How the club lived through it."}
        </Typography>
      </Stack>

      <Stack divider={<Divider flexItem />} spacing={3}>
        {sections.map((section, index) => (
          <Box
            key={section.key}
            component={motion.div}
            // Sections land one after another, so the page reads as a recap
            // being told rather than a dashboard appearing all at once.
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : index * 0.09, duration: 0.35 }}
          >
            {section}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
