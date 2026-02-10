// ============================================================================
// BROADCAST STATE ENGINE
// Single Source of Truth for Live Production
// COMMAND → VALIDATE → APPLY → BROADCAST
// ============================================================================

import type { Composition, Overlay, AudioChannelState, VideoSourceState, TransitionType } from './composition';

// ─── Core State Types ────────────────────────────────────────────────────────

/**
 * Complete audio state for the broadcast
 */
export interface AudioState {
  master: {
    gain: number;       // 0-1
    mute: boolean;
    limiterEnabled: boolean;
    limiterThreshold: number;
  };
  channels: Record<string, AudioChannelState>;
  activeMonitor?: string;  // Which channel is being monitored
  talkbackEnabled: boolean;
}

/**
 * Complete video state for the broadcast
 */
export interface VideoState {
  sources: Record<string, VideoSourceState>;
  layout: 'fullscreen' | 'pip' | 'side-by-side' | 'grid' | 'custom';
  layoutConfig?: {
    positions: Array<{
      sourceId: string;
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex: number;
    }>;
  };
  activeCamera?: string;
}

/**
 * Complete composition state (what's being shown)
 */
export interface CompositionState {
  activeComposition: Composition | null;
  overlays: Overlay[];
  audio: AudioState;
  video: VideoState;
  transition: {
    type: TransitionType;
    durationMs: number;
    inProgress: boolean;
    progress?: number;
  };
}

/**
 * The master BroadcastState - Single Source of Truth
 */
export interface BroadcastState {
  // Stream identification
  streamId: string;
  userId: string;
  
  // Program = what viewers see
  program: CompositionState;
  
  // Preview = what host sees before switching
  preview: CompositionState;
  
  // Audio (shared between program/preview)
  audio: AudioState;
  
  // Active overlays list
  overlays: Overlay[];
  
  // Who has control
  controlAuthority: string;  // user_id of who can send commands
  
  // Stream metadata
  status: 'offline' | 'preview' | 'live' | 'ended' | 'killed';
  startedAt: string | null;
  viewerCount: number;
  peakViewers: number;
  
  // Recording state
  isRecording: boolean;
  recordingPath?: string;
  
  // Timestamps
  lastUpdated: string;
  version: number;  // Increments on each state change
}

// ─── Command Types ───────────────────────────────────────────────────────────

export type CommandType =
  // Composition commands
  | 'SWITCH_COMPOSITION'
  | 'LOAD_PREVIEW'
  | 'COMMIT_PREVIEW'      // Preview → Program atomically
  
  // Audio commands
  | 'SET_AUDIO_GAIN'
  | 'SET_AUDIO_MUTE'
  | 'SET_AUDIO_SOLO'
  | 'SET_MASTER_GAIN'
  | 'SET_MASTER_MUTE'
  
  // Video commands
  | 'SET_VIDEO_SOURCE'
  | 'SET_VIDEO_LAYOUT'
  | 'TOGGLE_SOURCE_VISIBILITY'
  
  // Overlay commands
  | 'SHOW_OVERLAY'
  | 'HIDE_OVERLAY'
  | 'UPDATE_OVERLAY'
  | 'ADD_OVERLAY'
  | 'REMOVE_OVERLAY'
  
  // Transition commands
  | 'SET_TRANSITION'
  | 'EXECUTE_TRANSITION'
  | 'CUT_TO_PREVIEW'      // Instant cut
  
  // Stream control
  | 'START_STREAM'
  | 'STOP_STREAM'
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  
  // Admin commands
  | 'KILL_STREAM'
  | 'TRANSFER_CONTROL'
  | 'FORCE_STATE';

/**
 * A command to be validated and applied
 */
export interface BroadcastCommand {
  id: string;                   // Unique command ID
  type: CommandType;
  userId: string;               // Who sent it
  timestamp: string;
  
  // Command-specific payload
  payload: Record<string, unknown>;
  
