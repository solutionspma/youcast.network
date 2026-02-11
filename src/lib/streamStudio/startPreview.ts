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
  // CRITICAL: Always request BOTH video and audio for WebRTC transmission
  const constraints: MediaStreamConstraints = {
    video: {
      deviceId: opts?.cameraId ? { exact: opts.cameraId } : undefined,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: {
      deviceId: opts?.micId ? { exact: opts.micId } : undefined,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  };

  // 4. Request media (BOTH video and audio)
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // 5. Validate and log audio/video tracks for WebRTC transmission
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();
  console.log(`📹 Video tracks captured: ${videoTracks.length}`);
  console.log(`🎤 Audio tracks captured: ${audioTracks.length}`);

  if (videoTracks.length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("No video tracks captured - camera may be unavailable");
  }

  if (audioTracks.length === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("No audio tracks captured - microphone may be unavailable");
  }

  console.log(`✅ Stream contains ${videoTracks.length} video track(s) and ${audioTracks.length} audio track(s)`);

  // 6. Create / attach video element
  const video =
    opts?.videoEl ?? document.createElement("video");

  video.srcObject = stream;
  video.muted = true;          // REQUIRED for autoplay
  video.playsInline = true;    // REQUIRED for iOS
  video.autoplay = true;
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.background = "black";

  // 7. Explicitly start playback (CRITICAL)
  await video.play();

  // 8. Wait until real frames exist
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

  // 9. Final validation (frames must exist)
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("Camera produced no frames");
  }

  // 10. Initialize WebRTC peer connection and add ALL tracks (video + audio)
  // This ensures both streams are ready for transmission over WebRTC
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
    ]
  });

  console.log('🔌 RTCPeerConnection created');

  // Add ALL tracks (video + audio) to peer connection for WebRTC transmission
  stream.getTracks().forEach(track => {
    console.log(`➕ Adding ${track.kind} track to peer connection:`, track.label);
    peerConnection.addTrack(track, stream);
  });

  // 11. Confirm audio sender exists
  const senders = peerConnection.getSenders();
  const videoSenders = senders.filter(s => s.track?.kind === 'video');
  const audioSenders = senders.filter(s => s.track?.kind === 'audio');

  console.log(`📊 Peer connection senders - Video: ${videoSenders.length}, Audio: ${audioSenders.length}`);

  if (audioSenders.length === 0) {
    console.error('❌ ERROR: No audio sender found - microphone not transmitting!');
    stream.getTracks().forEach((t) => t.stop());
    peerConnection.close();
    throw new Error("Audio tracks added to peer connection but no audio sender confirmed");
  }

  console.log('✅ Audio sender confirmed - microphone ready for transmission');

  return {
    videoEl: video,
    stream,
  };
}
