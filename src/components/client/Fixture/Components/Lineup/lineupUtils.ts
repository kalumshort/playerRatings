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
