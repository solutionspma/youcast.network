// src/lib/streamStudio/goLiveGuard.ts

export function canGoLive(state: string, stream?: MediaStream) {
  return (
    state === "previewing" &&
    stream &&
    stream.getVideoTracks().length > 0
  );
}
