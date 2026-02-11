/**
 * Stream Studio Audio Initialization
 * ============================================================================
 * Handles microphone capture, Web Audio graph creation, and VU meter binding.
 * Single source of truth for audio capture and routing.
 */

export interface AudioSourceConfig {
  id: string;
  type: 'microphone' | 'desktop' | 'media';
  stream: MediaStream;
  label: string;
}

export interface AudioSource {
  id: string;
  label: string;
  stream: MediaStream;
  mediaStreamSource: MediaStreamAudioSourceNode;
  gainNode: GainNode;
  analyzerNode: AnalyserNode;
  readyState: 'live' | 'ended';
}

interface StreamAudioState {
  context: AudioContext | null;
  sources: Map<string, AudioSource>;
  masterGainNode: GainNode | null;
  masterDestination: MediaStreamAudioDestinationNode | null;
  metering: {
    animationId: number | null;
    updateCallbacks: Set<(data: MeterData) => void>;
  };
}

export interface MeterData {
  sourceId: string;
  peak: number;        // 0-100
  rms: number;         // 0-100
  isActive: boolean;   // track.readyState === 'live'
}

// Global audio state
let audioState: StreamAudioState = {
  context: null,
  sources: new Map(),
  masterGainNode: null,
  masterDestination: null,
  metering: {
    animationId: null,
    updateCallbacks: new Set(),
  },
};

/**
 * Initialize AudioContext and master output chain
 */
async function initializeAudioContext(): Promise<AudioContext> {
  if (audioState.context) return audioState.context;

  // Request permissions to get microphone
  try {
    await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
  } catch (e) {
    console.warn('Mic permission denied (may already be granted):', e);
  }

  // Create audio context (resumes automatically in browsers)
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  audioState.context = ctx;

  // Create master gain
  audioState.masterGainNode = ctx.createGain();
  audioState.masterGainNode.gain.value = 0.8;

  // Create destination (MediaStreamAudioDestination for streaming/recording)
  audioState.masterDestination = ctx.createMediaStreamDestination();

  // Connect chain: masterGain → destination + system output
  audioState.masterGainNode.connect(audioState.masterDestination);
  audioState.masterGainNode.connect(ctx.destination); // Monitor output

  console.log('✅ AudioContext initialized');
  return ctx;
}

/**
 * Add or rebind an audio source (microphone, desktop, etc.)
 * Returns the Audio Source with all nodes ready for binding
 */
export async function addAudioSource(
  config: AudioSourceConfig
): Promise<AudioSource> {
  const ctx = await initializeAudioContext();

  // Validate stream
  const audioTracks = config.stream.getAudioTracks();
  if (audioTracks.length === 0) {
    throw new Error(
      `No audio tracks in ${config.type} stream (${config.label})`
    );
  }

  const track = audioTracks[0];
  if (!track.enabled) {
    console.warn(`⚠️ Audio track disabled for ${config.label}, enabling...`);
    track.enabled = true;
  }

  console.log(
    `🎤 Capturing ${config.type} (${config.label}):`,
    `track.enabled=${track.enabled}, readyState=${track.readyState}`
  );

  // Create audio graph for this source:
  // MediaStreamSource → GainNode → AnalyzerNode → Master

  const mediaStreamSource = ctx.createMediaStreamSource(config.stream);
  const gainNode = ctx.createGain();
  gainNode.gain.value = 1; // 0dB

  const analyzerNode = ctx.createAnalyser();
  analyzerNode.fftSize = 2048;
  analyzerNode.smoothingTimeConstant = 0.85;

  // Connect chain
  mediaStreamSource.connect(gainNode);
  gainNode.connect(analyzerNode);
  analyzerNode.connect(audioState.masterGainNode!); // To mixer

  const source: AudioSource = {
    id: config.id,
    label: config.label,
    stream: config.stream,
    mediaStreamSource,
    gainNode,
    analyzerNode,
    readyState: (track.readyState as 'live' | 'ended') || 'live',
  };

  audioState.sources.set(config.id, source);

  // Start metering if first source
  if (audioState.sources.size === 1) {
    startMetering();
  }

  console.log(`✅ Audio source added: ${config.id} (${config.label})`);
  return source;
}

/**
 * Remove an audio source and disconnect all nodes
 */
export function removeAudioSource(sourceId: string): void {
  const source = audioState.sources.get(sourceId);
  if (!source) return;

  // Disconnect all nodes
  source.mediaStreamSource.disconnect();
  source.gainNode.disconnect();
  source.analyzerNode.disconnect();

  // Stop audio tracks
  source.stream.getAudioTracks().forEach((track) => track.stop());

  audioState.sources.delete(sourceId);

  console.log(`✅ Audio source removed: ${sourceId}`);
}

