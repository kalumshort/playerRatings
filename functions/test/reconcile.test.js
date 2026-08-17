/**
 * Club registry reconcile suite.
 *
 * Run with:  npm --prefix functions run test:reconcile
 * (wraps `firebase emulators:exec --only firestore`)
 *
 * This is the code that decides which clubs the app offers and which ones get
 * frozen. A bug here either strands every fan of a promoted club or archives
 * clubs that are still playing, and neither is visible until the next morning —
 * so the safety guard and the "never touch community groups" rule are tested
 * directly rather than left to the nightly job to discover.
 */
const assert = require("node:assert/strict");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

initializeApp({ projectId: "reconcile-test" });
const db = getFirestore();

const {
  reconcileClubGroups,
  writeClubDirectory,
  slugify,
  isClubGroup,
} = require("../helperFunctions");

const SEASON = 2026;

let passed = 0;
let failed = 0;

/**
 * Runs one named case, reporting rather than throwing so the whole suite runs.
 * @param {string} name - What the case protects.
 * @param {Function} fn - The case body.
 */
async function it(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}\n      ${err.message.split("\n")[0]}`);
    failed++;
  }
}

/** Deletes every doc the suite touches, so cases start from a known state. */
async function resetDb() {
  for (const path of ["groups", "config"]) {
    const snap = await db.collection(path).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
}

/**
 * Builds an API `teams` response of the given size.
 * @param {Array<Array>} entries - [id, name] pairs to include by name.
 * @param {number} padTo - Total length, padded with filler clubs.
 * @return {Array<object>} An API-shaped team list.
 */
const apiTeams = (entries, padTo = 20) => {
  const teams = entries.map(([id, name]) => ({
    team: { id, name, logo: `https://example.test/${id}.png` },
  }));

  for (let i = teams.length; i < padTo; i++) {
    teams.push({ team: { id: 9000 + i, name: `Filler ${i}` } });
  }

  return teams;
};

const seedClub = (id, data = {}) =>
  db
    .collection("groups")
    .doc(String(id))
    .set({
      name: `Club ${id}`,
      slug: `club-${id}`,
      groupClubId: String(id),
      league: "premier-league",
      groupType: "club",
      isPublic: true,
      isGroupOpen: true,
      status: "active",
      lastActiveSeason: "2025",
      ...data,
    });

const getClub = async (id) =>
  (await db.collection("groups").doc(String(id)).get()).data();

