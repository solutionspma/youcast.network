// ============================================================================
// MIDI CONTROLLER
// Web MIDI API integration for USB pads, Stream Deck, AKAI, Novation, etc.
// ============================================================================

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
  connected: boolean;
}

export interface MidiMapping {
  note: number;
  channel: number;
  action: MidiAction;
  label: string;
}

export type MidiAction =
  | { type: 'soundboard'; padId: string }
  | { type: 'scene'; sceneId: string }
  | { type: 'overlay'; overlayId: string; toggle: boolean }
  | { type: 'lower-third'; presetId: string }
  | { type: 'mute'; channelId: string }
  | { type: 'go-live' }
  | { type: 'stop-stream' }
  | { type: 'custom'; callback: () => void };

type MidiMessageListener = (note: number, velocity: number, channel: number, type: 'noteon' | 'noteoff' | 'cc') => void;
type DeviceChangeListener = (devices: MidiDevice[]) => void;
type MappingTriggerListener = (mapping: MidiMapping, isNoteOn: boolean, velocity: number) => void;

export class MidiController {
  private midiAccess: MIDIAccess | null = null;
  private devices: Map<string, MidiDevice> = new Map();
  private mappings: Map<string, MidiMapping> = new Map(); // key: `${note}-${channel}`
  private activeInput: MIDIInput | null = null;
  private isSupported: boolean = false;
  private isInitialized: boolean = false;

  private messageListeners = new Set<MidiMessageListener>();
  private deviceListeners = new Set<DeviceChangeListener>();
  private mappingListeners = new Set<MappingTriggerListener>();

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  async init(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Web MIDI API not supported in this browser');
      return false;
    }

    if (this.isInitialized) return true;

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      
      // Set up device change monitoring
      this.midiAccess.onstatechange = this.handleStateChange.bind(this);
      