/**
 * Get current audio source (by ID)
 */
export function getAudioSource(sourceId: string): AudioSource | undefined {
  return audioState.sources.get(sourceId);
}

/**
 * Get all audio sources
 */
export function getAllAudioSources(): AudioSource[] {
  return Array.from(audioState.sources.values());
}

/**
 * Set gain for specific source (0-1 in linear scale, or dB conversion)
 */
export function setSourceGain(sourceId: string, gainLinear: number): void {
  const source = audioState.sources.get(sourceId);
  if (source) {
    source.gainNode.gain.setTargetAtTime(
      gainLinear,
      audioState.context!.currentTime,
      0.01
    );
  }
}

/**
 * Get output stream for streaming/recording
 */
export function getOutputStream(): MediaStream | null {
  return audioState.masterDestination?.stream || null;
}

/**
 * Start real-time VU metering
 */
function startMetering(): void {
  if (audioState.metering.animationId) return;

  const updateMeters = () => {
    const meterArray: MeterData[] = [];

    audioState.sources.forEach((source) => {
      // Get audio data from analyzer
      const dataArray = new Float32Array(source.analyzerNode.frequencyBinCount);
      source.analyzerNode.getFloatTimeDomainData(dataArray);

      // Check if track is live
      const audioTracks = source.stream.getAudioTracks();
      const isActive = audioTracks.length > 0 && audioTracks[0].readyState === 'live';

      // Calculate peak and RMS
      let peak = 0;
      let sum = 0;

      for (const sample of dataArray) {
        const abs = Math.abs(sample);
        if (abs > peak) peak = abs;
        sum += sample * sample;
      }

      const rms = Math.sqrt(sum / dataArray.length);

      // Convert to dB, then normalize to 0-100 scale
      // Reference: -60dB = 0, 0dB = 100
      const peakDb = peak > 0 ? 20 * Math.log10(peak) : -100;
      const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;

      const peakPercent = Math.max(0, Math.min(100, (peakDb + 60) * (100 / 60)));
      const rmsPercent = Math.max(0, Math.min(100, (rmsDb + 60) * (100 / 60)));

      meterArray.push({
        sourceId: source.id,
        peak: isActive ? peakPercent : 0,
        rms: isActive ? rmsPercent : 0,
        isActive,
      });

      // Update source readyState
      source.readyState = audioTracks[0]?.readyState as 'live' | 'ended' || 'ended';
    });

    // Emit to all listeners
    audioState.metering.updateCallbacks.forEach((cb) => {
      meterArray.forEach(cb);
    });

    audioState.metering.animationId = requestAnimationFrame(updateMeters);
  };

  audioState.metering.animationId = requestAnimationFrame(updateMeters);
  console.log('✅ Metering started');
}

/**
 * Stop metering
 */
function stopMetering(): void {
  if (audioState.metering.animationId) {
    cancelAnimationFrame(audioState.metering.animationId);
    audioState.metering.animationId = null;
    console.log('✅ Metering stopped');
  }
}

/**
 * Subscribe to meter updates
 */
export function subscribeMeterUpdates(
  callback: (data: MeterData) => void
): () => void {
  audioState.metering.updateCallbacks.add(callback);

  return () => {
    audioState.metering.updateCallbacks.delete(callback);
    if (audioState.metering.updateCallbacks.size === 0) {
      stopMetering();
    }
  };
}

/**
 * Cleanup: disconnect all sources and dispose audio context
 */
export function cleanup(): void {
  stopMetering();

  audioState.sources.forEach((_, id) => {
    removeAudioSource(id);
  });

  if (audioState.masterGainNode) {
    audioState.masterGainNode.disconnect();
    audioState.masterGainNode = null;
  }

  if (audioState.masterDestination) {
    audioState.masterDestination = null;
  }

  if (audioState.context) {
    // Don't close context immediately, may be reused
    audioState.context = null;
  }

  console.log('✅ Audio cleanup complete');
}

/**
 * Set master output volume (0-1 linear)
 */
export function setMasterVolume(gain: number): void {
  if (audioState.masterGainNode) {
    audioState.masterGainNode.gain.setTargetAtTime(
      Math.max(0, Math.min(1, gain)),
      audioState.context!.currentTime,
      0.01
    );
  }
}

/**
 * Get audio context (for advanced usage)
 */
export function getAudioContext(): AudioContext | null {
  return audioState.context;
}
