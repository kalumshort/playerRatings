"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";

import { Fixture } from "@/types/football";
import { RootState } from "@/lib/redux/store";
import {
  selectActiveClubFixtures,
  selectActiveClubFixturesLoaded,
} from "@/lib/redux/selectors/fixturesSelectors";
import { monthKey } from "@/lib/utils/date-format";
import { getClubSide, getFixtureStatus, getMatchId } from "./fixtureDisplay";

export type ScheduleTab = "upcoming" | "results" | "all";
export type VenueFilter = "all" | "H" | "A";

export interface ScheduleFilters {
  /** Null means "not chosen yet" — the hook picks a sensible opening tab. */
  tab: ScheduleTab | null;
  competition: string;
  venue: VenueFilter;
}

// Module-level so the default doesn't allocate a new array each render and
// bust the allFixtures memo while the store is still empty.
const EMPTY_FIXTURES: Fixture[] = [];

/**
 * Which tab a fixture belongs to.
 *
 * Deliberately derived from the match STATUS, not from `Date.now()`. A
 * clock-based split would put a fixture in different tabs on the server and on
 * the client, which is a hydration mismatch in the rendered list itself — not
 * something `suppressHydrationWarning` can paper over.
 *
 * Postponed/cancelled sit with results: they're not a fixture you can turn up
 * to, and the data carries no replacement date.
 */
function isUpcoming(fixture: Fixture): boolean {
  const state = getFixtureStatus(fixture);
  return state === "prematch" || state === "inplay";
}

interface Options extends ScheduleFilters {
  initialFixtures?: Fixture[];
  clubId?: string | number;
  /**
   * Drop the next fixture from the grouped list because the caller renders it
   * as a hero card above. Only applies to the Upcoming tab.
   */
  excludeNextFromList?: boolean;
}

export default function useScheduleFixtures({
  initialFixtures = EMPTY_FIXTURES,
  clubId,
  tab,
  competition,
  venue,
  excludeNextFromList = false,
}: Options) {
  const reduxFixtures = useSelector(selectActiveClubFixtures);
  const seasonLoaded = useSelector(selectActiveClubFixturesLoaded);

  // Prefer the server-supplied club id so rows compute W/D/L correctly during
  // SSR; fall back to the store for the client-only mount (club home page).
  const storeClubId = useSelector((state: RootState) => {
    const id = state.groupData.activeGroupId;
    return id ? state.groupData.byGroupId[id]?.groupClubId : undefined;
  });
  const resolvedClubId = Number(clubId ?? storeClubId);

  const allFixtures: Fixture[] = useMemo(
    () =>
      reduxFixtures && reduxFixtures.length > 0
        ? (reduxFixtures as Fixture[])
        : initialFixtures,
    [reduxFixtures, initialFixtures],
  );

  const competitions = useMemo(
    () =>
      [
        ...new Set(
          allFixtures.map((f) => f.league?.name).filter(Boolean) as string[],
        ),
      ].sort(),
    [allFixtures],
  );

  // Filters that apply to every tab, so the tab counts reflect the active
  // competition/venue rather than the unfiltered season.
  const scoped = useMemo(() => {
    return allFixtures.filter((f) => {
      if (competition && f.league?.name !== competition) return false;
      if (venue !== "all" && getClubSide(f, resolvedClubId) !== venue)
        return false;
      return true;
    });
  }, [allFixtures, competition, venue, resolvedClubId]);

  const { upcoming, results } = useMemo(() => {
    const up: Fixture[] = [];
    const done: Fixture[] = [];
    scoped.forEach((f) => (isUpcoming(f) ? up : done).push(f));

    // Soonest first for what's ahead, most recent first for what's behind.
    up.sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
    done.sort((a, b) => b.fixture.timestamp - a.fixture.timestamp);

    // Anything in play jumps the queue.
    const live = up.filter((f) => getFixtureStatus(f) === "inplay");
    const notLive = up.filter((f) => getFixtureStatus(f) !== "inplay");

    return { upcoming: [...live, ...notLive], results: done };
  }, [scoped]);

  // Opening on Upcoming is what replaces the old scroll-to-the-middle effect.
  // Once the season is over there's nothing ahead, so fall back to Results.
  const activeTab: ScheduleTab =
    tab ?? (upcoming.length > 0 ? "upcoming" : "results");

  const fixtures = useMemo(() => {
    if (activeTab === "upcoming") return upcoming;
    if (activeTab === "results") return results;
    // "All" runs newest-first through the whole season.
    return [...upcoming].reverse().concat(results);
  }, [activeTab, upcoming, results]);

  const nextFixture = upcoming[0] ?? null;

  /**
   * In the "All" tab, the first result marks where the future stops and the
   * past begins. Derived from the ordering above, so it needs no clock.
   */
  const todayDividerId = useMemo(() => {
    if (activeTab !== "all" || upcoming.length === 0 || results.length === 0)
      return null;
    return getMatchId(results[0]);
  }, [activeTab, upcoming.length, results]);

  const listFixtures = useMemo(
    () =>
      excludeNextFromList && activeTab === "upcoming"
        ? fixtures.slice(1)
        : fixtures,
    [excludeNextFromList, activeTab, fixtures],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Fixture[]>();
    listFixtures.forEach((f) => {
      const label = monthKey(f.fixture.timestamp);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(f);
    });
    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      fixtures: items,
    }));
  }, [listFixtures]);

  return {
    activeTab,
    clubId: resolvedClubId,
    // SSR fixtures mean the page is never in a loading state; the club home
    // has none, so it falls back to whether this club+season bucket has landed.
    loaded: initialFixtures.length > 0 || seasonLoaded,
    competitions,
    fixtures,
    groups,
    upcoming,
    results,
    nextFixture,
    todayDividerId,
    counts: {
      upcoming: upcoming.length,
      results: results.length,
      all: upcoming.length + results.length,
    },
  };
}