  // For sequencing
  expectedVersion?: number;     // Only apply if state version matches
  
  // Metadata
  source?: 'ui' | 'hotkey' | 'midi' | 'api' | 'admin';
}

/**
 * Result of command validation
 */
export interface CommandValidation {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Result of command execution
 */
export interface CommandResult {
  success: boolean;
  command: BroadcastCommand;
  newState?: Partial<BroadcastState>;
  error?: string;
  appliedAt: string;
}

// ─── State Engine Interface ──────────────────────────────────────────────────

/**
 * The state engine processes commands and maintains truth
 */
export interface StateEngine {
  // Current state
  getState(): BroadcastState;
  
  // Command flow
  validate(command: BroadcastCommand): CommandValidation;
  apply(command: BroadcastCommand): CommandResult;
  
  // Subscriptions
  subscribe(callback: (state: BroadcastState) => void): () => void;
  
  // Snapshots for persistence
  snapshot(): BroadcastState;
  restore(state: BroadcastState): void;
}

// ─── Server-Side State Manager ───────────────────────────────────────────────

/**
 * Server-side state manager interface
 * All commands MUST go through this
 */
export interface ServerStateManager {
  // Stream lifecycle
  createStream(userId: string, config: StreamConfig): Promise<BroadcastState>;
  getStream(streamId: string): Promise<BroadcastState | null>;
  destroyStream(streamId: string): Promise<void>;
  
  // Command processing
  processCommand(
    streamId: string, 
    command: BroadcastCommand
  ): Promise<CommandResult>;
  
  // Admin operations
  killStream(streamId: string, adminId: string, reason: string): Promise<void>;
  transferControl(streamId: string, fromUserId: string, toUserId: string): Promise<void>;
  
