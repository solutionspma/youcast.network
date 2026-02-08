// src/lib/streamStudio/startPreview.ts

export type PreviewResult = {
  videoEl: HTMLVideoElement;
  stream: MediaStream;
};

export async function startPreview(
  opts?: {
    cameraId?: string;
    micId?: string;
    videoEl?: HTMLVideoElement;
  }
): Promise<PreviewResult> {
  // 1. Guard: secure context
  if (
    location.protocol !== "https:" &&
    location.hostname !== "localhost"
  ) {
    throw new Error("getUserMedia requires HTTPS or localhost");
  }

  // 2. Stop any existing tracks (prevents Logitech lockups)
  if (opts?.videoEl?.srcObject instanceof MediaStream) {
    opts.videoEl.srcObject.getTracks().forEach((t) => t.stop());
  }

  // 3. Safe constraints (Logitech C922 compatible)
  const constraints: MediaStreamConstraints = {
    video: {
      deviceId: opts?.cameraId ? { exact: opts.cameraId } : undefined,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: opts?.micId
      ? { deviceId: { exact: opts.micId } }
      : true,
  };

  // 4. Request media
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // 5. Create / attach video element
  const video =
    opts?.videoEl ?? document.createElement("video");

  video.srcObject = stream;
  video.muted = true;          // REQUIRED for autoplay
  video.playsInline = true;    // REQUIRED for iOS
  video.autoplay = true;
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.background = "black";

  // 6. Explicitly start playback (CRITICAL)
  await video.play();

  // 7. Wait until real frames exist
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Camera timeout")),
      5000
    );

    const check = () => {
      if (
        video.readyState >=
        HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        clearTimeout(timeout);
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });

  // 8. Final validation (frames must exist)
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("Camera produced no frames");
  }

  return {
    videoEl: video,
    stream,
  };
}
