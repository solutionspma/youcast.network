// src/app/dashboard/stream-studio/StreamStudio.tsx

"use client";

import { useRef } from "react";
import { useStreamStudio } from "./useStreamStudio";

export default function StreamStudio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, controller } = useStreamStudio();

  return (
    <div className="studio">
      <div className="preview">
        <video ref={videoRef} className="video-preview" autoPlay playsInline muted />
      </div>

      <div className="controls">
        {state === "idle" && (
          <button onClick={() =>
            controller.startPreview({
              videoEl: videoRef.current!,
            })
          }>
            Start Preview
          </button>
        )}

        {state === "previewing" && (
          <button disabled>
            Preview Ready
          </button>
        )}

        {state === "previewing" && (
          <button
            onClick={async () => {
              // token + publish injected here
            }}
          >
            Go Live
          </button>
        )}

        {state === "live" && (
          <button onClick={() => controller.stopLive()}>
            Stop Stream
          </button>
        )}

        {state === "error" && (
          <button onClick={() => controller.stopPreview()}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
