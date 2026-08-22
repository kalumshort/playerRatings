/**
 * Firestore security rules regression suite.
 *
 * Run with:  npm run test:rules
 * (wraps `firebase emulators:exec --only firestore "node test/rules.test.mjs"`)
 *
 * Each case names the behaviour it protects. The write-access and vote-dedup
 * cases in particular are guarding against regressions that are invisible in the
 * app: a rule that is too permissive breaks nothing until someone abuses it.
 */
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  increment,
} from "firebase/firestore";
import { readFileSync } from "node:fs";

const PUB = "pub1"; // public group
const PRIV = "priv1"; // private group
const YEAR = "2026";
const MATCH = "m1";
const PLAYER = "p1";

const MEMBER = "user_member";
const ADMIN = "user_admin";
const OUTSIDER = "user_outsider";
const OWNER = "user_owner";

const CODE = "AB3K9P"; // invite for PRIV, doc id is the code itself

let testEnv;
let passed = 0;
let failed = 0;

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

/** Paths the app actually writes, so the tests track real behaviour. */
const p = {
  seasonPlayer: (g) => `groups/${g}/seasons/${YEAR}/players/${PLAYER}`,
  playerMatch: (g) =>
    `groups/${g}/seasons/${YEAR}/players/${PLAYER}/matches/${MATCH}`,
  matchPlayer: (g) =>
    `groups/${g}/seasons/${YEAR}/playerRatings/${MATCH}/players/${PLAYER}`,
  matchRatings: (g) => `groups/${g}/seasons/${YEAR}/playerRatings/${MATCH}`,
  predictions: (g) => `groups/${g}/seasons/${YEAR}/predictions/${MATCH}`,
  liveStats: (g) => `groups/${g}/seasons/${YEAR}/livePlayerStats/${MATCH}`,
  moods: (g) => `groups/${g}/seasons/${YEAR}/fixtureMoods/${MATCH}`,
  userMatch: (u, g) =>
    `users/${u}/groups/${g}/seasons/${YEAR}/matches/${MATCH}`,
};

/**
 * The exact payload handleMatchMotmVote() writes. These key names are the
 * contract between client-actions.ts and firestore.rules.
 */
const motmVote = (playerId) => ({
  motmTotalVotes: increment(1),
  playerVotes: { [playerId]: increment(1) },
});

/** Mirrors handlePlayerRatingSubmit: 4 writes, one batch. */
function ratingBatch(db, groupId, rating = 7) {
  const batch = writeBatch(db);
  const bump = { totalSubmits: increment(1), totalRating: increment(rating) };
  batch.set(doc(db, p.matchPlayer(groupId)), bump, { merge: true });
  batch.set(doc(db, p.playerMatch(groupId)), bump, { merge: true });
  batch.set(doc(db, p.seasonPlayer(groupId)), bump, { merge: true });
  batch.set(
    doc(db, p.userMatch(MEMBER, groupId)),
    { players: { [PLAYER]: rating } },
    { merge: true },
  );
  return batch.commit();
}

