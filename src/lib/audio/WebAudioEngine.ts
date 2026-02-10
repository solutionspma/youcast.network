// ============================================================================
// WEB AUDIO ENGINE
// Professional audio processing: EQ, Compression, Noise Gate, Metering
// ============================================================================

export interface AudioChannelConfig {
  id: string;
  name: string;
  type: 'microphone' | 'desktop' | 'media' | 'music' | 'soundboard';
}

export interface EQBand {
  frequency: number;
  gain: number;  // -12 to +12 dB
  q: number;     // 0.1 to 10
  type: BiquadFilterType;
}

export interface CompressorSettings {
  threshold: number;  // -100 to 0 dB
  ratio: number;      // 1 to 20
  attack: number;     // 0 to 1 second
  release: number;    // 0 to 1 second
  knee: number;       // 0 to 40 dB
  makeupGain: number; // 0 to 24 dB
}

export interface NoiseGateSettings {
  threshold: number;  // -100 to 0 dB (signal below this gets cut)
  attack: number;     // 0 to 50 ms
  release: number;    // 0 to 500 ms
  enabled: boolean;
}

export interface ChannelState {
  id: string;
  name: string;
  type: AudioChannelConfig['type'];
  volume: number;          // 0-100
  muted: boolean;
  solo: boolean;
  pan: number;             // -100 to 100 (L to R)
  eq: EQBand[];
  compressor: CompressorSettings;
  noiseGate: NoiseGateSettings;
  peakLevel: number;       // 0-100 for UI
  rmsLevel: number;        // 0-100 for UI
  gainReduction: number;   // dB of compression applied
}

type ChannelListener = (channels: Map<string, ChannelState>) => void;
type MeterListener = (meters: Map<string, { peak: number; rms: number; gainReduction: number }>) => void;

// Default 3-band EQ
const defaultEQ: EQBand[] = [
  { frequency: 100, gain: 0, q: 0.7, type: 'lowshelf' },   // Low
  { frequency: 1000, gain: 0, q: 1.0, type: 'peaking' },   // Mid
  { frequency: 8000, gain: 0, q: 0.7, type: 'highshelf' }, // High
];

const defaultCompressor: CompressorSettings = {
  threshold: -24,
  ratio: 4,
  attack: 0.003,
  release: 0.25,
  knee: 5,
  makeupGain: 0,
};

const defaultNoiseGate: NoiseGateSettings = {
  threshold: -50,
  attack: 0.01,
  release: 0.1,
  enabled: false,
};

interface ChannelNodes {
  source: MediaStreamAudioSourceNode | AudioBufferSourceNode | null;
  inputGain: GainNode;           // Pre-processing gain
  eqFilters: BiquadFilterNode[];
  compressor: DynamicsCompressorNode;
  makeupGain: GainNode;          // Post-compression gain
  noiseGate: GainNode;           // Simulated gate
  pan: StereoPannerNode;
  outputGain: GainNode;          // Final volume
  analyser: AnalyserNode;
  stream?: MediaStream;
}

