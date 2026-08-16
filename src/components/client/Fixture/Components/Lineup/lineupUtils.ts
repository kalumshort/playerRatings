import { DEFAULT_FORMATION } from "./formations";

export interface CommunityXI {
  formation: string;
  formationPercentage: number;
  lineup: Record<string, { playerId: string; percentage: number }>;
}

/**
 * Determines the community's preferred formation and the #1 player for every
 * slot (1-11) from the aggregated `predictions/{matchId}` document.
 *
 * Note: the winning formation and the per-slot winners are computed
 * independently, so a slot's winner may come mostly from voters who picked a
 * different formation. Kept as-is — changing it would alter existing consensus
 * output.
 */
export const calculateCommunityXI = (
  matchPredictions: any,
): CommunityXI | null => {
  if (!matchPredictions?.formations || !matchPredictions?.positionConsensus) {
    return null;
  }

  // 1. Determine Winning Formation
  let winningFormation = DEFAULT_FORMATION;
  let maxFormationVotes = 0;
  const totalFormationVotes = Object.values(
    matchPredictions.formations as Record<string, number>,
  ).reduce((a, b) => a + b, 0);

  Object.entries(matchPredictions.formations as Record<string, number>).forEach(
    ([fmt, votes]) => {
      if (votes > maxFormationVotes) {
        maxFormationVotes = votes;
        winningFormation = fmt;
      }
    },
  );

  // 2. Determine Top Player per Slot
  const lineup: CommunityXI["lineup"] = {};

  for (let i = 1; i <= 11; i++) {
    const bucket = matchPredictions.positionConsensus[String(i)];
    if (!bucket) continue;

    const sortedPlayers = Object.entries(bucket as Record<string, number>).sort(
      ([, a], [, b]) => b - a,
    );

    // An empty bucket is reachable via a merge write, and destructuring
    // sortedPlayers[0] on one used to throw.
    if (sortedPlayers.length === 0) continue;

    const [winnerId, winnerVotes] = sortedPlayers[0];
    const totalSlotVotes = sortedPlayers.reduce((acc, [, v]) => acc + v, 0);

    if (winnerId) {
      lineup[i] = {
        playerId: winnerId,
        percentage:
          totalSlotVotes > 0
            ? Math.round((winnerVotes / totalSlotVotes) * 100)
            : 0,
      };
    }
  }

  return {
    formation: winningFormation,
    formationPercentage:
      totalFormationVotes > 0
        ? Math.round((maxFormationVotes / totalFormationVotes) * 100)
        : 0,
    lineup,
  };
};

export interface XIComparison {
  /** Predicted AND present in the reference XI. */
  hits: string[];
  /** Predicted but absent from the reference XI. */
  misses: string[];
  /** In the reference XI but not predicted. */
  missed: string[];
  score: number;
  total: number;
}

/**
 * The official STARTING XI for a club, as player ids.
 *
 * Deliberately reads `startXI` rather than going through `getLiveLineup`:
 * that helper applies substitutions, so scoring against it would credit an
 * 80th-minute substitute and penalise a starter who came off.
 */
export const getActualStartingXI = (
  fixture: any,
  clubId: string | number,
): string[] => {
  const team = fixture?.lineups?.find(
    (t: any) => Number(t?.team?.id) === Number(clubId),
  );
  return (team?.startXI ?? [])
    .map((entry: any) => entry?.player?.id)
    .filter((id: any) => id != null)
    .map(String);
};

/**
 * Compare a predicted XI against a reference XI by PLAYER PRESENCE, not slot.
 *
 * Slot-exact scoring would be meaningless here: the official feed carries no
 * slot ids (only a `grid` string), and our own slot ids mean different things
 * per formation — slot 7 is a right winger in 4-3-3 Holding and a left
 * centre-back in 3-5-2. "Did I pick the right eleven" is the question fans
 * actually ask, and presence is comparable across formations.
 */
export const compareXI = (
  predicted: Record<string, string | number> | undefined | null,
  actual: string[],
): XIComparison => {
  const predictedIds = new Set(
    Object.values(predicted ?? {})
      .filter((id) => id != null && id !== "")
      .map(String),
  );
  const actualIds = new Set(actual.map(String));

  const hits: string[] = [];
  const misses: string[] = [];

  predictedIds.forEach((id) => {
    (actualIds.has(id) ? hits : misses).push(id);
  });

  const missed = [...actualIds].filter((id) => !predictedIds.has(id));

  return {
    hits,
    misses,
    missed,
    score: hits.length,
    // Guard a short or malformed feed so this can never render "8/0".
    total: Math.min(11, actualIds.size),
  };
};

/**
 * Processes a team's lineup by applying substitution events.
 * 1. Finds the starter being subbed off.
 * 2. Grabs the sub details from the substitutes bench.
 * 3. Swaps them while preserving the tactical grid position.
 */
export const getLiveLineup = (
  lineupData: any,
  events: any[] = [],
  clubId: string | number,
) => {
  // 1. Safety Checks
  if (!lineupData) return { activeXI: [], finalSubsList: [] };

  const targetClubId = Number(clubId);
  const startXI = lineupData.startXI || [];
  const allSubs = lineupData.substitutes || [];

  // 2. Clone & Prepare
  // Using shallow copy to maintain performance while allowing mutations for the swap
  let activeXI = [...startXI];
  let subbedOutList: any[] = [];

  // 3. Filter events for this specific team and type 'subst'
  const subEvents = events.filter(
    (e) => Number(e.team?.id) === targetClubId && e.type === "subst",
  );

  // 4. Apply Subs
  subEvents.forEach((event) => {
    const playerOffId = Number(event.player?.id);
    const playerOnId = Number(event.assist?.id);

    // Look for the outgoing player in our current active list
    const index = activeXI.findIndex(
      (p) => Number(p.player.id) === playerOffId,
    );

    if (index !== -1) {
      // Find the incoming player details from the bench
      const playerOnDetails = allSubs.find(
        (s) => Number(s.player.id) === playerOnId,
      );

      if (playerOnDetails) {
        // Track the player leaving the pitch
        subbedOutList.push({
          ...activeXI[index],
          isSubbedOut: true,
        });

        // Replace on pitch, inheriting the exact tactical grid of the predecessor
        activeXI[index] = {
          ...playerOnDetails,
          player: {
            ...playerOnDetails.player,
            grid: activeXI[index].player.grid,
          },
        };
      }
    }
  });

  // 5. Construct the Final Bench
  // We want: (Subs who never played) + (Starters/Subs who were subbed off)
  const activeIds = new Set(activeXI.map((p) => Number(p.player.id)));
  const finalSubsList = [
    ...allSubs.filter((s) => !activeIds.has(Number(s.player.id))),
    ...subbedOutList,
  ];

  return { activeXI, finalSubsList };
};
