// ============================================================================
// ENHANCED COMPOSITION ENGINE v2
// Extended features: auto-advance, stinger transitions, snapshots, collaboration
// ============================================================================

import {
  Composition,
  BroadcastState,
  Overlay,
  TransitionType,
} from '@/types/composition';

// ============================================================================
// TYPES
// ============================================================================

export interface TransitionEffect {
  type: TransitionType;
  durationMs: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** For stinger transitions */
  stingerUrl?: string;
  stingerDurationMs?: number;
}

export interface AutoAdvanceConfig {
  enabled: boolean;
  delayMs: number;
  nextCompositionId: string | null;
  loop?: boolean; // Loop back to first when reaching end
}

export interface CompositionSnapshot {
  id: string;
  name: string;
  timestamp: string;
  state: Partial<BroadcastState>;
}

export interface CollaborativeSession {
  sessionId: string;
  participants: Participant[];
  controlLocks: ControlLock[];
  chatEnabled: boolean;
}

export interface Participant {
  id: string;
  name: string;
  role: 'host' | 'producer' | 'guest' | 'viewer';
  avatar?: string;
  isActive: boolean;
  lastActive: string;
}

export interface ControlLock {
  controlId: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt?: string;
}

export type CompositionEvent = 
  | { type: 'composition-switched'; compositionId: string; transition: TransitionType }
  | { type: 'overlay-toggled'; overlayId: string; visible: boolean }
  | { type: 'transition-started'; from: string | null; to: string; durationMs: number }
  | { type: 'transition-complete'; compositionId: string }
  | { type: 'auto-advance-triggered'; from: string; to: string }
  | { type: 'snapshot-created'; snapshotId: string }
  | { type: 'control-locked'; controlId: string; by: string }
  | { type: 'control-unlocked'; controlId: string };

type EventListener = (event: CompositionEvent) => void;

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