(async () => {
  console.log("\nHelpers");
  await it("slugify handles names, accents and punctuation", () => {
    assert.equal(slugify("Nottingham Forest"), "nottingham-forest");
    assert.equal(slugify("Atlético Madrid"), "atletico-madrid");
    assert.equal(slugify("  Brighton & Hove Albion  "), "brighton-hove-albion");
  });

  await it("slugify preserves digits (regression: stripped 0/3/6/f)", () => {
    assert.equal(slugify("Team 1903"), "team-1903");
  });

  await it("isClubGroup only matches numeric club docs", () => {
    assert.equal(isClubGroup("33", { groupType: "club" }), true);
    assert.equal(isClubGroup("33", { league: "premier-league" }), true);
    // A community group: non-numeric id, and never marked as a club.
    assert.equal(isClubGroup("my-mates-fc", { groupType: "group" }), false);
    // Numeric id but not a club — still off limits.
    assert.equal(isClubGroup("33", { groupType: "group" }), false);
  });

  console.log("\nSafety guard");
  await it("a short API response archives nothing", async () => {
    await resetDb();
    await seedClub(33);
    await seedClub(40);

    const summary = await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[33, "Manchester United"]], 3),
      season: SEASON,
    });

    assert.equal(summary.skipped, true);
    assert.equal(summary.archived.length, 0);
    // The club missing from that partial response must be untouched.
    assert.equal((await getClub(40)).status, "active");
  });

  console.log("\nPromotion");
  await it("a club in the API with no doc is created and joinable", async () => {
    await resetDb();
    const summary = await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[746, "Sunderland"]]),
      season: SEASON,
    });

    assert.equal(summary.created.length, 20);

    const created = await getClub(746);
    assert.equal(created.slug, "sunderland");
    assert.equal(created.groupClubId, "746");
    assert.equal(created.groupType, "club");
    assert.equal(created.league, "premier-league");
    assert.equal(created.status, "active");
    assert.equal(created.isGroupOpen, true);
    assert.equal(created.isPublic, true);
    assert.equal(created.visibility, "public");
    assert.equal(created.lastActiveSeason, String(SEASON));
  });

  await it("a promoted club's slug never shadows an existing group", async () => {
    await resetDb();
    // A community group has already claimed the obvious slug.
    await db
      .collection("groups")
      .doc("the-lads")
      .set({ slug: "sunderland", groupType: "group" });

    await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[746, "Sunderland"]]),
      season: SEASON,
    });

    assert.equal((await getClub(746)).slug, "sunderland-746");
  });

  console.log("\nRelegation");
  await it("a club missing from the API is frozen, not deleted", async () => {
    await resetDb();
    await seedClub(46, { name: "Leicester", lastActiveSeason: "2025" });

    const summary = await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[33, "Manchester United"]]),
      season: SEASON,
    });

    assert.equal(summary.archived.length, 1);
    assert.equal(summary.archived[0].teamId, "46");

    const archived = await getClub(46);
    assert.equal(archived.status, "archived");
    assert.equal(archived.isGroupOpen, false);
    assert.ok(archived.archivedAt);
    // Still publicly readable: members keep their history.
    assert.equal(archived.isPublic, true);
    assert.equal(archived.visibility, undefined);
    // Pages default to the last season that has data.
    assert.equal(archived.lastActiveSeason, "2025");
  });

  await it("archiving derives lastActiveSeason when it was never set", async () => {
    await resetDb();
    // A hand-created doc from before the registry existed: no lastActiveSeason.
    await db.collection("groups").doc("46").set({
      name: "Leicester",
      slug: "leicester",
      league: "premier-league",
      groupType: "club",
      isPublic: true,
    });

    await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[33, "Manchester United"]]),
      season: SEASON,
    });

    // Absent from season 2026 means last active in 2025.
    assert.equal((await getClub(46)).lastActiveSeason, "2025");
  });

  await it("community groups are never archived", async () => {
    await resetDb();
    await db.collection("groups").doc("my-mates-fc").set({
      name: "My Mates FC",
      slug: "my-mates-fc",
      groupType: "group",
      isPublic: false,
    });

    await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[33, "Manchester United"]]),
      season: SEASON,
    });

    const community = (
      await db.collection("groups").doc("my-mates-fc").get()
    ).data();
    assert.equal(community.status, undefined);
    assert.equal(community.isGroupOpen, undefined);
  });

  console.log("\nSurvivors and re-promotion");
  await it("an owner's closed club group is not forced back open", async () => {
    await resetDb();
    await seedClub(33, { isGroupOpen: false });

    await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[33, "Manchester United"]]),
      season: SEASON,
    });

    // Still active, but updateGroupPrivacy's choice survives the nightly run.
    const club = await getClub(33);
    assert.equal(club.status, "active");
    assert.equal(club.isGroupOpen, false);
  });

  await it("a re-promoted club is reopened and its archivedAt cleared", async () => {
    await resetDb();
    await seedClub(46, {
      status: "archived",
      isGroupOpen: false,
      archivedAt: new Date(),
    });

    const summary = await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[46, "Leicester"]]),
      season: SEASON,
    });

    assert.equal(summary.reactivated.length, 1);

    const club = await getClub(46);
    assert.equal(club.status, "active");
    assert.equal(club.isGroupOpen, true);
    assert.equal(club.archivedAt, undefined);
    assert.equal(club.lastActiveSeason, String(SEASON));
  });

  console.log("\nIdempotence");
  await it("a second run is a no-op", async () => {
    await resetDb();
    const teams = apiTeams([[33, "Manchester United"]]);

    await reconcileClubGroups({ db, apiTeams: teams, season: SEASON });
    const second = await reconcileClubGroups({
      db,
      apiTeams: teams,
      season: SEASON,
    });

    assert.equal(second.created.length, 0);
    assert.equal(second.archived.length, 0);
    assert.equal(second.reactivated.length, 0);
  });

  console.log("\nClub directory");
  await it("the directory lists active clubs first and keeps archived ones", async () => {
    await resetDb();
    await seedClub(46, { name: "Leicester", status: "archived" });

    await reconcileClubGroups({
      db,
      apiTeams: apiTeams([[33, "Manchester United"]]),
      season: SEASON,
    });
    const clubs = await writeClubDirectory({ db, season: SEASON });

    assert.equal(clubs.length, 21);
    assert.equal(clubs[0].status, "active");
    assert.equal(clubs[clubs.length - 1].status, "archived");

    const stored = (
      await db.collection("config").doc("clubDirectory").get()
    ).data();
    assert.equal(stored.season, String(SEASON));
    assert.equal(stored.clubs.length, 21);
    // The picker filters on this: archived clubs must be flagged, not omitted,
    // so the transfer market can explain why a club is gone.
    assert.equal(
      stored.clubs.filter((c) => c.status === "archived").length,
      1,
    );
  });

  await it("private groups stay out of the public directory", async () => {
    await resetDb();
    await seedClub(33);
    await db
      .collection("groups")
      .doc("999")
      .set({ groupType: "club", name: "Secret", slug: "secret", isPublic: false });

    const clubs = await writeClubDirectory({ db, season: SEASON });
    assert.equal(clubs.some((c) => c.teamId === "999"), false);
  });

  await resetDb();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
