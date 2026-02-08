// src/lib/streamStudio/constants.ts

export const STREAM_STUDIO_MODE = "LIVE_ONLY" as const;

if (STREAM_STUDIO_MODE !== "LIVE_ONLY") {
  throw new Error("Stream Studio must not use mock data");
}

export function assertNoExternalReset(source: string): boolean {
  if (source !== "user") {
    console.warn("🚫 Blocked external reset from:", source);
    return false;
  }
  return true;
}

export type StreamDBState = "draft" | "live" | "ended";

export const STREAM_STATE_RULES = {
  draft: "Preview allowed, not publishing",
  live: "Publishing to LiveKit",
  ended: "Teardown complete",
} as const;
