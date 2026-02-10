// ============================================================================
// COMPOSITION SYSTEM TYPES
// The "Scenes" replacement - one-click broadcast state recall
// ============================================================================

// ─── Overlay Types ───────────────────────────────────────────────────────────

export type OverlayType = 
  | 'lower-third' 
  | 'logo' 
  | 'image' 
  | 'text' 
  | 'ticker' 
  | 'alert' 
  | 'countdown'
  | 'clock'
  | 'webcam-frame'
  | 'chroma';

export type AnchorPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type AnimationType =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'bounce';

export interface OverlayTextElement {
  content: string;
  font: string;
  size: number;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  color: string;
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  lineHeight?: number;
  letterSpacing?: number;
}

export interface OverlayPosition {
  x: number;
  y: number;
  anchor: AnchorPosition;
}

export interface OverlaySize {
  width: number;
  height: number;
}

export interface OverlayStyle {
  background?: string;
  opacity: number;
  borderRadius?: number;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  boxShadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
  };
}

export interface OverlayAnimation {
  in: AnimationType;
  out: AnimationType;
  durationMs: number;
  easing?: string;
}

/**
 * The canonical Overlay definition format.
 * Portable, versioned, marketplace-ready.
 */
export interface Overlay {
  version: '1.0';
  type: OverlayType;
  id: string;
  name: string;
  layer: number;              // z-index (higher = on top)
  visible: boolean;
  locked?: boolean;           // Prevent accidental edits
  
  position: OverlayPosition;
  size: OverlaySize;
  style: OverlayStyle;
  
  // Type-specific content
  text?: OverlayTextElement[];
  imageUrl?: string;
  videoUrl?: string;
  
  // Animation settings
  animation: OverlayAnimation;
  
  // Auto-hide after duration (0 = stay forever)
  autoDismissMs?: number;
  
  // Custom data for special overlay types
  metadata?: Record<string, unknown>;
}

// Preset overlays for quick access
export interface OverlayTemplate extends Omit<Overlay, 'id'> {
  templateId: string;
  templateName: string;
  category: string;
  author?: string;
  previewUrl?: string;
}

// ─── Audio State Types ───────────────────────────────────────────────────────

export interface AudioChannelState {
  channelId: string;
  gain: number;           // 0-1 (linear)
  mute: boolean;
  solo?: boolean;
}

// ─── Video Source Types ─────────────────────────────────────────────────────

export interface VideoSourceState {
  sourceId: string;       // 'camera', 'screen', 'media', etc.
  visible: boolean;
  opacity?: number;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

// ─── Transition Types ────────────────────────────────────────────────────────

export type TransitionType = 
  | 'cut'           // Instant switch
  | 'fade'          // Cross-fade
  | 'slide-left'    // Slide in from right
  | 'slide-right'   // Slide in from left
  | 'slide-up'      // Slide in from bottom
  | 'slide-down'    // Slide in from top
  | 'zoom'          // Zoom transition
  | 'wipe'          // Wipe transition
  | 'stinger';      // Video overlay transition

// ─── Composition Types ──────────────────────────────────────────────────────

/**
 * A Composition is a complete broadcast state:
 * - Which overlays are visible
 * - Audio levels and mutes
 * - Video source visibility
 * - All recalled in one click
 */
export interface Composition {
  id: string;
  name: string;
  description?: string;
  color?: string;           // For UI identification
  icon?: string;            // Icon name or emoji
  
  // What overlays should be visible
  overlays: string[];       // Overlay IDs
  
  // Audio channel states
  audio: Record<string, AudioChannelState>;
  
  // Video source states
  video: Record<string, VideoSourceState>;
  
  // Transition settings
  transition: TransitionType;
  transitionDurationMs: number;
  
  // Trigger bindings
  hotkey?: string;          // e.g., 'F1', 'Ctrl+1'
  midiNote?: number;        // MIDI note number
  midiChannel?: number;     // MIDI channel (1-16)
  
  // Timing
  autoAdvanceMs?: number;   // Auto-switch to next composition after ms
  nextCompositionId?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ─── Soundboard / SFX Types ─────────────────────────────────────────────────

export interface SoundEffect {
  id: string;
  name: string;
  type: 'sound';
  
  // Audio file
  fileUrl: string;
  audioBuffer?: AudioBuffer;  // Cached in memory
  
  // Playback settings
  volume: number;             // 0-100
  playMode: 'oneshot' | 'toggle' | 'hold' | 'loop';
  fadeInMs?: number;
  fadeOutMs?: number;
  
