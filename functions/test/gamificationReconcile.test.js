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
const { XP } = require("../gamification/xpConfig");

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

  await it("redacts the display name of an opted-out fan", async () => {
    await resetDb();
    await seed([{ result: "home" }]);
    await db
      .collection("userProgress")
      .doc(UID)
      .set({ displayName: "Kalum", anonymous: true });

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    // Redaction has to happen at write time: this collection is world-readable.
    assert.equal((await row()).displayName, null);
  });

  await it("publishes the display name of a fan who has not opted out", async () => {
    await resetDb();
    await seed([{ result: "home" }]);
    await db.collection("userProgress").doc(UID).set({ displayName: "Kalum" });

    await runGamificationReconcile({ db, season: SEASON, logger: { info: () => {} } });

    assert.equal((await row()).displayName, "Kalum");
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

  await resetDb();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
