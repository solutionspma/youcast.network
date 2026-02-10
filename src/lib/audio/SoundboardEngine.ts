// ============================================================================
// SOUNDBOARD ENGINE
// Audio buffer player with pad triggers, ducking, and MIDI support
// ============================================================================

import { getAudioEngine } from './WebAudioEngine';

export interface SoundPad {
  id: string;
  name: string;
  color: string;
  audioBuffer: AudioBuffer | null;
  audioUrl: string;
  volume: number;        // 0-100
  playMode: 'oneshot' | 'toggle' | 'hold';
  duckMic: boolean;      // Duck microphone when playing
  duckAmount: number;    // 0-100 (how much to duck)
  keyBinding?: string;   // e.g., "1", "Q", "F1"
  midiNote?: number;     // MIDI note number
  isPlaying: boolean;
  isLoading: boolean;
}

export interface SoundboardState {
  pads: SoundPad[];
  masterVolume: number;
  duckEnabled: boolean;
  duckChannels: string[]; // Channel IDs to duck
}

type SoundboardListener = (state: SoundboardState) => void;
type PlayingListener = (padId: string, isPlaying: boolean) => void;

// Default pad colors (8 pads)
const PAD_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

const DEFAULT_PAD_COUNT = 8;

export class SoundboardEngine {
  private ctx: AudioContext | null = null;
  private state: SoundboardState;
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private padGains: Map<string, GainNode> = new Map();
  private masterGain: GainNode | null = null;
  private outputNode: AudioNode | null = null;
  
  private listeners = new Set<SoundboardListener>();
  private playingListeners = new Set<PlayingListener>();

  constructor() {
    // Initialize with empty pads
    this.state = {
      pads: Array.from({ length: DEFAULT_PAD_COUNT }, (_, i) => ({
        id: `pad-${i + 1}`,
        name: `Pad ${i + 1}`,
        color: PAD_COLORS[i % PAD_COLORS.length],
        audioBuffer: null,
        audioUrl: '',
        volume: 80,
        playMode: 'oneshot' as const,
        duckMic: false,
        duckAmount: 70,
        keyBinding: String(i + 1),
        midiNote: 36 + i, // Start at C2
        isPlaying: false,
        isLoading: false,
      })),
      masterVolume: 80,
      duckEnabled: true,
      duckChannels: [],
    };
  }

  async init(audioContext: AudioContext, outputNode: AudioNode): Promise<void> {
    this.ctx = audioContext;
    this.outputNode = outputNode;
    
    // Create master gain for soundboard
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.state.masterVolume / 100;
    this.masterGain.connect(outputNode);

    // Create gain nodes for each pad
    this.state.pads.forEach(pad => {
      const gain = this.ctx!.createGain();
      gain.gain.value = pad.volume / 100;
      gain.connect(this.masterGain!);
      this.padGains.set(pad.id, gain);
    });
  }

  // =========================================================================
  // SOUND LOADING
  // =========================================================================