async function main() {
  testEnv = await initializeTestEnvironment({
    projectId: "rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });

  // --- Seed: groups + role docs, bypassing rules ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `groups/${PUB}`), {
      slug: "pub",
      name: "Public FC",
      visibility: "public",
      groupClubId: "33",
    });
    await setDoc(doc(db, `groups/${PRIV}`), {
      slug: "priv",
      name: "Private FC",
      visibility: "private",
      groupClubId: "34",
      // The invite rules gate on the ownerId field, not the owners role doc.
      ownerId: OWNER,
    });
    // An invite plus one redemption, as createInviteCode/joinGroupByCode write
    // them. Both are Admin-SDK-only writes, so the suite seeds them directly.
    await setDoc(doc(db, `groupInvites/${CODE}`), {
      inviteCode: CODE,
      groupId: PRIV,
      role: "member",
      active: true,
      usageCount: 1,
    });
    await setDoc(doc(db, `groupInvites/${CODE}/redemptions/${MEMBER}`), {
      uid: MEMBER,
      groupId: PRIV,
      role: "member",
    });
    await setDoc(doc(db, `inviteAttempts/${OUTSIDER}`), { count: 3 });
    // MEMBER is a plain member of both; ADMIN is an admin of the private group
    // and has NO members doc — the case that locked staff out.
    for (const g of [PUB, PRIV]) {
      await setDoc(doc(db, `groupUsers/${g}/members/${MEMBER}`), {
        uid: MEMBER,
        role: "member",
      });
    }
    await setDoc(doc(db, `groupUsers/${PRIV}/admins/${ADMIN}`), {
      uid: ADMIN,
      role: "admin",
    });
    await setDoc(doc(db, `fixtures/${YEAR}/fixtures/f1`), { id: "f1" });
    await setDoc(doc(db, `teamSquads/33/season/${YEAR}`), { players: [] });
    await setDoc(doc(db, "config/clubDirectory"), {
      season: YEAR,
      clubs: [{ teamId: "33", name: "Public FC", slug: "pub" }],
    });
  });

  const member = testEnv.authenticatedContext(MEMBER).firestore();
  const admin = testEnv.authenticatedContext(ADMIN).firestore();
  const outsider = testEnv.authenticatedContext(OUTSIDER).firestore();
  const owner = testEnv.authenticatedContext(OWNER).firestore();
  const anon = testEnv.unauthenticatedContext().firestore();

  console.log("\nReads");
  await it("anonymous can read a public group", () =>
    assertSucceeds(getDoc(doc(anon, `groups/${PUB}`))));
  await it("anonymous CANNOT read a private group", () =>
    assertFails(getDoc(doc(anon, `groups/${PRIV}`))));
  await it("admin (no members doc) CAN read their private group", () =>
    assertSucceeds(getDoc(doc(admin, `groups/${PRIV}`))));
  await it("admin CAN read private group season data", () =>
    assertSucceeds(getDoc(doc(admin, p.predictions(PRIV)))));
  await it("outsider CANNOT read a private group", () =>
    assertFails(getDoc(doc(outsider, `groups/${PRIV}`))));
  await it("anonymous can read fixtures", () =>
    assertSucceeds(getDoc(doc(anon, `fixtures/${YEAR}/fixtures/f1`))));
  await it("anonymous can read team squads", () =>
    assertSucceeds(getDoc(doc(anon, `teamSquads/33/season/${YEAR}`))));
  // The club picker reads this signed out, so it must be world-readable — and
  // Admin-SDK-only for writes, since it decides which clubs the app offers.
  await it("anonymous can read the club directory", () =>
    assertSucceeds(getDoc(doc(anon, "config/clubDirectory"))));
  await it("a signed-in user CANNOT write the club directory", () =>
    assertFails(setDoc(doc(member, "config/clubDirectory"), { clubs: [] })));
  await it("a signed-in user CANNOT read other config docs", () =>
    assertFails(getDoc(doc(member, "config/somethingElse"))));

  console.log("\nWrite access requires a group role (#1)");
  await it("outsider CANNOT write predictions on a PUBLIC group", () =>
    assertFails(
      setDoc(
        doc(outsider, p.predictions(PUB)),
        { result: { home: increment(1) } },
        { merge: true },
      ),
    ));
  await it("outsider CANNOT write the MOTM tally on a PUBLIC group", () =>
    assertFails(setDoc(doc(outsider, p.matchRatings(PUB)), motmVote(PLAYER), {
      merge: true,
    })));
  await it("outsider CANNOT write ratings on a PUBLIC group", () =>
    assertFails(
      setDoc(
        doc(outsider, p.matchPlayer(PUB)),
        { totalSubmits: increment(1), totalRating: increment(7) },
        { merge: true },
      ),
    ));
  await it("member CAN write predictions", () =>
    assertSucceeds(
      setDoc(
        doc(member, p.predictions(PUB)),
        { result: { home: increment(1), totalVotes: increment(1) } },
        { merge: true },
      ),
    ));

  console.log("\nPrediction key allow-list (#7)");
  await it("member CANNOT create a predictions doc with a foreign key", () =>
    assertFails(
      setDoc(
        doc(member, `groups/${PUB}/seasons/${YEAR}/predictions/m_new`),
        { result: { home: increment(1) }, injected: "x" },
        { merge: true },
      ),
    ));
  await it("member CANNOT add a foreign key on update", () =>
    assertFails(
      setDoc(doc(member, p.predictions(PUB)), { injected: "x" }, { merge: true }),
    ));
  await it("member CAN write every real prediction field", () =>
    assertSucceeds(
      setDoc(
        doc(member, p.predictions(PUB)),
        {
          scorePredictions: { "2-1": increment(1) },
          homeGoals: { 2: increment(1) },
          awayGoals: { 1: increment(1) },
          totalScoreVotes: increment(1),
          preMatchMotm: { [PLAYER]: increment(1) },
          preMatchMotmVotes: increment(1),
          formations: { "4-3-3": increment(1) },
          positionConsensus: { 1: { [PLAYER]: increment(1) } },
          totalPlayersSubmits: { [PLAYER]: increment(1) },
          totalTeamSubmits: increment(1),
        },
        { merge: true },
      ),
    ));

  // handlePredictWinningTeam / handlePredictTeamScore / handlePredictPreMatchMotm
  // move a vote by incrementing the new key and decrementing the old one inside
  // a transaction. touchesOnly() only bounds WHICH top-level keys change, so a
  // nested delta must still pass — and the arithmetic must leave the denominator
  // alone when a user changes their mind rather than votes for the first time.
  console.log("\nVote-change deltas (predictions)");
  await it("member CAN write a result delta (increment + decrement)", () =>
    assertSucceeds(
      setDoc(
        doc(member, p.predictions(PUB)),
        { result: { away: increment(1), home: increment(-1) } },
        { merge: true },
      ),
    ));
  await it("member CAN write a score-prediction delta", () =>
    assertSucceeds(
      setDoc(
        doc(member, p.predictions(PUB)),
        {
          scorePredictions: { "3-0": increment(1), "2-1": increment(-1) },
          homeGoals: { 3: increment(1), 2: increment(-1) },
          awayGoals: { 0: increment(1), 1: increment(-1) },
        },
        { merge: true },
      ),
    ));
  await it("a vote change leaves totalVotes untouched", async () => {
    const ref = doc(member, `groups/${PUB}/seasons/${YEAR}/predictions/m_delta`);
    // First vote: choice + denominator.
    await setDoc(
      ref,
      { result: { home: increment(1), totalVotes: increment(1) } },
      { merge: true },
    );
    // Change of mind: swap the choice, denominator stays put.
    await setDoc(
      ref,
      { result: { away: increment(1), home: increment(-1) } },
      { merge: true },
    );
    const snap = await getDoc(ref);
    const r = snap.data().result;
    if (r.home !== 0 || r.away !== 1 || r.totalVotes !== 1) {
      throw new Error(
        `expected home=0 away=1 totalVotes=1, got ${JSON.stringify(r)}`,
      );
    }
  });

  console.log("\nRating validation (#4)");
  await it("member CANNOT create a rating with a negative total", () =>
    assertFails(
      setDoc(
        doc(member, p.matchPlayer(PRIV)),
        { totalSubmits: increment(1), totalRating: increment(-1000) },
        { merge: true },
      ),
    ));
  await it("member CANNOT create a rating above 10", () =>
    assertFails(
      setDoc(
        doc(member, p.matchPlayer(PRIV)),
        { totalSubmits: increment(1), totalRating: increment(50) },
        { merge: true },
      ),
    ));
  await it("member CANNOT smuggle an extra field onto a rating doc", () =>
    assertFails(
      setDoc(
        doc(member, p.matchPlayer(PRIV)),
        { totalSubmits: increment(1), totalRating: increment(7), hacked: true },
        { merge: true },
      ),
    ));

  console.log("\nOne vote per user (#3)");
  await it("member CAN submit a rating once", () =>
    assertSucceeds(ratingBatch(member, PUB)));
  await it("member CANNOT submit a rating for the same player twice", () =>
    assertFails(ratingBatch(member, PUB)));
  await it("member CAN still rate a different player", () =>
    assertSucceeds(
      (() => {
        const batch = writeBatch(member);
        const bump = { totalSubmits: increment(1), totalRating: increment(8) };
        batch.set(
          doc(member, `groups/${PUB}/seasons/${YEAR}/playerRatings/${MATCH}/players/p2`),
          bump,
          { merge: true },
        );
        batch.set(
          doc(member, p.userMatch(MEMBER, PUB)),
          { players: { p2: 8 } },
          { merge: true },
        );
        return batch.commit();
      })(),
    ));
  // handleMatchMotmVote commits both documents in ONE batch. It used to fire
  // them as two independent promises, which let them diverge: if the group
  // tally landed but the user doc didn't, `motmVote` stayed absent, so
  // notYetVotedMotm() still passed and the same member could vote again.
  // These tests mirror the batched shape so that regression can't come back.
  const motmBatch = (db, playerId) => {
    const batch = writeBatch(db);
    batch.set(doc(db, p.matchRatings(PUB)), motmVote(playerId), {
      merge: true,
    });
    batch.set(
      doc(db, p.userMatch(MEMBER, PUB)),
      { motmVote: playerId, ratingsSubmitted: true },
      { merge: true },
    );
    return batch.commit();
  };

  await it("member CAN vote MOTM once (batched shape)", () =>
    assertSucceeds(motmBatch(member, PLAYER)));
  // The double-count this batch exists to prevent: the first commit wrote
  // motmVote onto the user doc, so notYetVotedMotm() now denies the whole batch.
  await it("member CANNOT vote MOTM twice (batch denied as a unit)", () =>
    assertFails(motmBatch(member, "p2")));
  await it("member CANNOT bump the tally alone after voting", () =>
    assertFails(
      setDoc(doc(member, p.matchRatings(PUB)), motmVote("p2"), {
        merge: true,
      }),
    ));

  console.log("\nMOTM tally scope (#2)");
  await it("member CANNOT write a foreign key onto the MOTM doc", () =>
    assertFails(
      setDoc(
        doc(member, p.matchRatings(PRIV)),
        { ...motmVote(PLAYER), injected: 1 },
        { merge: true },
      ),
    ));
  await it("stale field name `motmVotes` is now rejected", () =>
    assertFails(
      setDoc(
        doc(member, p.matchRatings(PRIV)),
        { motmVotes: { [PLAYER]: increment(1) } },
        { merge: true },
      ),
    ));

  console.log("\nDeletes are denied (#5)");
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, p.liveStats(PUB)), { totals: {} });
    await setDoc(doc(db, p.moods(PUB)), { 1: {} });
  });
  await it("member CANNOT delete live player stats", () =>
    assertFails(deleteDoc(doc(member, p.liveStats(PUB)))));
  await it("member CANNOT delete fixture moods", () =>
    assertFails(deleteDoc(doc(member, p.moods(PUB)))));
  await it("member CANNOT delete the MOTM tally", () =>
    assertFails(deleteDoc(doc(member, p.matchRatings(PUB)))));
  await it("member CANNOT delete a predictions doc", () =>
    assertFails(deleteDoc(doc(member, p.predictions(PUB)))));
  await it("member CANNOT delete a rating aggregate", () =>
    assertFails(deleteDoc(doc(member, p.matchPlayer(PUB)))));

  console.log("\nLive stats + moods still work for members");
  await it("member CAN write a live player stat", () =>
    assertSucceeds(
      setDoc(
        doc(member, p.liveStats(PRIV)),
        { totals: { [PLAYER]: { hot: increment(1) } } },
        { merge: true },
      ),
    ));
  await it("member CAN write a fixture mood", () =>
    assertSucceeds(
      setDoc(
        doc(member, p.moods(PRIV)),
        { 12: { buzzing: increment(1) } },
        { merge: true },
      ),
    ));

  console.log("\nUser data isolation");
  await it("member CAN read their own match doc", () =>
    assertSucceeds(getDoc(doc(member, p.userMatch(MEMBER, PUB)))));
  await it("outsider CANNOT read another user's match doc", () =>
    assertFails(getDoc(doc(outsider, p.userMatch(MEMBER, PUB)))));
  await it("outsider CANNOT read another user's profile", () =>
    assertFails(getDoc(doc(outsider, `users/${MEMBER}`))));

  console.log("\nRole docs are never client-writable");
  await it("outsider CANNOT write themselves into admins", () =>
    assertFails(
      setDoc(doc(outsider, `groupUsers/${PUB}/admins/${OUTSIDER}`), {
        role: "admin",
      }),
    ));
  await it("outsider CANNOT write themselves into members", () =>
    assertFails(
      setDoc(doc(outsider, `groupUsers/${PUB}/members/${OUTSIDER}`), {
        role: "member",
      }),
    ));
  await it("member CAN read their own role doc", () =>
    assertSucceeds(getDoc(doc(member, `groupUsers/${PUB}/members/${MEMBER}`))));
  await it("outsider CANNOT read someone else's role doc", () =>
    assertFails(getDoc(doc(outsider, `groupUsers/${PRIV}/members/${MEMBER}`))));

  // An invite code is a bearer token: anyone who can read groupInvites can join
  // every group they can enumerate. Only the owner of the target group may.
  console.log("\nInvites");
  await it("owner CAN read their group's invite", () =>
    assertSucceeds(getDoc(doc(owner, `groupInvites/${CODE}`))));
  await it("member of the group CANNOT read its invite", () =>
    assertFails(getDoc(doc(member, `groupInvites/${CODE}`))));
  await it("admin of the group CANNOT read its invite", () =>
    assertFails(getDoc(doc(admin, `groupInvites/${CODE}`))));
  await it("outsider CANNOT read an invite", () =>
    assertFails(getDoc(doc(outsider, `groupInvites/${CODE}`))));
  await it("anonymous CANNOT read an invite", () =>
    assertFails(getDoc(doc(anon, `groupInvites/${CODE}`))));

  // Deactivation is a direct client write from GroupInviteGenerator, so the
  // update branch has to stay open to the owner and shut to everyone else.
  await it("owner CAN deactivate their invite", () =>
    assertSucceeds(
      setDoc(doc(owner, `groupInvites/${CODE}`), { active: false }, { merge: true }),
    ));
  await it("member CANNOT deactivate an invite", () =>
    assertFails(
      setDoc(doc(member, `groupInvites/${CODE}`), { active: false }, { merge: true }),
    ));
  await it("outsider CANNOT forge an invite for a group they don't own", () =>
    assertFails(
      setDoc(doc(outsider, "groupInvites/FORGED"), {
        groupId: PRIV,
        role: "admin",
        active: true,
      }),
    ));

  await it("owner CAN read who redeemed their invite", () =>
    assertSucceeds(
      getDoc(doc(owner, `groupInvites/${CODE}/redemptions/${MEMBER}`)),
    ));
  await it("member CANNOT read redemption records", () =>
    assertFails(
      getDoc(doc(member, `groupInvites/${CODE}/redemptions/${MEMBER}`)),
    ));
  await it("owner CANNOT write a redemption record (Admin SDK only)", () =>
    assertFails(
      setDoc(doc(owner, `groupInvites/${CODE}/redemptions/${OUTSIDER}`), {
        uid: OUTSIDER,
        groupId: PRIV,
      }),
    ));

  // Reading or resetting these would defeat the join rate limit.
  await it("user CANNOT read their own invite attempt counter", () =>
    assertFails(getDoc(doc(outsider, `inviteAttempts/${OUTSIDER}`))));
  await it("user CANNOT reset their own invite attempt counter", () =>
    assertFails(setDoc(doc(outsider, `inviteAttempts/${OUTSIDER}`), { count: 0 })));

  console.log("\nCatch-all");
  await it("member CANNOT read contact_messages", () =>
    assertFails(getDoc(doc(member, "contact_messages/anything"))));
  await it("member CANNOT read legacy groupInviteLinks", () =>
    assertFails(getDoc(doc(member, "groupInviteLinks/anything"))));

  await testEnv.cleanup();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