  // Ducking (auto-lower other channels)
  duck?: {
    target: string;           // Channel ID to duck (or 'all')
    amount: number;           // dB reduction (negative value)
    fadeMs: number;           // Time to duck
  };
  
  // Trigger bindings
  trigger: {
    keyboard?: string;        // e.g., 'KeyA', 'Digit1'
    midi?: {
      note?: number;
      cc?: number;
      channel?: number;
    };
    padIndex?: number;        // Physical pad number
  };
  
  // Visual
  color?: string;
  icon?: string;
}

export interface SoundboardBank {
  id: string;
  name: string;
  sounds: SoundEffect[];
}

// ─── Complete Broadcast State ───────────────────────────────────────────────

export interface BroadcastState {
  // Current active composition
  activeCompositionId: string | null;
  previewCompositionId: string | null;
  
  // All compositions
  compositions: Composition[];
  
  // All overlays
  overlays: Overlay[];
  
  // Active overlay states (visibility overrides)
  overlayStates: Record<string, { visible: boolean; data?: Record<string, unknown> }>;
  
  // Soundboard
  soundbanks: SoundboardBank[];
  activeSoundbank: string;
  
  // Global settings
  masterVolume: number;
  globalMute: boolean;
  
  // Transition preview
  isTransitioning: boolean;
  transitionProgress: number;
}

// ─── Preset Compositions ────────────────────────────────────────────────────

export const DEFAULT_COMPOSITIONS: Partial<Composition>[] = [
  {
    name: 'Starting Soon',
    icon: '⏳',
    color: '#f59e0b',
    overlays: [],
    audio: {},
    video: { camera: { sourceId: 'camera', visible: false } },
    transition: 'fade',
    transitionDurationMs: 500,
  },
  {
    name: 'Full Camera',
    icon: '📹',
    color: '#22c55e',
    overlays: [],
    audio: {},
    video: { camera: { sourceId: 'camera', visible: true } },
    transition: 'fade',
    transitionDurationMs: 300,
  },
  {
    name: 'Screen Share',
    icon: '🖥️',
    color: '#3b82f6',
    overlays: [],
    audio: {},
    video: { 
      camera: { sourceId: 'camera', visible: false },
      screen: { sourceId: 'screen', visible: true }
    },
    transition: 'fade',
    transitionDurationMs: 300,
  },
  {
    name: 'PiP Mode',
    icon: '📺',
    color: '#8b5cf6',
    overlays: [],
    audio: {},
    video: { 
      camera: { sourceId: 'camera', visible: true, position: { x: 1580, y: 820 }, size: { width: 320, height: 180 } },
      screen: { sourceId: 'screen', visible: true }
    },
    transition: 'slide-up',
    transitionDurationMs: 300,
  },
  {
    name: 'BRB',
    icon: '🚶',
    color: '#ef4444',
    overlays: [],
    audio: {},
    video: { camera: { sourceId: 'camera', visible: false } },
    transition: 'fade',
    transitionDurationMs: 500,
  },
  {
    name: 'Ending',
    icon: '👋',
    color: '#ec4899',
    overlays: [],
    audio: {},
    video: { camera: { sourceId: 'camera', visible: true } },
    transition: 'fade',
    transitionDurationMs: 800,
  },
];

// ─── Overlay Presets ────────────────────────────────────────────────────────

export const DEFAULT_LOWER_THIRD: Partial<Overlay> = {
  version: '1.0',
  type: 'lower-third',
  name: 'Host Name Bar',
  layer: 10,
  visible: false,
  position: {
    x: 120,
    y: 820,
    anchor: 'bottom-left',
  },
  size: {
    width: 900,
    height: 120,
  },
  style: {
    background: '#111111',
    opacity: 0.92,
    borderRadius: 12,
  },
  text: [
    {
      content: 'Your Name',
      font: 'Inter',
      size: 42,
      weight: 700,
      color: '#ffffff',
    },
    {
      content: 'Title | Company',
      font: 'Inter',
      size: 26,
      weight: 400,
      color: '#cfcfcf',
    },
  ],
  animation: {
    in: 'slide-left',
    out: 'fade',
    durationMs: 350,
  },
};

export const DEFAULT_LOGO: Partial<Overlay> = {
  version: '1.0',
  type: 'logo',
  name: 'Channel Logo',
  layer: 20,
  visible: true,
  position: {
    x: 40,
    y: 40,
    anchor: 'top-left',
  },
  size: {
    width: 120,
    height: 120,
  },
  style: {
    opacity: 0.9,
    borderRadius: 8,
  },
  animation: {
    in: 'fade',
    out: 'fade',
    durationMs: 200,
  },
};