  async loadSound(padId: string, url: string): Promise<void> {
    const pad = this.state.pads.find(p => p.id === padId);
    if (!pad || !this.ctx) return;

    pad.isLoading = true;
    this.emit();

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      
      pad.audioBuffer = audioBuffer;
      pad.audioUrl = url;
      pad.isLoading = false;
      this.emit();
    } catch (error) {
      console.error('Failed to load sound:', error);
      pad.isLoading = false;
      this.emit();
      throw error;
    }
  }

  async loadSoundFromFile(padId: string, file: File): Promise<void> {
    const pad = this.state.pads.find(p => p.id === padId);
    if (!pad || !this.ctx) return;

    pad.isLoading = true;
    pad.name = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
    this.emit();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      
      pad.audioBuffer = audioBuffer;
      pad.audioUrl = URL.createObjectURL(file);
      pad.isLoading = false;
      this.emit();
    } catch (error) {
      console.error('Failed to load sound file:', error);
      pad.isLoading = false;
      this.emit();
      throw error;
    }
  }

  clearSound(padId: string): void {
    const pad = this.state.pads.find(p => p.id === padId);
    if (!pad) return;

    // Stop if playing
    this.stopPad(padId);
    
    pad.audioBuffer = null;
    if (pad.audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pad.audioUrl);
    }
    pad.audioUrl = '';
    pad.name = `Pad ${this.state.pads.indexOf(pad) + 1}`;
    this.emit();
  }

  // =========================================================================
  // PLAYBACK
  // =========================================================================

  playPad(padId: string): void {
    const pad = this.state.pads.find(p => p.id === padId);
    if (!pad || !pad.audioBuffer || !this.ctx) return;

    // Handle different play modes
    if (pad.playMode === 'toggle' && pad.isPlaying) {
      this.stopPad(padId);
      return;
    }

    // Stop existing playback for this pad (oneshot behavior)
    this.stopPad(padId);

    // Create source
    const source = this.ctx.createBufferSource();
    source.buffer = pad.audioBuffer;
    
    // Connect through pad gain
    const gain = this.padGains.get(padId);
    if (gain) {
      source.connect(gain);
    } else {
      source.connect(this.masterGain!);
    }

    // Handle playback end
    source.onended = () => {
      this.activeSources.delete(padId);
      pad.isPlaying = false;
      this.playingListeners.forEach(l => l(padId, false));
      this.unduck();
      this.emit();
    };

    // Start playback
    source.start(0);
    this.activeSources.set(padId, source);
    pad.isPlaying = true;
    
    // Apply ducking if enabled
    if (pad.duckMic && this.state.duckEnabled) {
      this.applyDuck(pad.duckAmount);
    }

    this.playingListeners.forEach(l => l(padId, true));
    this.emit();
  }

  stopPad(padId: string): void {
    const source = this.activeSources.get(padId);
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
      this.activeSources.delete(padId);
    }

    const pad = this.state.pads.find(p => p.id === padId);
    if (pad && pad.isPlaying) {
      pad.isPlaying = false;
      this.playingListeners.forEach(l => l(padId, false));
      this.unduck();
      this.emit();
    }
  }

  stopAll(): void {
    this.activeSources.forEach((source, id) => {
      try {
        source.stop();
      } catch (e) {}
    });
    this.activeSources.clear();
    this.state.pads.forEach(pad => {
      if (pad.isPlaying) {
        pad.isPlaying = false;
        this.playingListeners.forEach(l => l(pad.id, false));
      }
    });
    this.unduck();
    this.emit();
  }

  // =========================================================================
  // DUCKING
  // =========================================================================

  private applyDuck(amount: number): void {
    const engine = getAudioEngine();
    const duckGain = 1 - (amount / 100);
    
    this.state.duckChannels.forEach(channelId => {
      const channel = engine.getChannelState(channelId);
      if (channel && channel.type === 'microphone') {
        // Store original volume and apply duck
        // This is a simplified implementation - in production you'd
        // want smoother transitions via the engine
        engine.setVolume(channelId, channel.volume * duckGain);
      }
    });
  }

  private unduck(): void {
    // Check if any pads are still playing with duck enabled
    const stillDucking = this.state.pads.some(p => p.isPlaying && p.duckMic);
    if (stillDucking) return;

    // Restore volumes (simplified - production would track original values)
    // The audio engine handles this more gracefully through gain nodes
  }

  // =========================================================================
  // SETTINGS
  // =========================================================================

  setPadVolume(padId: string, volume: number): void {
    const pad = this.state.pads.find(p => p.id === padId);
    const gain = this.padGains.get(padId);
    if (pad && gain) {
      pad.volume = Math.max(0, Math.min(100, volume));
      gain.gain.setTargetAtTime(pad.volume / 100, this.ctx!.currentTime, 0.01);
      this.emit();
    }
  }

  setPadPlayMode(padId: string, mode: SoundPad['playMode']): void {
    const pad = this.state.pads.find(p => p.id === padId);
    if (pad) {
      pad.playMode = mode;
      this.emit();
    }
  }

  setPadDuck(padId: string, duckMic: boolean, duckAmount?: number): void {
    const pad = this.state.pads.find(p => p.id === padId);
    if (pad) {
      pad.duckMic = duckMic;
      if (duckAmount !== undefined) {
        pad.duckAmount = Math.max(0, Math.min(100, duckAmount));
      }
      this.emit();
    }
  }

  setPadName(padId: string, name: string): void {
    const pad = this.state.pads.find(p => p.id === padId);
    if (pad) {
      pad.name = name;
      this.emit();
    }
  }

  setPadColor(padId: string, color: string): void {
    const pad = this.state.pads.find(p => p.id === padId);
    if (pad) {
      pad.color = color;
      this.emit();
    }
  }

  setPadKeyBinding(padId: string, key: string | undefined): void {
    const pad = this.state.pads.find(p => p.id === padId);
    if (pad) {
      pad.keyBinding = key;
      this.emit();
    }
  }

  setPadMidiNote(padId: string, note: number | undefined): void {
    const pad = this.state.pads.find(p => p.id === padId);
    if (pad) {
      pad.midiNote = note;
      this.emit();
    }
  }

  setMasterVolume(volume: number): void {
    this.state.masterVolume = Math.max(0, Math.min(100, volume));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.state.masterVolume / 100, this.ctx!.currentTime, 0.01);
    }
    this.emit();
  }

  setDuckChannels(channelIds: string[]): void {
    this.state.duckChannels = channelIds;
    this.emit();
  }

  setDuckEnabled(enabled: boolean): void {
    this.state.duckEnabled = enabled;
    this.emit();
  }

  // =========================================================================
  // KEYBOARD TRIGGER
  // =========================================================================

  handleKeyDown(key: string): void {
    const pad = this.state.pads.find(p => 
      p.keyBinding?.toLowerCase() === key.toLowerCase()
    );
    if (pad && pad.audioBuffer) {
      if (pad.playMode === 'hold') {
        this.playPad(pad.id);
      } else {
        this.playPad(pad.id);
      }
    }
  }

  handleKeyUp(key: string): void {
    const pad = this.state.pads.find(p => 
      p.keyBinding?.toLowerCase() === key.toLowerCase()
    );
    if (pad && pad.playMode === 'hold') {
      this.stopPad(pad.id);
    }
  }

  // =========================================================================
  // MIDI TRIGGER
  // =========================================================================

  handleMidiNoteOn(note: number, velocity: number): void {
    const pad = this.state.pads.find(p => p.midiNote === note);
    if (pad && pad.audioBuffer) {
      // Optionally adjust volume by velocity
      // const velVolume = (velocity / 127) * pad.volume;
      this.playPad(pad.id);
    }
  }

  handleMidiNoteOff(note: number): void {
    const pad = this.state.pads.find(p => p.midiNote === note);
    if (pad && pad.playMode === 'hold') {
      this.stopPad(pad.id);
    }
  }

  // =========================================================================
  // PRESETS
  // =========================================================================

  exportPreset(): string {
    const preset = {
      pads: this.state.pads.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        audioUrl: p.audioUrl,
        volume: p.volume,
        playMode: p.playMode,
        duckMic: p.duckMic,
        duckAmount: p.duckAmount,
        keyBinding: p.keyBinding,
        midiNote: p.midiNote,
      })),
      masterVolume: this.state.masterVolume,
      duckEnabled: this.state.duckEnabled,
    };
    return JSON.stringify(preset, null, 2);
  }

  async importPreset(json: string): Promise<void> {
    try {
      const preset = JSON.parse(json);
      
      // Load sounds
      for (const padPreset of preset.pads) {
        const pad = this.state.pads.find(p => p.id === padPreset.id);
        if (pad) {
          pad.name = padPreset.name;
          pad.color = padPreset.color;
          pad.volume = padPreset.volume;
          pad.playMode = padPreset.playMode;
          pad.duckMic = padPreset.duckMic;
          pad.duckAmount = padPreset.duckAmount;
          pad.keyBinding = padPreset.keyBinding;
          pad.midiNote = padPreset.midiNote;
          
          // Load audio if URL exists
          if (padPreset.audioUrl && !padPreset.audioUrl.startsWith('blob:')) {
            await this.loadSound(pad.id, padPreset.audioUrl);
          }
        }
      }
      
      this.state.masterVolume = preset.masterVolume ?? 80;
      this.state.duckEnabled = preset.duckEnabled ?? true;
      
      if (this.masterGain) {
        this.masterGain.gain.value = this.state.masterVolume / 100;
      }
      
      this.emit();
    } catch (error) {
      console.error('Failed to import preset:', error);
      throw error;
    }
  }

  // =========================================================================
  // STATE & SUBSCRIPTIONS
  // =========================================================================

  subscribe(fn: SoundboardListener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  subscribePlayingChanges(fn: PlayingListener): () => void {
    this.playingListeners.add(fn);
    return () => this.playingListeners.delete(fn);
  }

  private emit(): void {
    this.listeners.forEach(l => l(this.state));
  }

  getState(): SoundboardState {
    return this.state;
  }

  getPad(padId: string): SoundPad | undefined {
    return this.state.pads.find(p => p.id === padId);
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  dispose(): void {
    this.stopAll();
    this.padGains.forEach(gain => gain.disconnect());
    this.padGains.clear();
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    this.state.pads.forEach(pad => {
      if (pad.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pad.audioUrl);
      }
    });
    this.listeners.clear();
    this.playingListeners.clear();
  }
}

// Singleton instance
let soundboardInstance: SoundboardEngine | null = null;

export function getSoundboard(): SoundboardEngine {
  if (!soundboardInstance) {
    soundboardInstance = new SoundboardEngine();
  }
  return soundboardInstance;
}
