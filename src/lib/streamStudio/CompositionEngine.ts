// ============================================================================
// COMPOSITION ENGINE
// Manages broadcast compositions (the "Scenes" replacement)
// One-click state recall for overlays, audio, and video
// ============================================================================

import {
  Composition,
  BroadcastState,
  Overlay,
  AudioChannelState,
  VideoSourceState,
  TransitionType,
  DEFAULT_COMPOSITIONS,
} from '@/types/composition';

type CompositionListener = (state: BroadcastState) => void;
type TransitionListener = (progress: number, from: string | null, to: string | null) => void;

const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export class CompositionEngine {
  private state: BroadcastState;
  private listeners = new Set<CompositionListener>();
  private transitionListeners = new Set<TransitionListener>();
  private transitionFrame: number | null = null;
  private transitionStartTime: number = 0;
  private transitionDuration: number = 0;
  private transitionFrom: string | null = null;
  private transitionTo: string | null = null;

  constructor() {
    // Initialize with default state
    this.state = {
      activeCompositionId: null,
      previewCompositionId: null,
      compositions: this.createDefaultCompositions(),
      overlays: [],
      overlayStates: {},
      soundbanks: [],
      activeSoundbank: '',
      masterVolume: 100,
      globalMute: false,
      isTransitioning: false,
      transitionProgress: 0,
    };
  }

  private createDefaultCompositions(): Composition[] {
    const now = new Date().toISOString();
    return DEFAULT_COMPOSITIONS.map((preset, index) => ({
      id: generateId(),
      name: preset.name || `Composition ${index + 1}`,
      description: '',
      color: preset.color || '#6b7280',
      icon: preset.icon || '🎬',
      overlays: preset.overlays || [],
      audio: preset.audio || {},
      video: preset.video || {},
      transition: preset.transition || 'fade',
      transitionDurationMs: preset.transitionDurationMs || 300,
      hotkey: `F${index + 1}`,
      createdAt: now,
      updatedAt: now,
    }));
  }

  // =========================================================================
  // STATE ACCESS
  // =========================================================================

  getState(): BroadcastState {
    return { ...this.state };
  }

  getCompositions(): Composition[] {
    return [...this.state.compositions];
  }

  getActiveComposition(): Composition | null {
    if (!this.state.activeCompositionId) return null;
    return this.state.compositions.find(c => c.id === this.state.activeCompositionId) || null;
  }

  getPreviewComposition(): Composition | null {
    if (!this.state.previewCompositionId) return null;
    return this.state.compositions.find(c => c.id === this.state.previewCompositionId) || null;
  }

  getOverlays(): Overlay[] {
    return [...this.state.overlays];
  }

  // =========================================================================
  // COMPOSITION MANAGEMENT
  // =========================================================================

  addComposition(partial: Partial<Composition>): Composition {
    const now = new Date().toISOString();
    const composition: Composition = {
      id: generateId(),
      name: partial.name || 'New Composition',
      description: partial.description || '',
      color: partial.color || '#6b7280',
      icon: partial.icon || '🎬',
      overlays: partial.overlays || [],
      audio: partial.audio || {},
      video: partial.video || {},
      transition: partial.transition || 'fade',
      transitionDurationMs: partial.transitionDurationMs || 300,
      hotkey: partial.hotkey,
      midiNote: partial.midiNote,
      midiChannel: partial.midiChannel,
      createdAt: now,
      updatedAt: now,
    };

    this.state.compositions.push(composition);
    this.emit();
    return composition;
  }

  updateComposition(id: string, updates: Partial<Composition>): void {
    const index = this.state.compositions.findIndex(c => c.id === id);
    if (index !== -1) {
      this.state.compositions[index] = {
        ...this.state.compositions[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.emit();
    }
  }

  deleteComposition(id: string): void {
    this.state.compositions = this.state.compositions.filter(c => c.id !== id);
    if (this.state.activeCompositionId === id) {
      this.state.activeCompositionId = null;
    }
    if (this.state.previewCompositionId === id) {
      this.state.previewCompositionId = null;
    }
    this.emit();
  }

  duplicateComposition(id: string): Composition | null {
    const original = this.state.compositions.find(c => c.id === id);
    if (!original) return null;

    const copy: Composition = {
      ...original,
      id: generateId(),
      name: `${original.name} (Copy)`,
      hotkey: undefined, // Don't copy hotkey
      midiNote: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.compositions.push(copy);
    this.emit();
    return copy;
  }

  reorderCompositions(fromIndex: number, toIndex: number): void {
    const [moved] = this.state.compositions.splice(fromIndex, 1);
    this.state.compositions.splice(toIndex, 0, moved);
    this.emit();
  }

  // =========================================================================
  // COMPOSITION SWITCHING
  // =========================================================================

  /**
   * Set preview composition (for preview panel)
   */
  setPreview(compositionId: string | null): void {
    this.state.previewCompositionId = compositionId;
    this.emit();
  }

  /**
   * Switch to a composition (go live with it)
   */
  async switchToComposition(
    compositionId: string,
    options?: { instant?: boolean; transition?: TransitionType; durationMs?: number }
  ): Promise<void> {
    const composition = this.state.compositions.find(c => c.id === compositionId);
    if (!composition) return;

    const isInstant = options?.instant || composition.transition === 'cut';
    const transition = options?.transition || composition.transition;
    const durationMs = options?.durationMs || composition.transitionDurationMs;

    if (isInstant || durationMs === 0) {
      // Instant switch
      this.applyComposition(composition);
      this.state.activeCompositionId = compositionId;
      this.state.isTransitioning = false;
      this.state.transitionProgress = 0;
      this.emit();
    } else {
      // Animated transition
      this.startTransition(this.state.activeCompositionId, compositionId, durationMs);
    }
  }

  /**
   * Quick switch: preview to program
   */
  transitionPreviewToProgram(): void {
    if (this.state.previewCompositionId && this.state.previewCompositionId !== this.state.activeCompositionId) {
      this.switchToComposition(this.state.previewCompositionId);
      this.state.previewCompositionId = null;
    }
  }

  /**
   * Cut: instant switch preview to program
   */
  cutToPreview(): void {
    if (this.state.previewCompositionId) {
      this.switchToComposition(this.state.previewCompositionId, { instant: true });
      this.state.previewCompositionId = null;
    }
  }

  private startTransition(fromId: string | null, toId: string, durationMs: number): void {
    // Cancel any existing transition
    if (this.transitionFrame) {
      cancelAnimationFrame(this.transitionFrame);
    }

    this.transitionFrom = fromId;
    this.transitionTo = toId;
    this.transitionDuration = durationMs;
    this.transitionStartTime = performance.now();
    this.state.isTransitioning = true;
    this.state.transitionProgress = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.transitionStartTime;
      const progress = Math.min(elapsed / this.transitionDuration, 1);
      
      this.state.transitionProgress = progress;
      this.transitionListeners.forEach(l => l(progress, this.transitionFrom, this.transitionTo));
      this.emit();

      if (progress < 1) {
        this.transitionFrame = requestAnimationFrame(animate);
      } else {
        // Transition complete
        const toComposition = this.state.compositions.find(c => c.id === this.transitionTo);
        if (toComposition) {
          this.applyComposition(toComposition);
        }
        this.state.activeCompositionId = this.transitionTo;
        this.state.isTransitioning = false;
        this.state.transitionProgress = 0;
        this.transitionFrame = null;
        this.emit();
      }
    };

    this.transitionFrame = requestAnimationFrame(animate);
  }

  private applyComposition(composition: Composition): void {
    // Apply overlay visibility
    this.state.overlayStates = {};
    composition.overlays.forEach(overlayId => {
      this.state.overlayStates[overlayId] = { visible: true };
    });

    // Audio and video states are emitted to listeners
    // who should apply them to their respective engines
  }

  // =========================================================================
  // OVERLAY MANAGEMENT
  // =========================================================================

  addOverlay(overlay: Overlay): void {
    this.state.overlays.push(overlay);
    this.emit();
  }

  updateOverlay(id: string, updates: Partial<Overlay>): void {
    const index = this.state.overlays.findIndex(o => o.id === id);
    if (index !== -1) {
      this.state.overlays[index] = {
        ...this.state.overlays[index],
        ...updates,
      } as Overlay;
      this.emit();
    }
  }

  deleteOverlay(id: string): void {
    this.state.overlays = this.state.overlays.filter(o => o.id !== id);
    // Also remove from all compositions
    this.state.compositions.forEach(comp => {
      comp.overlays = comp.overlays.filter(oid => oid !== id);
    });
    delete this.state.overlayStates[id];
    this.emit();
  }

  toggleOverlayVisibility(id: string): void {
    const current = this.state.overlayStates[id]?.visible ?? false;
    this.state.overlayStates[id] = { 
      ...this.state.overlayStates[id],
      visible: !current 
    };
    this.emit();
  }

  setOverlayVisibility(id: string, visible: boolean): void {
    this.state.overlayStates[id] = {
      ...this.state.overlayStates[id],
      visible,
    };
    this.emit();
  }

  // =========================================================================
  // HOTKEY / MIDI HANDLING
  // =========================================================================

  handleHotkey(key: string): boolean {
    const composition = this.state.compositions.find(c => c.hotkey === key);
    if (composition) {
      this.switchToComposition(composition.id);
      return true;
    }
    return false;
  }

  handleMidiNote(note: number, channel: number = 1): boolean {
    const composition = this.state.compositions.find(
      c => c.midiNote === note && (c.midiChannel === channel || !c.midiChannel)
    );
    if (composition) {
      this.switchToComposition(composition.id);
      return true;
    }
    return false;
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  exportComposition(id: string): string {
    const composition = this.state.compositions.find(c => c.id === id);
    if (!composition) throw new Error('Composition not found');
    
    // Include referenced overlays
    const overlayIds = composition.overlays;
    const overlays = this.state.overlays.filter(o => overlayIds.includes(o.id));
    
    return JSON.stringify({
      version: '1.0',
      type: 'composition',
      composition,
      overlays,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  importComposition(json: string): Composition {
    const data = JSON.parse(json);
    if (data.version !== '1.0' || data.type !== 'composition') {
      throw new Error('Invalid composition format');
    }

    // Import overlays with new IDs
    const overlayIdMap: Record<string, string> = {};
    if (data.overlays) {
      data.overlays.forEach((overlay: Overlay) => {
        const newId = `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        overlayIdMap[overlay.id] = newId;
        this.addOverlay({ ...overlay, id: newId });
      });
    }

    // Import composition with new ID and mapped overlay IDs
    const composition: Composition = {
      ...data.composition,
      id: generateId(),
      overlays: data.composition.overlays.map((id: string) => overlayIdMap[id] || id),
      hotkey: undefined, // Don't import hotkeys
      midiNote: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.compositions.push(composition);
    this.emit();
    return composition;
  }

  exportAll(): string {
    return JSON.stringify({
      version: '1.0',
      type: 'broadcast-state',
      compositions: this.state.compositions,
      overlays: this.state.overlays,
      soundbanks: this.state.soundbanks,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  importAll(json: string): void {
    const data = JSON.parse(json);
    if (data.version !== '1.0' || data.type !== 'broadcast-state') {
      throw new Error('Invalid broadcast state format');
    }

    this.state.compositions = data.compositions || [];
    this.state.overlays = data.overlays || [];
    this.state.soundbanks = data.soundbanks || [];
    this.emit();
  }

  // =========================================================================
  // LISTENERS
  // =========================================================================

  subscribe(listener: CompositionListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  subscribeToTransitions(listener: TransitionListener): () => void {
    this.transitionListeners.add(listener);
    return () => this.transitionListeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach(l => l({ ...this.state }));
  }
}

// Singleton instance
let compositionEngine: CompositionEngine | null = null;

export function getCompositionEngine(): CompositionEngine {
  if (!compositionEngine) {
    compositionEngine = new CompositionEngine();
  }
  return compositionEngine;
}

export function resetCompositionEngine(): void {
  compositionEngine = new CompositionEngine();
}