const easingFunctions = {
  'linear': (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

// ============================================================================
// ENHANCED COMPOSITION ENGINE
// ============================================================================

export class CompositionEngineV2 {
  private state: BroadcastState;
  private snapshots: CompositionSnapshot[] = [];
  private eventListeners = new Set<EventListener>();
  private stateListeners = new Set<(state: BroadcastState) => void>();
  
  // Transition state
  private transitionRAF: number | null = null;
  private transitionStartTime = 0;
  private currentTransition: TransitionEffect | null = null;
  private transitionFromId: string | null = null;
  private transitionToId: string | null = null;
  
  // Auto-advance
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private autoAdvanceConfigs = new Map<string, AutoAdvanceConfig>();
  
  // Collaborative
  private collaborativeSession: CollaborativeSession | null = null;
  private localParticipantId: string | null = null;
  
  // Stinger preload
  private stingerCache = new Map<string, HTMLVideoElement>();

  constructor(initialState?: Partial<BroadcastState>) {
    this.state = {
      activeCompositionId: null,
      previewCompositionId: null,
      compositions: [],
      overlays: [],
      overlayStates: {},
      soundbanks: [],
      activeSoundbank: '',
      masterVolume: 100,
      globalMute: false,
      isTransitioning: false,
      transitionProgress: 0,
      ...initialState,
    };
  }

  // ===========================================================================
  // STATE ACCESS
  // ===========================================================================

  getState(): BroadcastState {
    return { ...this.state };
  }

  getActiveComposition(): Composition | null {
    return this.state.compositions.find(c => c.id === this.state.activeCompositionId) || null;
  }

  getPreviewComposition(): Composition | null {
    return this.state.compositions.find(c => c.id === this.state.previewCompositionId) || null;
  }

  // ===========================================================================
  // ENHANCED TRANSITIONS
  // ===========================================================================

  /**
   * Execute transition with advanced options
   */
  async executeTransition(
    toId: string,
    effect?: Partial<TransitionEffect>
  ): Promise<void> {
    const composition = this.state.compositions.find(c => c.id === toId);
    if (!composition) {
      console.warn(`Composition ${toId} not found`);
      return;
    }

    // Check collaborative locks
    if (this.collaborativeSession && !this.canControl('compositions')) {
      console.warn('Compositions are locked by another user');
      return;
    }

    const defaultEffect: TransitionEffect = {
      type: composition.transition || 'fade',
      durationMs: composition.transitionDurationMs || 300,
      easing: 'ease-out',
    };

    const transition = { ...defaultEffect, ...effect };
    
    // Cancel any existing transition
    this.cancelTransition();

    // Handle stinger transitions specially
    if (transition.type === 'stinger' && transition.stingerUrl) {
      await this.executeStingerTransition(toId, transition);
      return;
    }

    // Handle cut (instant) transition
    if (transition.type === 'cut' || transition.durationMs === 0) {
      this.applyCompositionImmediate(composition);
      this.emitEvent({ type: 'composition-switched', compositionId: toId, transition: 'cut' });
      this.scheduleAutoAdvance(toId);
      return;
    }

    // Start animated transition
    this.emitEvent({ 
      type: 'transition-started', 
      from: this.state.activeCompositionId, 
      to: toId, 
      durationMs: transition.durationMs 
    });

    this.transitionFromId = this.state.activeCompositionId;
    this.transitionToId = toId;
    this.currentTransition = transition;
    this.transitionStartTime = performance.now();
    this.state.isTransitioning = true;

    const animate = (now: number) => {
      const elapsed = now - this.transitionStartTime;
      const rawProgress = Math.min(elapsed / transition.durationMs, 1);
      const easedProgress = easingFunctions[transition.easing](rawProgress);
      
      this.state.transitionProgress = easedProgress;
      this.emitState();

      if (rawProgress < 1) {
        this.transitionRAF = requestAnimationFrame(animate);
      } else {
        this.completeTransition(composition);
      }
    };

    this.transitionRAF = requestAnimationFrame(animate);
  }

  /**
   * Execute a stinger transition (video overlay during switch)
   */
  private async executeStingerTransition(
    toId: string,
    effect: TransitionEffect
  ): Promise<void> {
    const stingerUrl = effect.stingerUrl!;
    const stingerDuration = effect.stingerDurationMs || 1000;
    
    // Get or create stinger video element
    let stinger = this.stingerCache.get(stingerUrl);
    if (!stinger) {
      stinger = document.createElement('video');
      stinger.src = stingerUrl;
      stinger.preload = 'auto';
      await new Promise(resolve => {
        stinger!.oncanplaythrough = resolve;
        stinger!.load();
      });
      this.stingerCache.set(stingerUrl, stinger);
    }

    this.state.isTransitioning = true;
    this.emitState();

    // Play stinger
    stinger.currentTime = 0;
    await stinger.play();

    // Switch at midpoint
    setTimeout(() => {
      const composition = this.state.compositions.find(c => c.id === toId);
      if (composition) {
        this.applyCompositionImmediate(composition);
      }
    }, stingerDuration / 2);

    // Complete after stinger ends
    setTimeout(() => {
      this.state.isTransitioning = false;
      this.emitEvent({ type: 'transition-complete', compositionId: toId });
      this.emitEvent({ type: 'composition-switched', compositionId: toId, transition: 'stinger' });
      this.scheduleAutoAdvance(toId);
      this.emitState();
    }, stingerDuration);
  }

  /**
   * Preload a stinger video for faster transitions
   */
  preloadStinger(url: string): void {
    if (this.stingerCache.has(url)) return;
    
    const video = document.createElement('video');
    video.src = url;
    video.preload = 'auto';
    video.load();
    this.stingerCache.set(url, video);
  }

  private completeTransition(composition: Composition): void {
    this.applyCompositionImmediate(composition);
    this.state.isTransitioning = false;
    this.state.transitionProgress = 0;
    this.currentTransition = null;
    this.transitionRAF = null;
    
    this.emitEvent({ type: 'transition-complete', compositionId: composition.id });
    this.emitEvent({ 
      type: 'composition-switched', 
      compositionId: composition.id, 
      transition: composition.transition || 'fade' 
    });
    this.scheduleAutoAdvance(composition.id);
    this.emitState();
  }

  private cancelTransition(): void {
    if (this.transitionRAF) {
      cancelAnimationFrame(this.transitionRAF);
      this.transitionRAF = null;
    }
    this.state.isTransitioning = false;
    this.state.transitionProgress = 0;
    this.currentTransition = null;
  }

  private applyCompositionImmediate(composition: Composition): void {
    this.state.activeCompositionId = composition.id;
    
    // Apply overlay visibility
    this.state.overlayStates = {};
    composition.overlays.forEach(id => {
      this.state.overlayStates[id] = { visible: true };
    });
    
    this.emitState();
  }

  // ===========================================================================
  // AUTO-ADVANCE
  // ===========================================================================

  /**
   * Configure auto-advance for a composition
   */
  setAutoAdvance(compositionId: string, config: AutoAdvanceConfig): void {
    this.autoAdvanceConfigs.set(compositionId, config);
  }

  /**
   * Get auto-advance config for a composition
   */
  getAutoAdvance(compositionId: string): AutoAdvanceConfig | undefined {
    return this.autoAdvanceConfigs.get(compositionId);
  }

  private scheduleAutoAdvance(compositionId: string): void {
    // Clear any existing timer
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }

    const config = this.autoAdvanceConfigs.get(compositionId);
    if (!config?.enabled || !config.nextCompositionId) return;

    // Check if next composition exists
    let nextId = config.nextCompositionId;
    if (config.loop && !this.state.compositions.find(c => c.id === nextId)) {
      // Loop to first composition
      nextId = this.state.compositions[0]?.id;
    }
    
    if (!nextId) return;

    this.autoAdvanceTimer = setTimeout(() => {
      this.emitEvent({ 
        type: 'auto-advance-triggered', 
        from: compositionId, 
        to: nextId 
      });
      this.executeTransition(nextId);
    }, config.delayMs);
  }

  /**
   * Cancel pending auto-advance
   */
  cancelAutoAdvance(): void {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  // ===========================================================================
  // SNAPSHOTS
  // ===========================================================================

  /**
   * Create a snapshot of current state
   */
  createSnapshot(name?: string): CompositionSnapshot {
    const snapshot: CompositionSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name || `Snapshot ${this.snapshots.length + 1}`,
      timestamp: new Date().toISOString(),
      state: {
        activeCompositionId: this.state.activeCompositionId,
        overlayStates: { ...this.state.overlayStates },
        masterVolume: this.state.masterVolume,
        globalMute: this.state.globalMute,
      },
    };

    this.snapshots.push(snapshot);
    this.emitEvent({ type: 'snapshot-created', snapshotId: snapshot.id });
    return snapshot;
  }

  /**
   * Restore a snapshot
   */
  restoreSnapshot(snapshotId: string): void {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return;

    if (snapshot.state.activeCompositionId) {
      this.executeTransition(snapshot.state.activeCompositionId);
    }
    if (snapshot.state.overlayStates) {
      this.state.overlayStates = { ...snapshot.state.overlayStates };
    }
    if (snapshot.state.masterVolume !== undefined) {
      this.state.masterVolume = snapshot.state.masterVolume;
    }
    if (snapshot.state.globalMute !== undefined) {
      this.state.globalMute = snapshot.state.globalMute;
    }
    
    this.emitState();
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): CompositionSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): void {
    this.snapshots = this.snapshots.filter(s => s.id !== snapshotId);
  }

  // ===========================================================================
  // COLLABORATIVE CONTROL
  // ===========================================================================

  /**
   * Initialize collaborative session
   */
  initCollaborativeSession(
    sessionId: string,
    localParticipant: Participant
  ): void {
    this.localParticipantId = localParticipant.id;
    this.collaborativeSession = {
      sessionId,
      participants: [localParticipant],
      controlLocks: [],
      chatEnabled: true,
    };
    this.emitState();
  }

  /**
   * Add participant to session
   */
  addParticipant(participant: Participant): void {
    if (!this.collaborativeSession) return;
    
    const existing = this.collaborativeSession.participants.find(p => p.id === participant.id);
    if (existing) {
      Object.assign(existing, participant);
    } else {
      this.collaborativeSession.participants.push(participant);
    }
    this.emitState();
  }

  /**
   * Remove participant from session
   */
  removeParticipant(participantId: string): void {
    if (!this.collaborativeSession) return;
    
    this.collaborativeSession.participants = 
      this.collaborativeSession.participants.filter(p => p.id !== participantId);
    
    // Release any locks held by this participant
    this.collaborativeSession.controlLocks = 
      this.collaborativeSession.controlLocks.filter(l => l.lockedBy !== participantId);
    
    this.emitState();
  }

  /**
   * Get all participants
   */
  getParticipants(): Participant[] {
    return this.collaborativeSession?.participants || [];
  }

  /**
   * Get local participant
   */
  getLocalParticipant(): Participant | null {
    if (!this.collaborativeSession || !this.localParticipantId) return null;
    return this.collaborativeSession.participants.find(p => p.id === this.localParticipantId) || null;
  }

  /**
   * Acquire control lock
   */
  acquireControlLock(controlId: string, durationMs?: number): boolean {
    if (!this.collaborativeSession || !this.localParticipantId) return true; // No session = always allowed
    
    const local = this.getLocalParticipant();
    if (!local) return false;

    // Check if already locked by someone else
    const existingLock = this.collaborativeSession.controlLocks.find(l => l.controlId === controlId);
    if (existingLock && existingLock.lockedBy !== this.localParticipantId) {
      // Check if lock expired
      if (existingLock.expiresAt && new Date(existingLock.expiresAt) < new Date()) {
        // Lock expired, can acquire
      } else {
        return false;
      }
    }

    // Producers and hosts can always acquire locks
    if (local.role === 'producer' || local.role === 'host') {
      const lock: ControlLock = {
        controlId,
        lockedBy: this.localParticipantId,
        lockedAt: new Date().toISOString(),
        expiresAt: durationMs ? new Date(Date.now() + durationMs).toISOString() : undefined,
      };
      
      // Remove existing lock for this control
      this.collaborativeSession.controlLocks = 
        this.collaborativeSession.controlLocks.filter(l => l.controlId !== controlId);
      
      this.collaborativeSession.controlLocks.push(lock);
      this.emitEvent({ type: 'control-locked', controlId, by: this.localParticipantId });
      this.emitState();
      return true;
    }

    return false;
  }

  /**
   * Release control lock
   */
  releaseControlLock(controlId: string): void {
    if (!this.collaborativeSession || !this.localParticipantId) return;

    const lock = this.collaborativeSession.controlLocks.find(
      l => l.controlId === controlId && l.lockedBy === this.localParticipantId
    );
    
    if (lock) {
      this.collaborativeSession.controlLocks = 
        this.collaborativeSession.controlLocks.filter(l => l !== lock);
      this.emitEvent({ type: 'control-unlocked', controlId });
      this.emitState();
    }
  }

  /**
   * Check if local user can control a feature
   */
  canControl(controlId: string): boolean {
    if (!this.collaborativeSession) return true; // No session = always allowed
    if (!this.localParticipantId) return false;

    const local = this.getLocalParticipant();
    if (!local) return false;

    // Viewers can never control
    if (local.role === 'viewer') return false;

    // Guests have limited control
    if (local.role === 'guest') {
      const guestAllowed = ['overlays', 'soundboard'];
      if (!guestAllowed.includes(controlId)) return false;
    }

    // Check locks
    const lock = this.collaborativeSession.controlLocks.find(l => l.controlId === controlId);
    if (lock && lock.lockedBy !== this.localParticipantId) {
      // Check expiry
      if (lock.expiresAt && new Date(lock.expiresAt) < new Date()) {
        return true; // Expired
      }
      return false;
    }

    return true;
  }

  /**
   * Get who has control of a feature
   */
  getControlOwner(controlId: string): Participant | null {
    if (!this.collaborativeSession) return null;

    const lock = this.collaborativeSession.controlLocks.find(l => l.controlId === controlId);
    if (!lock) return null;

    return this.collaborativeSession.participants.find(p => p.id === lock.lockedBy) || null;
  }

  /**
   * End collaborative session
   */
  endCollaborativeSession(): void {
    this.collaborativeSession = null;
    this.localParticipantId = null;
    this.emitState();
  }

  // ===========================================================================
  // KEYBOARD / MIDI HANDLING
  // ===========================================================================

  /**
   * Handle keyboard shortcut
   */
  handleKeyboard(event: KeyboardEvent): boolean {
    const key = this.normalizeKey(event);
    
    // Check compositions for matching hotkey
    for (const comp of this.state.compositions) {
      if (comp.hotkey === key) {
        this.executeTransition(comp.id);
        return true;
      }
    }
    
    return false;
  }

  private normalizeKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    parts.push(event.key.toUpperCase());
    return parts.join('+');
  }

  /**
   * Handle MIDI note
   */
  handleMidiNote(note: number, velocity: number, channel: number = 1): boolean {
    if (velocity === 0) return false; // Note off
    
    for (const comp of this.state.compositions) {
      if (comp.midiNote === note && (!comp.midiChannel || comp.midiChannel === channel)) {
        this.executeTransition(comp.id);
        return true;
      }
    }
    
    return false;
  }

  // ===========================================================================
  // EVENT SYSTEM
  // ===========================================================================

  /**
   * Subscribe to composition events
   */
  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: BroadcastState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  private emitEvent(event: CompositionEvent): void {
    this.eventListeners.forEach(l => l(event));
  }

  private emitState(): void {
    this.stateListeners.forEach(l => l({ ...this.state }));
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  dispose(): void {
    this.cancelTransition();
    this.cancelAutoAdvance();
    this.stingerCache.forEach(video => {
      video.pause();
      video.src = '';
    });
    this.stingerCache.clear();
    this.eventListeners.clear();
    this.stateListeners.clear();
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let engineInstance: CompositionEngineV2 | null = null;

export function getCompositionEngineV2(): CompositionEngineV2 {
  if (!engineInstance) {
    engineInstance = new CompositionEngineV2();
  }
  return engineInstance;
}

export function resetCompositionEngineV2(): void {
  if (engineInstance) {
    engineInstance.dispose();
  }
  engineInstance = new CompositionEngineV2();
}
