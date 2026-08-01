"use client";

import { useSyncExternalStore } from "react";
import { hasMapsAuthFailed } from "@/lib/google-maps";

const subscribe = (onChange: () => void) => {
  window.addEventListener("fitfixto:maps-auth-failed", onChange);
  return () => window.removeEventListener("fitfixto:maps-auth-failed", onChange);
};

/**
 * Tracks whether Google rejected the Maps API key.
 *
 * Google reports this asynchronously through its `gm_authFailure` global — long after the
 * script itself has loaded successfully — so it cannot be caught by the script's onerror
 * handler. That global is an external store, so this subscribes to it rather than mirroring
 * it into state. Pages use the result to replace Google's opaque overlay with an explanation
 * of what to change.
 */
export function useMapsAuthFailure(): boolean {
  return useSyncExternalStore(
    subscribe,
    hasMapsAuthFailed,
    // The server never sees a Maps failure; assume healthy so markup matches on hydration.
    () => false
  );
}
