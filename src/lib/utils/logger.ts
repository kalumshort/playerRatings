/**
 * Development-only logging.
 *
 * The app used to print Firestore document paths and live vote payloads to the
 * browser console in production, which hands an attacker a map of the data
 * model for free. Use `devLog` for tracing; keep `console.error` for real
 * failures worth seeing in production.
 */
const isDev = process.env.NODE_ENV !== "production";

export const devLog = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

export const devWarn = (...args: unknown[]) => {
  if (isDev) console.warn(...args);
};