  // Real-time sync
  broadcast(streamId: string, state: Partial<BroadcastState>): void;
}

export interface StreamConfig {
  title: string;
  description?: string;
  visibility: 'public' | 'private' | 'unlisted';
  recordingEnabled: boolean;
  initialComposition?: string;  // Composition ID to load
}

// ─── Tier Limits Check ───────────────────────────────────────────────────────

export interface TierLimitsResult {
  allowed: boolean;
  reason: string;
  tier: string;
  limits: TierConfig;
}

export interface TierConfig {
  tier: string;
  maxDuration: number;        // seconds, -1 = unlimited
  sessionsPerWeek: number;    // -1 = unlimited
  externalRTMP: boolean;
  maxOverlays: number;        // -1 = unlimited
  maxDestinations: number;    // -1 = unlimited
  aiFeatures: boolean;
  storageGB: number;          // -1 = unlimited
  maxBitrateKbps: number;
  maxResolution: string;
}

// ─── Default State Factory ───────────────────────────────────────────────────

export function createDefaultBroadcastState(
  streamId: string,
  userId: string
): BroadcastState {
  const defaultAudio: AudioState = {
    master: {
      gain: 0.8,
      mute: false,
      limiterEnabled: true,
      limiterThreshold: -3,
    },
    channels: {},
    talkbackEnabled: false,
  };
  
  const defaultVideo: VideoState = {
    sources: {},
    layout: 'fullscreen',
  };
  
  const defaultComposition: CompositionState = {
    activeComposition: null,
    overlays: [],
    audio: defaultAudio,
    video: defaultVideo,
    transition: {
      type: 'cut',
      durationMs: 500,
      inProgress: false,
    },
  };
  
  return {
    streamId,
    userId,
    program: { ...defaultComposition },
    preview: { ...defaultComposition },
    audio: defaultAudio,
    overlays: [],
    controlAuthority: userId,
    status: 'offline',
    startedAt: null,
    viewerCount: 0,
    peakViewers: 0,
    isRecording: false,
    lastUpdated: new Date().toISOString(),
    version: 1,
  };
}

// ─── Command Validators ──────────────────────────────────────────────────────

export const commandValidators: Record<CommandType, (cmd: BroadcastCommand, state: BroadcastState) => CommandValidation> = {
  SWITCH_COMPOSITION: (cmd, state) => {
    const compositionId = cmd.payload.compositionId as string;
    if (!compositionId) {
      return { valid: false, errors: ['compositionId required'] };
    }
    return { valid: true, errors: [] };
  },
  
  LOAD_PREVIEW: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  COMMIT_PREVIEW: (cmd, state) => {
    // Verify user has control authority
    if (cmd.userId !== state.controlAuthority) {
      return { valid: false, errors: ['Not control authority'] };
    }
    return { valid: true, errors: [] };
  },
  
  SET_AUDIO_GAIN: (cmd, state) => {
    const { channelId, gain } = cmd.payload as { channelId: string; gain: number };
    if (typeof gain !== 'number' || gain < 0 || gain > 1) {
      return { valid: false, errors: ['gain must be 0-1'] };
    }
    return { valid: true, errors: [] };
  },
  
  SET_AUDIO_MUTE: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  SET_AUDIO_SOLO: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  SET_MASTER_GAIN: (cmd, state) => {
    const gain = cmd.payload.gain as number;
    if (typeof gain !== 'number' || gain < 0 || gain > 1) {
      return { valid: false, errors: ['gain must be 0-1'] };
    }
    return { valid: true, errors: [] };
  },
  
  SET_MASTER_MUTE: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  SET_VIDEO_SOURCE: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  SET_VIDEO_LAYOUT: (cmd, state) => {
    const layout = cmd.payload.layout as string;
    if (!['fullscreen', 'pip', 'side-by-side', 'grid', 'custom'].includes(layout)) {
      return { valid: false, errors: ['Invalid layout'] };
    }
    return { valid: true, errors: [] };
  },
  
  TOGGLE_SOURCE_VISIBILITY: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  SHOW_OVERLAY: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  HIDE_OVERLAY: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  UPDATE_OVERLAY: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  ADD_OVERLAY: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  REMOVE_OVERLAY: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  SET_TRANSITION: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  EXECUTE_TRANSITION: (cmd, state) => {
    if (cmd.userId !== state.controlAuthority) {
      return { valid: false, errors: ['Not control authority'] };
    }
    return { valid: true, errors: [] };
  },
  
  CUT_TO_PREVIEW: (cmd, state) => {
    if (cmd.userId !== state.controlAuthority) {
      return { valid: false, errors: ['Not control authority'] };
    }
    return { valid: true, errors: [] };
  },
  
  START_STREAM: (cmd, state) => {
    if (state.status === 'live') {
      return { valid: false, errors: ['Already live'] };
    }
    return { valid: true, errors: [] };
  },
  
  STOP_STREAM: (cmd, state) => {
    if (cmd.userId !== state.controlAuthority && cmd.source !== 'admin') {
      return { valid: false, errors: ['Not control authority'] };
    }
    return { valid: true, errors: [] };
  },
  
  START_RECORDING: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  STOP_RECORDING: (cmd, state) => {
    return { valid: true, errors: [] };
  },
  
  KILL_STREAM: (cmd, state) => {
    // Admin only - validated server-side
    return { valid: true, errors: [] };
  },
  
  TRANSFER_CONTROL: (cmd, state) => {
    if (cmd.userId !== state.controlAuthority && cmd.source !== 'admin') {
      return { valid: false, errors: ['Not control authority'] };
    }
    return { valid: true, errors: [] };
  },
  
  FORCE_STATE: (cmd, state) => {
    // Admin only
    return { valid: true, errors: [] };
  },
};

// ─── State Reducers ──────────────────────────────────────────────────────────

export function applyCommand(
  state: BroadcastState, 
  command: BroadcastCommand
): BroadcastState {
  const timestamp = new Date().toISOString();
  
  switch (command.type) {
    case 'SET_MASTER_GAIN':
      return {
        ...state,
        audio: {
          ...state.audio,
          master: {
            ...state.audio.master,
            gain: command.payload.gain as number,
          },
        },
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'SET_MASTER_MUTE':
      return {
        ...state,
        audio: {
          ...state.audio,
          master: {
            ...state.audio.master,
            mute: command.payload.mute as boolean,
          },
        },
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'SET_AUDIO_GAIN': {
      const { channelId, gain } = command.payload as { channelId: string; gain: number };
      return {
        ...state,
        audio: {
          ...state.audio,
          channels: {
            ...state.audio.channels,
            [channelId]: {
              ...state.audio.channels[channelId],
              channelId,
              gain,
              mute: state.audio.channels[channelId]?.mute ?? false,
            },
          },
        },
        lastUpdated: timestamp,
        version: state.version + 1,
      };
    }
    
    case 'SET_AUDIO_MUTE': {
      const { channelId, mute } = command.payload as { channelId: string; mute: boolean };
      return {
        ...state,
        audio: {
          ...state.audio,
          channels: {
            ...state.audio.channels,
            [channelId]: {
              ...state.audio.channels[channelId],
              channelId,
              gain: state.audio.channels[channelId]?.gain ?? 0.8,
              mute,
            },
          },
        },
        lastUpdated: timestamp,
        version: state.version + 1,
      };
    }
    
    case 'COMMIT_PREVIEW':
      // Atomic Preview → Program
      return {
        ...state,
        program: { ...state.preview },
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'CUT_TO_PREVIEW':
      return {
        ...state,
        program: { ...state.preview },
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'START_STREAM':
      return {
        ...state,
        status: 'live',
        startedAt: timestamp,
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'STOP_STREAM':
      return {
        ...state,
        status: 'ended',
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'KILL_STREAM':
      return {
        ...state,
        status: 'killed',
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'START_RECORDING':
      return {
        ...state,
        isRecording: true,
        recordingPath: command.payload.path as string,
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'STOP_RECORDING':
      return {
        ...state,
        isRecording: false,
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'TRANSFER_CONTROL':
      return {
        ...state,
        controlAuthority: command.payload.toUserId as string,
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'SHOW_OVERLAY': {
      const overlay = command.payload.overlay as Overlay;
      return {
        ...state,
        overlays: [...state.overlays.filter(o => o.id !== overlay.id), { ...overlay, visible: true }],
        lastUpdated: timestamp,
        version: state.version + 1,
      };
    }
    
    case 'HIDE_OVERLAY': {
      const overlayId = command.payload.overlayId as string;
      return {
        ...state,
        overlays: state.overlays.map(o => 
          o.id === overlayId ? { ...o, visible: false } : o
        ),
        lastUpdated: timestamp,
        version: state.version + 1,
      };
    }
    
    case 'ADD_OVERLAY': {
      const overlay = command.payload.overlay as Overlay;
      return {
        ...state,
        overlays: [...state.overlays, overlay],
        lastUpdated: timestamp,
        version: state.version + 1,
      };
    }
    
    case 'REMOVE_OVERLAY': {
      const overlayId = command.payload.overlayId as string;
      return {
        ...state,
        overlays: state.overlays.filter(o => o.id !== overlayId),
        lastUpdated: timestamp,
        version: state.version + 1,
      };
    }
    
    case 'SET_VIDEO_LAYOUT':
      return {
        ...state,
        program: {
          ...state.program,
          video: {
            ...state.program.video,
            layout: command.payload.layout as VideoState['layout'],
          },
        },
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    case 'FORCE_STATE':
      // Admin override - replace entire state
      return {
        ...state,
        ...(command.payload.state as Partial<BroadcastState>),
        lastUpdated: timestamp,
        version: state.version + 1,
      };
      
    default:
      return {
        ...state,
        lastUpdated: timestamp,
        version: state.version + 1,
      };
  }
}
