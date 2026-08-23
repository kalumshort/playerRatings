/**
 * Drift guard for the gamification scoring mirrors.
 *
 * Run with:  npm run test:mirrors
 *
 * The scoring rules exist twice, because `src/` (ESM/TS) and `functions/`
 * (CJS) are separate packages that cannot import each other:
 *
 *   functions/gamification/computeMatchXp.js     AUTHORITATIVE — pays fans
 *   src/lib/gamification/computeMatchXp.ts       display only — the match card
 *
 * A silent divergence means the card promises XP the leaderboard never grants,
 * which is worse than showing nothing. Neither the emulator suite (JS only)
 * nor `tsc` (types only) can catch that, so this compiles the TS copies to a
 * throwaway directory and runs both implementations over the same cases.
 *
 * Add a case here whenever you add a scoring rule.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src", "lib", "gamification");
const FUNCTIONS = path.join(ROOT, "functions", "gamification");

const out = mkdtempSync(path.join(tmpdir(), "mirror-"));

try {
  // The local tsc entry point run through node, not `npx`: on Windows npx is a
  // .cmd and execFileSync cannot spawn it without a shell.
  execFileSync(
    process.execPath,
    [
      path.join(ROOT, "node_modules", "typescript", "bin", "tsc"),
      path.join(SRC, "computeMatchXp.ts"),
      path.join(SRC, "computePredictionPoints.ts"),
      path.join(SRC, "xpConfig.ts"),
      "--outDir", out,
      "--module", "commonjs",
      "--target", "es2020",
      "--skipLibCheck",
      "--moduleResolution", "node",
    ],
    { cwd: ROOT, stdio: "inherit" },
  );

  const require = createRequire(pathToFileURL(path.join(out, "x.cjs")));
  const js = {
    xp: require(path.join(FUNCTIONS, "computeMatchXp.js")).computeMatchXp,
    pts: require(path.join(FUNCTIONS, "predictionPoints.js")).computePredictionPoints,
    caps: require(path.join(FUNCTIONS, "xpConfig.js")).XP_CAPS,
  };
  const ts = {
    xp: require(path.join(out, "computeMatchXp.js")).computeMatchXp,
    pts: require(path.join(out, "computePredictionPoints.js")).computePredictionPoints,
  };

  let failed = 0;
  const check = (name, a, b) => {
    if (a === b) {
      console.log(`  ✓ ${name} (${a})`);
    } else {
      console.error(`  ✗ ${name}: functions=${a} src=${b}`);
      failed++;
    }
  };

  const eleven = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const chosen = (ids) =>
    Object.fromEntries(ids.map((id, i) => [String(i + 1), String(id)]));

  const maxed = {
    result: "home",
    ScorePrediction: "2-1",
    preMatchMotm: "9",
    teamSubmitted: true,
    chosenTeam: chosen(eleven),
    players: Object.fromEntries(
      Array.from({ length: js.caps.ratedPlayers }, (_, i) => [String(i), 7]),
    ),
    ratingsSubmitted: true,
    motmVote: "9",
    moodTaps: js.caps.moodTaps,
    liveVotes: js.caps.liveVotes,
    reactions: js.caps.eventReactions,
  };

  console.log("\nFan XP mirror");
  for (const [name, doc] of [
    ["empty doc", {}],
    ["undefined doc", undefined],
    ["maxed out", maxed],
    ["winner only", { result: "home" }],
    ["ratings only", { players: { 1: 7, 2: 8 } }],
    ["over every cap", {
      ...maxed,
      moodTaps: 999,
      liveVotes: 999,
      reactions: 999,
      players: Object.fromEntries(Array.from({ length: 99 }, (_, i) => [i, 7])),
    }],
    ["hostile values", { moodTaps: -5, liveVotes: "x", reactions: null }],
    ["four areas, no Full 90", { ...maxed, reactions: 0 }],
  ]) {
    check(name, js.xp(doc).xp, ts.xp(doc).xp);
  }

  const fx = (o = {}) => ({ status: "FT", goals: { home: 2, away: 1 }, ...o });
  const sheet = (ids) => [
    { team: { id: 42 }, startXI: ids.map((id) => ({ player: { id } })) },
  ];

  console.log("\nPrediction points mirror");
  for (const [name, doc, fixture] of [
    ["unfinished match", { result: "home" }, fx({ status: "1H" })],
    ["correct result", { result: "home" }, fx()],
    ["exact scoreline", { result: "home", ScorePrediction: "2-1" }, fx()],
    ["all wrong", { result: "away", ScorePrediction: "0-0" }, fx()],
    ["perfect XI", { chosenTeam: chosen(eleven) }, fx({ lineups: sheet(eleven) })],
    ["partial XI", { chosenTeam: chosen([1, 2, 3, 98, 99]) }, fx({ lineups: sheet(eleven) })],
    ["no team sheet", { result: "home", chosenTeam: chosen(eleven) }, fx({ lineups: [] })],
    ["player to watch scored", { preMatchMotm: "978" },
      fx({ events: [{ type: "Goal", detail: "Normal Goal", player: { id: 978 }, assist: {} }] })],
    ["own goal does not count", { preMatchMotm: "978" },
      fx({ events: [{ type: "Goal", detail: "Own Goal", player: { id: 978 }, assist: {} }] })],
    ["shootout is a draw", { result: "draw" }, fx({ status: "PEN", goals: { home: 1, away: 1 } })],
  ]) {
    check(name, js.pts(doc, fixture, 42).points, ts.pts(doc, fixture, 42).points);
  }

  console.log(
    failed === 0
      ? "\nMirrors agree.\n"
      : `\n${failed} mismatch(es) — the card would disagree with the leaderboard.\n`,
  );
  process.exit(failed === 0 ? 0 : 1);
} finally {
  rmSync(out, { recursive: true, force: true });
}