export class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private channels: Map<string, ChannelNodes> = new Map();
  private channelStates: Map<string, ChannelState> = new Map();
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  
  private channelListeners = new Set<ChannelListener>();
  private meterListeners = new Set<MeterListener>();
  private meterInterval: number | null = null;
  private gateStates: Map<string, { isOpen: boolean; lastLevel: number }> = new Map();

  async init(): Promise<MediaStream> {
    if (this.ctx) return this.destination!.stream;
    
    this.ctx = new AudioContext({ sampleRate: 48000 });
    
    // Create master chain
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -18;
    this.masterCompressor.ratio.value = 3;
    this.masterCompressor.attack.value = 0.003;
    this.masterCompressor.release.value = 0.25;
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.8;
    
    this.destination = this.ctx.createMediaStreamDestination();
    
    // Connect master chain
    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.destination);
    
    // Start metering
    this.startMetering();
    
    return this.destination.stream;
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  getOutputStream(): MediaStream | null {
    return this.destination?.stream || null;
  }

  // =========================================================================
  // CHANNEL MANAGEMENT
  // =========================================================================

  async addChannel(config: AudioChannelConfig, stream?: MediaStream): Promise<void> {
    if (!this.ctx) throw new Error('Audio engine not initialized');

    const nodes = this.createChannelNodes();
    
    // Connect source if provided
    if (stream) {
      nodes.source = this.ctx.createMediaStreamSource(stream);
      nodes.stream = stream;
      nodes.source.connect(nodes.inputGain);
    }

    // Connect channel chain
    nodes.inputGain
      .connect(nodes.eqFilters[0]);
    
    // Chain EQ filters
    for (let i = 0; i < nodes.eqFilters.length - 1; i++) {
      nodes.eqFilters[i].connect(nodes.eqFilters[i + 1]);
    }
    
    nodes.eqFilters[nodes.eqFilters.length - 1]
      .connect(nodes.compressor)
      .connect(nodes.makeupGain)
      .connect(nodes.noiseGate)
      .connect(nodes.pan)
      .connect(nodes.outputGain)
      .connect(nodes.analyser)
      .connect(this.masterCompressor!);

    this.channels.set(config.id, nodes);
    
    // Initialize state
    this.channelStates.set(config.id, {
      id: config.id,
      name: config.name,
      type: config.type,
      volume: 80,
      muted: false,
      solo: false,
      pan: 0,
      eq: [...defaultEQ],
      compressor: { ...defaultCompressor },
      noiseGate: { ...defaultNoiseGate },
      peakLevel: 0,
      rmsLevel: 0,
      gainReduction: 0,
    });

    this.gateStates.set(config.id, { isOpen: true, lastLevel: 0 });
    this.emitChannels();
  }

  removeChannel(id: string): void {
    const nodes = this.channels.get(id);
    if (nodes) {
      if (nodes.source) nodes.source.disconnect();
      nodes.inputGain.disconnect();
      nodes.eqFilters.forEach(f => f.disconnect());
      nodes.compressor.disconnect();
      nodes.makeupGain.disconnect();
      nodes.noiseGate.disconnect();
      nodes.pan.disconnect();
      nodes.outputGain.disconnect();
      nodes.analyser.disconnect();
      this.channels.delete(id);
      this.channelStates.delete(id);
      this.gateStates.delete(id);
      this.emitChannels();
    }
  }

  private createChannelNodes(): ChannelNodes {
    const ctx = this.ctx!;
    
    // Create EQ chain
    const eqFilters = defaultEQ.map(band => {
      const filter = ctx.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      filter.Q.value = band.q;
      return filter;
    });

    // Create compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = defaultCompressor.threshold;
    compressor.ratio.value = defaultCompressor.ratio;
    compressor.attack.value = defaultCompressor.attack;
    compressor.release.value = defaultCompressor.release;
    compressor.knee.value = defaultCompressor.knee;

    // Create analyser for metering
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;

    return {
      source: null,
      inputGain: ctx.createGain(),
      eqFilters,
      compressor,
      makeupGain: ctx.createGain(),
      noiseGate: ctx.createGain(),
      pan: ctx.createStereoPanner(),
      outputGain: ctx.createGain(),
      analyser,
    };
  }

  // =========================================================================
  // CHANNEL CONTROLS
  // =========================================================================

  setVolume(id: string, volume: number): void {
    const nodes = this.channels.get(id);
    const state = this.channelStates.get(id);
    if (nodes && state) {
      state.volume = Math.max(0, Math.min(100, volume));
      // Convert to gain (0-100 -> 0-1, with curve)
      const gain = state.muted ? 0 : Math.pow(state.volume / 100, 2);
      nodes.outputGain.gain.setTargetAtTime(gain, this.ctx!.currentTime, 0.01);
      this.emitChannels();
    }
  }

  setMuted(id: string, muted: boolean): void {
    const nodes = this.channels.get(id);
    const state = this.channelStates.get(id);
    if (nodes && state) {
      state.muted = muted;
      const gain = muted ? 0 : Math.pow(state.volume / 100, 2);
      nodes.outputGain.gain.setTargetAtTime(gain, this.ctx!.currentTime, 0.01);
      this.emitChannels();
    }
  }

  setSolo(id: string, solo: boolean): void {
    const state = this.channelStates.get(id);
    if (state) {
      state.solo = solo;
      this.updateSoloStates();
      this.emitChannels();
    }
  }

  private updateSoloStates(): void {
    const hasSolo = Array.from(this.channelStates.values()).some(s => s.solo);
    
    this.channelStates.forEach((state, id) => {
      const nodes = this.channels.get(id);
      if (nodes) {
        const shouldMute = hasSolo && !state.solo;
        const gain = (state.muted || shouldMute) ? 0 : Math.pow(state.volume / 100, 2);
        nodes.outputGain.gain.setTargetAtTime(gain, this.ctx!.currentTime, 0.01);
      }
    });
  }

  setPan(id: string, pan: number): void {
    const nodes = this.channels.get(id);
    const state = this.channelStates.get(id);
    if (nodes && state) {
      state.pan = Math.max(-100, Math.min(100, pan));
      nodes.pan.pan.setTargetAtTime(state.pan / 100, this.ctx!.currentTime, 0.01);
      this.emitChannels();
    }
  }

  // =========================================================================
  // EQ CONTROLS
  // =========================================================================

  setEQBand(id: string, bandIndex: number, settings: Partial<EQBand>): void {
    const nodes = this.channels.get(id);
    const state = this.channelStates.get(id);
    if (nodes && state && nodes.eqFilters[bandIndex]) {
      const band = state.eq[bandIndex];
      const filter = nodes.eqFilters[bandIndex];
      
      if (settings.gain !== undefined) {
        band.gain = Math.max(-12, Math.min(12, settings.gain));
        filter.gain.setTargetAtTime(band.gain, this.ctx!.currentTime, 0.01);
      }
      if (settings.frequency !== undefined) {
        band.frequency = settings.frequency;
        filter.frequency.setTargetAtTime(band.frequency, this.ctx!.currentTime, 0.01);
      }
      if (settings.q !== undefined) {
        band.q = Math.max(0.1, Math.min(10, settings.q));
        filter.Q.setTargetAtTime(band.q, this.ctx!.currentTime, 0.01);
      }
      
      this.emitChannels();
    }
  }

  resetEQ(id: string): void {
    const nodes = this.channels.get(id);
    const state = this.channelStates.get(id);
    if (nodes && state) {
      defaultEQ.forEach((band, i) => {
        state.eq[i] = { ...band };
        const filter = nodes.eqFilters[i];
        filter.gain.setTargetAtTime(band.gain, this.ctx!.currentTime, 0.01);
        filter.frequency.setTargetAtTime(band.frequency, this.ctx!.currentTime, 0.01);
        filter.Q.setTargetAtTime(band.q, this.ctx!.currentTime, 0.01);
      });
      this.emitChannels();
    }
  }

  // =========================================================================
  // COMPRESSOR CONTROLS
  // =========================================================================

  setCompressor(id: string, settings: Partial<CompressorSettings>): void {
    const nodes = this.channels.get(id);
    const state = this.channelStates.get(id);
    if (nodes && state) {
      const comp = state.compressor;
      const node = nodes.compressor;
      
      if (settings.threshold !== undefined) {
        comp.threshold = Math.max(-100, Math.min(0, settings.threshold));
        node.threshold.setTargetAtTime(comp.threshold, this.ctx!.currentTime, 0.01);
      }
      if (settings.ratio !== undefined) {
        comp.ratio = Math.max(1, Math.min(20, settings.ratio));
        node.ratio.setTargetAtTime(comp.ratio, this.ctx!.currentTime, 0.01);
      }
      if (settings.attack !== undefined) {
        comp.attack = Math.max(0, Math.min(1, settings.attack));
        node.attack.setTargetAtTime(comp.attack, this.ctx!.currentTime, 0.01);
      }
      if (settings.release !== undefined) {
        comp.release = Math.max(0, Math.min(1, settings.release));
        node.release.setTargetAtTime(comp.release, this.ctx!.currentTime, 0.01);
      }
      if (settings.knee !== undefined) {
        comp.knee = Math.max(0, Math.min(40, settings.knee));
        node.knee.setTargetAtTime(comp.knee, this.ctx!.currentTime, 0.01);
      }
      if (settings.makeupGain !== undefined) {
        comp.makeupGain = Math.max(0, Math.min(24, settings.makeupGain));
        // Convert dB to linear gain
        const linearGain = Math.pow(10, comp.makeupGain / 20);
        nodes.makeupGain.gain.setTargetAtTime(linearGain, this.ctx!.currentTime, 0.01);
      }
      
      this.emitChannels();
    }
  }

  resetCompressor(id: string): void {
    const nodes = this.channels.get(id);
    const state = this.channelStates.get(id);
    if (nodes && state) {
      state.compressor = { ...defaultCompressor };
      const node = nodes.compressor;
      node.threshold.setTargetAtTime(defaultCompressor.threshold, this.ctx!.currentTime, 0.01);
      node.ratio.setTargetAtTime(defaultCompressor.ratio, this.ctx!.currentTime, 0.01);
      node.attack.setTargetAtTime(defaultCompressor.attack, this.ctx!.currentTime, 0.01);
      node.release.setTargetAtTime(defaultCompressor.release, this.ctx!.currentTime, 0.01);
      node.knee.setTargetAtTime(defaultCompressor.knee, this.ctx!.currentTime, 0.01);
      nodes.makeupGain.gain.setTargetAtTime(1, this.ctx!.currentTime, 0.01);
      this.emitChannels();
    }
  }

  // =========================================================================
  // NOISE GATE (SIMULATED VIA GAIN NODE)
  // =========================================================================

  setNoiseGate(id: string, settings: Partial<NoiseGateSettings>): void {
    const state = this.channelStates.get(id);
    if (state) {
      if (settings.threshold !== undefined) {
        state.noiseGate.threshold = Math.max(-100, Math.min(0, settings.threshold));
      }
      if (settings.attack !== undefined) {
        state.noiseGate.attack = Math.max(0, Math.min(0.05, settings.attack));
      }
      if (settings.release !== undefined) {
        state.noiseGate.release = Math.max(0, Math.min(0.5, settings.release));
      }
      if (settings.enabled !== undefined) {
        state.noiseGate.enabled = settings.enabled;
      }
      this.emitChannels();
    }
  }

  // =========================================================================
  // MASTER CONTROLS
  // =========================================================================

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      const gain = Math.pow(Math.max(0, Math.min(100, volume)) / 100, 2);
      this.masterGain.gain.setTargetAtTime(gain, this.ctx!.currentTime, 0.01);
    }
  }

  // =========================================================================
  // METERING
  // =========================================================================

  private startMetering(): void {
    const updateMeters = () => {
      const meters = new Map<string, { peak: number; rms: number; gainReduction: number }>();
      
      this.channels.forEach((nodes, id) => {
        const state = this.channelStates.get(id);
        if (!state) return;

        const analyser = nodes.analyser;
        const dataArray = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatTimeDomainData(dataArray);

        // Calculate peak and RMS
        let peak = 0;
        let sum = 0;
        for (const sample of dataArray) {
          const abs = Math.abs(sample);
          if (abs > peak) peak = abs;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Convert to dB, then to 0-100 scale
        const peakDb = peak > 0 ? 20 * Math.log10(peak) : -100;
        const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;
        
        // Map -60dB to 0dB -> 0 to 100
        const peakLevel = Math.max(0, Math.min(100, (peakDb + 60) * (100 / 60)));
        const rmsLevel = Math.max(0, Math.min(100, (rmsDb + 60) * (100 / 60)));

        // Get compression gain reduction
        const gainReduction = nodes.compressor.reduction;

        // Update state
        state.peakLevel = peakLevel;
        state.rmsLevel = rmsLevel;
        state.gainReduction = gainReduction;

        // Process noise gate
        this.processNoiseGate(id, nodes, state, rmsDb);

        meters.set(id, { peak: peakLevel, rms: rmsLevel, gainReduction });
      });

      // Emit meter updates
      this.meterListeners.forEach(l => l(meters));
    };

    // Update meters at 30fps
    this.meterInterval = window.setInterval(updateMeters, 33);
  }

  private processNoiseGate(id: string, nodes: ChannelNodes, state: ChannelState, levelDb: number): void {
    if (!state.noiseGate.enabled) {
      nodes.noiseGate.gain.value = 1;
      return;
    }

    const gateState = this.gateStates.get(id)!;
    const threshold = state.noiseGate.threshold;
    const attack = state.noiseGate.attack;
    const release = state.noiseGate.release;

    if (levelDb > threshold) {
      // Open gate
      if (!gateState.isOpen) {
        gateState.isOpen = true;
        nodes.noiseGate.gain.setTargetAtTime(1, this.ctx!.currentTime, attack);
      }
    } else {
      // Close gate
      if (gateState.isOpen) {
        gateState.isOpen = false;
        nodes.noiseGate.gain.setTargetAtTime(0, this.ctx!.currentTime, release);
      }
    }
  }

  private stopMetering(): void {
    if (this.meterInterval) {
      clearInterval(this.meterInterval);
      this.meterInterval = null;
    }
  }

  // =========================================================================
  // SUBSCRIPTIONS
  // =========================================================================

  subscribeChannels(fn: ChannelListener): () => void {
    this.channelListeners.add(fn);
    // Immediate callback with current state
    fn(this.channelStates);
    return () => this.channelListeners.delete(fn);
  }

  subscribeMeters(fn: MeterListener): () => void {
    this.meterListeners.add(fn);
    return () => this.meterListeners.delete(fn);
  }

  private emitChannels(): void {
    this.channelListeners.forEach(l => l(this.channelStates));
  }

  getChannelState(id: string): ChannelState | undefined {
    return this.channelStates.get(id);
  }

  getAllChannels(): Map<string, ChannelState> {
    return this.channelStates;
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  dispose(): void {
    this.stopMetering();
    this.channels.forEach((_, id) => this.removeChannel(id));
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.masterAnalyser = null;
    this.masterCompressor = null;
    this.destination = null;
    this.channelListeners.clear();
    this.meterListeners.clear();
  }
}

// Singleton instance
let engineInstance: WebAudioEngine | null = null;

export function getAudioEngine(): WebAudioEngine {
  if (!engineInstance) {
    engineInstance = new WebAudioEngine();
  }
  return engineInstance;
}
