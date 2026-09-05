/**
 * Shared bootstrap for the local admin scripts.
 *
 * Every script in here needs the same three things before it can do anything:
 * the env files read in the right precedence, the API key pushed onto
 * process.env (helperFunctions reads it at call time), and firebase-admin
 * initialised against production with the service account from .env.local.
 *
 * This was copy-pasted between syncLeagues.js and updateNow.js — the second
 * copy's own comment pointed at the first. A third script is what made it
 * worth having one.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..");

/**
 * Minimal .env reader — avoids a dependency for a handful of files. Handles
 * bare, single-quoted and double-quoted values, including the escaped newlines
 * a service-account private key is usually stored with.
 * @param {string} file - Absolute path to the env file.
 * @return {object} Parsed key/value pairs, empty if the file is absent.
 */
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};

  const parsed = {};
  const pattern =
    /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("(?:[^"\\]|\\[\s\S])*"|'(?:[^'\\]|\\[\s\S])*'|[^\n#]*)/gm;
  const contents = fs.readFileSync(file, "utf8");

  let match;
  while ((match = pattern.exec(contents)) !== null) {
    const key = match[1];
    let value = match[2].trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\n/g, "\n");
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

/**
 * Reads the project's env files, later files winning, with the real process
 * environment on top.
 * @return {object} Merged key/value pairs.
 */
function loadEnv() {
  return {
    ...readEnvFile(path.join(ROOT, ".env.local")),
    ...readEnvFile(path.join(ROOT, "functions", ".env")),
    ...readEnvFile(path.join(ROOT, "functions", ".env.local")),
    ...process.env,
  };
}

/**
 * Reads a `--name=value` or boolean `--name` argument from argv.
 * @param {string} name - Flag name without dashes.
 * @return {string|boolean|null} Value, true when present without one, else null.
 */
function arg(name) {
  const hit = process.argv.find(
    (a) => a === `--${name}` || a.startsWith(`--${name}=`),
  );
  if (!hit) return null;
  return hit.includes("=") ? hit.split("=").slice(1).join("=") : true;
}

/**
 * Reads a comma-separated list of integers from a flag.
 * @param {string} name - Flag name without dashes.
 * @return {Array<number>|null} Parsed ids, or null when the flag is absent.
 */
function intListArg(name) {
  const raw = arg(name);
  if (!raw || raw === true) return null;
  return String(raw).split(",").map(Number).filter(Number.isInteger);
}

/**
 * Exits with a message unless every named key is present.
 * @param {object} env - Merged env.
 * @param {Array<string>} keys - Required key names.
 * @return {void}
 */
function requireEnv(env, keys) {
  for (const key of keys) {
    if (!env[key]) {
      console.error(`\n  ${key} is not set — expected it in .env.local\n`);
      process.exit(1);
    }
  }
}

/**
 * Loads env, optionally demands an API key, and initialises firebase-admin
 * against production Firestore.
 * @param {object} [options] - { requireApiKey } — defaults to true.
 * @return {object} { db, env } for the caller to work with.
 */
function bootstrap({ requireApiKey = true } = {}) {
  const env = loadEnv();

  if (requireApiKey && !env.FOOTBALL_API_KEY) {
    console.error(
      "\n  FOOTBALL_API_KEY is not set.\n" +
        "  Add it to functions/.env.local:  FOOTBALL_API_KEY=your_key_here\n",
    );
    process.exit(1);
  }

  requireEnv(env, [
    "ADMIN_PROJECT_ID",
    "ADMIN_CLIENT_EMAIL",
    "ADMIN_PRIVATE_KEY",
  ]);

  // helperFunctions reads the key off process.env at call time.
  if (env.FOOTBALL_API_KEY) process.env.FOOTBALL_API_KEY = env.FOOTBALL_API_KEY;

  const { initializeApp, cert } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");

  initializeApp({
    credential: cert({
      projectId: env.ADMIN_PROJECT_ID,
      clientEmail: env.ADMIN_CLIENT_EMAIL,
      privateKey: env.ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  return { db: getFirestore(), env };
}

/**
 * Pads a value to a fixed column width, truncating if it overflows.
 * @param {*} value - Value to render.
 * @param {number} width - Column width.
 * @return {string} Padded string.
 */
const pad = (value, width) => String(value ?? "").padEnd(width).slice(0, width);

module.exports = {
  ROOT,
  arg,
  bootstrap,
  intListArg,
  loadEnv,
  pad,
  readEnvFile,
  requireEnv,
};
