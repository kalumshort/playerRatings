/**
 * Gamification reconcile suite.
 *
 * Run with:  npm --prefix functions run test:reconcile:xp
 * (wraps `firebase emulators:exec --only firestore`)
 *
 * This job is the correctness backstop for every fan's score. The live trigger
 * applies XP as a delta, and Firestore triggers are at-least-once — a retried
 * delivery double-applies and leaves a row permanently inflated. If this job
 * does not overwrite with absolute values, that inflation is forever, so
 * "repairs a corrupted row" is the case that matters most here.
 */
const assert = require("node:assert/strict");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

initializeApp({ projectId: "gamification-test" });
const db = getFirestore();

const { runGamificationReconcile } = require("../gamification/reconcileJob");
const { applyXpDelta } = require("../gamification/progressStore");
const { XP, PREDICTION } = require("../gamification/xpConfig");

const SEASON = "2026";
const GROUP = "42";
const UID = "user_fan";

let passed = 0;
let failed = 0;

/**
 * Runs one named case, reporting rather than throwing so the whole suite runs.
 * @param {string} name - What the case protects.
 * @param {Function} fn - The case body.
 * @return {Promise<void>}
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

/** Clears every collection the suite writes, so cases start known-empty. */
async function resetDb() {
  for (const path of [
    "groups",
    "userProgress",
    "userSeasonProgress",
  ]) {
    const snap = await db.collection(path).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
  for (const role of ["members", "admins", "owners"]) {
    const snap = await db
      .collection("groupUsers")
      .doc(GROUP)
      .collection(role)
      .get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
  const matches = await db
    .collection("users")
    .doc(UID)
    .collection("groups")
    .doc(GROUP)
    .collection("seasons")
    .doc(SEASON)
    .collection("matches")
    .get();
  await Promise.all(matches.docs.map((d) => d.ref.delete()));
}

/**
 * Seeds a club with one member who participated in the given matches.
 * @param {Array<object>} matchDocs - Per-match participation records.
 * @param {string} [role] - Which role collection to put the member in.
 * @return {Promise<void>}
 */
async function seed(matchDocs, role = "members") {
  await db.collection("groups").doc(GROUP).set({ name: "Arsenal" });
  await db
    .collection("groupUsers")
    .doc(GROUP)
    .collection(role)
    .doc(UID)
    .set({ uid: UID });

  for (const [i, data] of matchDocs.entries()) {
    await db
      .collection("users")
      .doc(UID)
      .collection("groups")
      .doc(GROUP)
      .collection("seasons")
      .doc(SEASON)
      .collection("matches")
      .doc(`m${i}`)
      .set(data);
  }
}

/**
 * The reconciled leaderboard row for the seeded fan.
 * @return {Promise<object|undefined>} Row data, if it exists.
 */
async function row() {
  const snap = await db
    .collection("userSeasonProgress")
    .doc(`${SEASON}_${GROUP}_${UID}`)
    .get();
  return snap.data();
}

(async () => {
  console.log("\nGamification reconcile\n");

  await it("computes absolute season XP from the match docs", async () => {
    await resetDb();
    await seed([{ result: "home" }, { result: "away", ScorePrediction: "1-0" }]);

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    const data = await row();
    assert.equal(
      data.xp,
      XP.predictWinner + XP.predictWinner + XP.predictScore,
    );
    assert.equal(data.matchesParticipated, 2);
  });

  await it("repairs a row inflated by a double-applied trigger delta", async () => {
    await resetDb();
    await seed([{ result: "home" }]);

    // Exactly the corruption an at-least-once retry produces.
    await db
      .collection("userSeasonProgress")
      .doc(`${SEASON}_${GROUP}_${UID}`)
      .set({ uid: UID, xp: 999999, matchesParticipated: 50 });

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    const data = await row();
    assert.equal(data.xp, XP.predictWinner);
    assert.equal(data.matchesParticipated, 1);
  });

  await it("is idempotent — running twice changes nothing", async () => {
    await resetDb();
    await seed([{ result: "home", ScorePrediction: "2-1" }]);

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });
    const first = await row();
    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });
    const second = await row();

    assert.equal(first.xp, second.xp);
    assert.equal(first.matchesParticipated, second.matchesParticipated);
  });

  await it("includes admins and owners, not just members", async () => {
    // isGroupMemberServer only checks `members`; using it here would drop a
    // club's own staff off their leaderboard.
    for (const role of ["admins", "owners"]) {
      await resetDb();
      await seed([{ result: "home" }], role);
      await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });
      const data = await row();
      assert.ok(data, `no row produced for a group ${role} entry`);
      assert.equal(data.xp, XP.predictWinner);
    }
  });

  await it("publishes the display name from the user doc", async () => {
    // Regression: nothing ever wrote displayName onto userProgress, so every
    // leaderboard row rendered "Anonymous" forever. The name has to be read
    // from users/{uid}, which is the only place it actually lives.
    await resetDb();
    await seed([{ result: "home" }]);
    await db.collection("users").doc(UID).set({ displayName: "Kalum" });

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    assert.equal((await row()).displayName, "Kalum");
  });

  await it("redacts the display name of an opted-out fan", async () => {
    await resetDb();
    await seed([{ result: "home" }]);
    await db
      .collection("users")
      .doc(UID)
      .set({ displayName: "Kalum", leaderboardAnonymous: true });

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    // Redaction has to happen at write time: both collections are
    // world-readable, so the real name must never be written to either.
    assert.equal((await row()).displayName, null);
    const progress = await db.collection("userProgress").doc(UID).get();
    assert.equal(progress.data().displayName, null);
  });

  await it("propagates a rename to the leaderboard and the cache", async () => {
    await resetDb();
    await seed([{ result: "home" }]);
    await db.collection("users").doc(UID).set({ displayName: "Old Name" });
    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });
    assert.equal((await row()).displayName, "Old Name");

    await db.collection("users").doc(UID).set({ displayName: "New Name" });
    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    assert.equal((await row()).displayName, "New Name");
    // The cache must be re-stamped too, or the trigger keeps serving the old
    // name between nightly runs.
    const progress = await db.collection("userProgress").doc(UID).get();
    assert.equal(progress.data().displayName, "New Name");
    assert.ok(progress.data().nameSyncedAt);
  });

  await it("sets matchesParticipated even when it was never initialised", async () => {
    // Regression: the trigger only incremented this when XP crossed zero, so a
    // doc whose participation predated the trigger never got the field at all.
    await resetDb();
    await seed([{ result: "home" }, { result: "away" }]);
    await db
      .collection("userSeasonProgress")
      .doc(`${SEASON}_${GROUP}_${UID}`)
      .set({ uid: UID, xp: 20 }); // no matchesParticipated

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    assert.equal((await row()).matchesParticipated, 2);
  });

  await it("rebuilds all-time XP as the sum of every season row", async () => {
    await resetDb();
    await seed([{ result: "home" }]);

    // A previous season the current run does not touch; its XP must survive.
    await db
      .collection("userSeasonProgress")
      .doc(`2025_${GROUP}_${UID}`)
      .set({ uid: UID, season: "2025", groupId: GROUP, xp: 500 });

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    const progress = await db.collection("userProgress").doc(UID).get();
    assert.equal(progress.data().totalXp, 500 + XP.predictWinner);
  });

  await it("a dry run reports without writing", async () => {
    await resetDb();
    await seed([{ result: "home" }]);

    const summary = await runGamificationReconcile({
      db,
      season: SEASON,
      logger: { info: () => {} },
      dryRun: true,
    });

    assert.ok(summary.rows > 0);
    assert.equal(await row(), undefined);
  });

  // --- Prediction points ------------------------------------------------
  console.log("\nPrediction points via reconcile\n");

  /**
   * Writes a finished fixture the reconcile will score against.
   * @param {string} matchId - Fixture doc id.
   * @param {object} data - Fixture fields.
   * @return {Promise<void>}
   */
  const seedFixture = (matchId, data) =>
    db
      .collection(`fixtures/${SEASON}/fixtures`)
      .doc(matchId)
      .set({ status: "FT", goals: { home: 2, away: 1 }, ...data });

  await it("scores predictions and keeps them off the XP total", async () => {
    await resetDb();
    await db.collection(`fixtures/${SEASON}/fixtures`).doc("m0").delete();
    await seed([{ result: "home", ScorePrediction: "2-1" }]);
    await seedFixture("m0", {});

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    const data = await row();
    assert.equal(
      data.predictionPoints,
      PREDICTION.correctResult + PREDICTION.exactScore,
    );
    // The two ladders must not bleed into each other.
    assert.equal(data.xp, XP.predictWinner + XP.predictScore);
  });

  await it("pays nothing for predictions on an unfinished match", async () => {
    await resetDb();
    await seed([{ result: "home", ScorePrediction: "2-1" }]);
    await seedFixture("m0", { status: "1H" });

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    assert.equal((await row()).predictionPoints, 0);
  });

  await it("still pays XP when no fixture exists to score against", async () => {
    await resetDb();
    await db.collection(`fixtures/${SEASON}/fixtures`).doc("m0").delete();
    await seed([{ result: "home" }]);

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    const data = await row();
    assert.equal(data.predictionPoints, 0);
    assert.equal(data.xp, XP.predictWinner);
  });

  await it("is idempotent — points do not accumulate across runs", async () => {
    await resetDb();
    await seed([{ result: "home" }]);
    await seedFixture("m0", {});

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });
    const first = (await row()).predictionPoints;
    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });
    const second = (await row()).predictionPoints;

    assert.equal(first, PREDICTION.correctResult);
    assert.equal(second, first);
  });

  await it("scores the XI against groupClubId, not the group id", async () => {
    // Regression: community groups sit at groups/{ownId} while following a
    // different club — "The United Stand" is groups/007 following club 33.
    // Scoring against the group id matched nothing in the feed and silently
    // paid zero, and community groups hold some of the most active fans.
    await resetDb();

    const COMMUNITY = "007";
    const CLUB_ID = 33;
    await db
      .collection("groups")
      .doc(COMMUNITY)
      .set({ name: "The United Stand", groupClubId: String(CLUB_ID) });
    await db
      .collection("groupUsers")
      .doc(COMMUNITY)
      .collection("members")
      .doc(UID)
      .set({ uid: UID });

    const eleven = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    await db
      .collection("users").doc(UID)
      .collection("groups").doc(COMMUNITY)
      .collection("seasons").doc(SEASON)
      .collection("matches").doc("mc")
      .set({
        chosenTeam: Object.fromEntries(eleven.map((id, i) => [String(i + 1), String(id)])),
        teamSubmitted: true,
      });

    await seedFixture("mc", {
      lineups: [
        { team: { id: CLUB_ID }, startXI: eleven.map((id) => ({ player: { id } })) },
      ],
    });

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    const snap = await db
      .collection("userSeasonProgress")
      .doc(`${SEASON}_${COMMUNITY}_${UID}`)
      .get();

    assert.equal(
      snap.data().predictionPoints,
      11 * PREDICTION.xiHit + PREDICTION.perfectXi,
    );

    // Clean up the extra group this case introduced.
    await db.collection("groups").doc(COMMUNITY).delete();
    await db.collection("groupUsers").doc(COMMUNITY).collection("members").doc(UID).delete();
    await db.collection(`fixtures/${SEASON}/fixtures`).doc("mc").delete();
    await db.collection("userSeasonProgress").doc(`${SEASON}_${COMMUNITY}_${UID}`).delete();
    await db.collection("users").doc(UID).collection("groups").doc(COMMUNITY)
      .collection("seasons").doc(SEASON).collection("matches").doc("mc").delete();
  });

  await db.collection(`fixtures/${SEASON}/fixtures`).doc("m0").delete();

  // --- The live trigger's write path -----------------------------------
  console.log("\nXP delta (live trigger path)\n");

  /**
   * Runs applyXpDelta the way the trigger does.
   * @param {number} xpDelta - Signed XP change.
   * @param {boolean} nowParticipating - Whether XP crossed zero this write.
   * @return {Promise<void>}
   */
  const applyAsTrigger = (xpDelta, nowParticipating) =>
    applyXpDelta({
      db,
      uid: UID,
      groupId: GROUP,
      season: SEASON,
      xpDelta,
      nowParticipating,
    });

  await it("a first-ever award seeds the name from the user doc", async () => {
    await resetDb();
    await db.collection("users").doc(UID).set({ displayName: "Kalum" });

    await applyAsTrigger(XP.predictWinner, true);

    assert.equal((await row()).displayName, "Kalum");
    assert.equal((await row()).xp, XP.predictWinner);
  });

  await it("a first-ever award respects the anonymity opt-out", async () => {
    await resetDb();
    await db
      .collection("users")
      .doc(UID)
      .set({ displayName: "Kalum", leaderboardAnonymous: true });

    await applyAsTrigger(XP.predictWinner, true);

    assert.equal((await row()).displayName, null);
  });

  await it("initialises matchesParticipated on a pre-existing doc", async () => {
    // The exact production case: predictions existed before the trigger was
    // deployed, so the first event is an UPDATE and nowParticipating is false.
    await resetDb();
    await db.collection("users").doc(UID).set({ displayName: "Kalum" });

    await applyAsTrigger(XP.predictScore, false);

    assert.equal((await row()).matchesParticipated, 1);
  });

  await it("does not double-count matches on later writes", async () => {
    await resetDb();
    await db.collection("users").doc(UID).set({ displayName: "Kalum" });

    await applyAsTrigger(XP.predictWinner, true);
    await applyAsTrigger(XP.predictScore, false);
    await applyAsTrigger(XP.motmVote, false);

    assert.equal((await row()).matchesParticipated, 1);
  });

  await it("caches the name so repeat awards do not re-read the user", async () => {
    await resetDb();
    await db.collection("users").doc(UID).set({ displayName: "Kalum" });
    await applyAsTrigger(XP.predictWinner, true);

    // Rename at source; the cached value must win until reconcile refreshes it.
    await db.collection("users").doc(UID).set({ displayName: "Renamed" });
    await applyAsTrigger(XP.predictScore, false);

    assert.equal((await row()).displayName, "Kalum");

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });
    // Seeded membership is needed for reconcile to see this user at all.
  });

  await resetDb();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
