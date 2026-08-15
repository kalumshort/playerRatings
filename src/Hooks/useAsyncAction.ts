"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface AsyncActionOptions {
  /** Shown as a success toast. Omit for silent success. */
  successMessage?: string;
  /** Fallback message when the error can't be mapped to something friendlier. */
  errorMessage?: string;
  /** Sonner dedupe key, so a burst of failures collapses into one toast. */
  toastId?: string;
  onSuccess?: () => void;
  /** Re-throw after reporting, for callers that need to branch on failure. */
  rethrow?: boolean;
}

export interface AsyncAction<A extends any[], R> {
  /** Returns undefined if a call is already in flight, or on failure. */
  run: (...args: A) => Promise<R | undefined>;
  pending: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Maps a Firestore/Firebase error to something a fan can act on.
 *
 * `permission-denied` is the common one: firestore.rules dedupes ratings and
 * MOTM votes via notYetRated()/notYetVotedMotm(), so a repeat submit lands
 * here rather than being a network problem.
 */
const describeError = (error: any, fallback?: string): string => {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "");

  if (code === "permission-denied" || code === "functions/permission-denied") {
    return fallback ?? "You've already submitted this.";
  }
  if (
    code === "unavailable" ||
    code === "deadline-exceeded" ||
    /network|offline|timeout/i.test(message)
  ) {
    return "Connection problem. Check your signal and try again.";
  }
  return fallback ?? "Something went wrong. Try again.";
};

/**
 * Wraps an async write with a pending flag, a re-entry guard and user-visible
 * error reporting.
 *
 * The guard is a ref, not the `pending` state, on purpose: two clicks within a
 * single React tick both read the same stale `pending === false`, so only a ref
 * set synchronously before the first `await` actually blocks the second call.
 * That is what stops double-tapping a vote from writing twice.
 */
export const useAsyncAction = <A extends any[], R>(
  action: (...args: A) => Promise<R>,
  options: AsyncActionOptions = {},
): AsyncAction<A, R> => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const isMountedRef = useRef(true);

  // Keep the latest action/options without churning `run`'s identity — call
  // sites pass inline lambdas and object literals.
  const actionRef = useRef(action);
  actionRef.current = action;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (...args: A): Promise<R | undefined> => {
    if (inFlightRef.current) return undefined;
    inFlightRef.current = true;

    setPending(true);
    setError(null);

    try {
      const result = await actionRef.current(...args);
      const { successMessage, toastId, onSuccess } = optionsRef.current;

      if (successMessage) toast.success(successMessage, { id: toastId });
      onSuccess?.();

      return result;
    } catch (err: any) {
      const { errorMessage, toastId, rethrow } = optionsRef.current;
      const message = describeError(err, errorMessage);

      console.error("Async action failed:", err);
      toast.error(message, { duration: 6000, id: toastId });

      // Only touch state if we're still on screen — several call sites unmount
      // themselves on success (results views, Swiper slides).
      if (isMountedRef.current) setError(message);
      if (rethrow) throw err;

      return undefined;
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) setPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setPending(false);
    inFlightRef.current = false;
  }, []);

  return { run, pending, error, reset };
};

export default useAsyncAction;