      // Enumerate existing devices
      this.updateDeviceList();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to access MIDI devices:', error);
      return false;
    }
  }

  private handleStateChange(event: MIDIConnectionEvent): void {
    this.updateDeviceList();
  }

  private updateDeviceList(): void {
    if (!this.midiAccess) return;

    this.devices.clear();

    // Add input devices
    this.midiAccess.inputs.forEach((input, id) => {
      this.devices.set(id, {
        id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        type: 'input',
        connected: input.state === 'connected',
      });
    });

    // Add output devices
    this.midiAccess.outputs.forEach((output, id) => {
      this.devices.set(id, {
        id,
        name: output.name || 'Unknown Device',
        manufacturer: output.manufacturer || 'Unknown',
        type: 'output',
        connected: output.state === 'connected',
      });
    });

    this.notifyDeviceListeners();
  }

  // =========================================================================
  // DEVICE SELECTION
  // =========================================================================

  selectInput(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    // Disconnect current input
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }

    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) return false;

    this.activeInput = input;
    this.activeInput.onmidimessage = this.handleMidiMessage.bind(this);
    return true;
  }

  getActiveInput(): MidiDevice | null {
    if (!this.activeInput) return null;
    return this.devices.get(this.activeInput.id) || null;
  }

  getInputDevices(): MidiDevice[] {
    return Array.from(this.devices.values()).filter(d => d.type === 'input');
  }

  getAllDevices(): MidiDevice[] {
    return Array.from(this.devices.values());
  }

  // =========================================================================
  // MESSAGE HANDLING
  // =========================================================================

  private handleMidiMessage(event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0];
    const noteOrCC = data[1];
    const velocity = data[2];
    const channel = (status & 0x0f) + 1; // MIDI channels are 1-16
    const messageType = status & 0xf0;

    let type: 'noteon' | 'noteoff' | 'cc';

    switch (messageType) {
      case 0x90: // Note On
        type = velocity > 0 ? 'noteon' : 'noteoff'; // velocity 0 = note off
        break;
      case 0x80: // Note Off
        type = 'noteoff';
        break;
      case 0xb0: // Control Change
        type = 'cc';
        break;
      default:
        return; // Ignore other message types
    }

    // Notify raw message listeners
    this.messageListeners.forEach(l => l(noteOrCC, velocity, channel, type));

    // Check for mappings
    if (type === 'noteon' || type === 'noteoff') {
      const mappingKey = `${noteOrCC}-${channel}`;
      const mapping = this.mappings.get(mappingKey);
      if (mapping) {
        this.mappingListeners.forEach(l => l(mapping, type === 'noteon', velocity));
      }
    }
  }

  // =========================================================================
  // MAPPINGS
  // =========================================================================

  addMapping(mapping: MidiMapping): void {
    const key = `${mapping.note}-${mapping.channel}`;
    this.mappings.set(key, mapping);
  }

  removeMapping(note: number, channel: number): void {
    const key = `${note}-${channel}`;
    this.mappings.delete(key);
  }

  clearMappings(): void {
    this.mappings.clear();
  }

  getMappings(): MidiMapping[] {
    return Array.from(this.mappings.values());
  }

  getMapping(note: number, channel: number): MidiMapping | undefined {
    const key = `${note}-${channel}`;
    return this.mappings.get(key);
  }

  // =========================================================================
  // LEARN MODE
  // =========================================================================

  async learnMapping(timeoutMs: number = 5000): Promise<{ note: number; channel: number } | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, timeoutMs);

      const listener: MidiMessageListener = (note, velocity, channel, type) => {
        if (type === 'noteon' && velocity > 0) {
          cleanup();
          resolve({ note, channel });
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.messageListeners.delete(listener);
      };

      this.messageListeners.add(listener);
    });
  }

  // =========================================================================
  // SUBSCRIPTIONS
  // =========================================================================

  onMidiMessage(fn: MidiMessageListener): () => void {
    this.messageListeners.add(fn);
    return () => this.messageListeners.delete(fn);
  }

  onDeviceChange(fn: DeviceChangeListener): () => void {
    this.deviceListeners.add(fn);
    // Immediate callback
    fn(this.getAllDevices());
    return () => this.deviceListeners.delete(fn);
  }

  onMappingTrigger(fn: MappingTriggerListener): () => void {
    this.mappingListeners.add(fn);
    return () => this.mappingListeners.delete(fn);
  }

  private notifyDeviceListeners(): void {
    const devices = this.getAllDevices();
    this.deviceListeners.forEach(l => l(devices));
  }

  // =========================================================================
  // PRESET MANAGEMENT
  // =========================================================================

  exportMappings(): string {
    const mappings = this.getMappings().map(m => ({
      note: m.note,
      channel: m.channel,
      action: m.action,
      label: m.label,
    }));
    return JSON.stringify(mappings, null, 2);
  }

  importMappings(json: string): void {
    try {
      const mappings = JSON.parse(json) as MidiMapping[];
      this.clearMappings();
      mappings.forEach(m => this.addMapping(m));
    } catch (error) {
      console.error('Failed to import MIDI mappings:', error);
      throw error;
    }
  }

  // =========================================================================
  // UTILITIES
  // =========================================================================

  static noteToName(note: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(note / 12) - 1;
    const noteName = notes[note % 12];
    return `${noteName}${octave}`;
  }

  static nameToNote(name: string): number {
    const notes: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    const match = name.match(/^([A-G][#b]?)(-?\d+)$/i);
    if (!match) return -1;
    
    const noteName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const octave = parseInt(match[2], 10);
    
    if (!(noteName in notes)) return -1;
    return (octave + 1) * 12 + notes[noteName];
  }

  // =========================================================================
  // STATUS
  // =========================================================================

  getSupported(): boolean {
    return this.isSupported;
  }

  getInitialized(): boolean {
    return this.isInitialized;
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  dispose(): void {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }
    this.devices.clear();
    this.mappings.clear();
    this.messageListeners.clear();
    this.deviceListeners.clear();
    this.mappingListeners.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
let midiInstance: MidiController | null = null;

export function getMidiController(): MidiController {
  if (!midiInstance) {
    midiInstance = new MidiController();
  }
  return midiInstance;
}
