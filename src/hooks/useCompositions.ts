'use client';

import { useState, useEffect, useCallback } from 'react';
import { BroadcastState, Composition, Overlay, TransitionType } from '@/types/composition';
import { getCompositionEngine } from '@/lib/streamStudio/CompositionEngine';

/**
 * Hook for managing the composition system
 * Provides access to compositions, overlays, and transition controls
 */
export function useCompositions() {
  const [state, setState] = useState<BroadcastState | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState<{ remaining: number; total: number; compositionId: string } | null>(null);
  const engine = getCompositionEngine();

  useEffect(() => {
    const unsubState = engine.subscribe(setState);
    const unsubTransition = engine.subscribeToTransitions((progress) => {
      setTransitionProgress(progress);
    });
    const unsubAutoAdvance = engine.subscribeToAutoAdvance((remaining, total, compositionId) => {
      if (total > 0) {
        setAutoAdvance({ remaining, total, compositionId });
      } else {
        setAutoAdvance(null);
      }
    });

    return () => {
      unsubState();
      unsubTransition();
      unsubAutoAdvance();
    };
  }, []);

  // ─── Composition Actions ─────────────────────────────────────────────

  const switchToComposition = useCallback((id: string, options?: { instant?: boolean }) => {
    engine.switchToComposition(id, options);
  }, []);

  const setPreview = useCallback((id: string | null) => {
    engine.setPreview(id);
  }, []);

  const transitionToPreview = useCallback(() => {
    engine.transitionPreviewToProgram();
  }, []);

  const cutToPreview = useCallback(() => {
    engine.cutToPreview();
  }, []);

  const addComposition = useCallback((partial: Partial<Composition>) => {
    return engine.addComposition(partial);
  }, []);

  const updateComposition = useCallback((id: string, updates: Partial<Composition>) => {
    engine.updateComposition(id, updates);
  }, []);

  const deleteComposition = useCallback((id: string) => {
    engine.deleteComposition(id);
  }, []);

  const duplicateComposition = useCallback((id: string) => {
    return engine.duplicateComposition(id);
  }, []);

  // ─── Overlay Actions ─────────────────────────────────────────────────

  const toggleOverlay = useCallback((id: string) => {
    engine.toggleOverlayVisibility(id);
  }, []);

  const setOverlayVisible = useCallback((id: string, visible: boolean) => {
    engine.setOverlayVisibility(id, visible);
  }, []);

  const addOverlay = useCallback((overlay: Overlay) => {
    engine.addOverlay(overlay);
  }, []);

  const updateOverlay = useCallback((id: string, updates: Partial<Overlay>) => {
    engine.updateOverlay(id, updates);
  }, []);

  const deleteOverlay = useCallback((id: string) => {
    engine.deleteOverlay(id);
  }, []);

  // ─── Hotkey Handling ─────────────────────────────────────────────────

  const handleHotkey = useCallback((key: string) => {
    return engine.handleHotkey(key);
  }, []);

  const handleMidiNote = useCallback((note: number, channel?: number) => {
    return engine.handleMidiNote(note, channel);
  }, []);

  // ─── Import/Export ───────────────────────────────────────────────────

  const exportComposition = useCallback((id: string) => {
    return engine.exportComposition(id);
  }, []);

  const importComposition = useCallback((json: string) => {
    return engine.importComposition(json);
  }, []);

  const exportAll = useCallback(() => {
    return engine.exportAll();
  }, []);

  const importAll = useCallback((json: string) => {
    engine.importAll(json);
  }, []);

  const cancelAutoAdvance = useCallback(() => {
    engine.cancelAutoAdvance();
  }, []);

  // ─── Derived State ───────────────────────────────────────────────────

  const activeComposition = state?.compositions.find(c => c.id === state.activeCompositionId) || null;
  const previewComposition = state?.compositions.find(c => c.id === state.previewCompositionId) || null;

  const visibleOverlays = state?.overlays.filter(o => 
    state.overlayStates[o.id]?.visible ?? o.visible
  ) || [];

  return {
    // State
    state,
    compositions: state?.compositions || [],
    overlays: state?.overlays || [],
    activeComposition,
    previewComposition,
    activeCompositionId: state?.activeCompositionId || null,
    previewCompositionId: state?.previewCompositionId || null,
    visibleOverlays,
    isTransitioning: state?.isTransitioning || false,
    transitionProgress,
    autoAdvance,

    // Composition actions
    switchToComposition,
    setPreview,
    transitionToPreview,
    cutToPreview,
    addComposition,
    updateComposition,
    deleteComposition,
    duplicateComposition,
    cancelAutoAdvance,

    // Overlay actions
    toggleOverlay,
    setOverlayVisible,
    addOverlay,
    updateOverlay,
    deleteOverlay,

    // Triggers
    handleHotkey,
    handleMidiNote,

    // Import/Export
    exportComposition,
    importComposition,
    exportAll,
    importAll,
  };
}

/**
 * Hook for handling composition hotkeys
 * Automatically binds keyboard events to composition triggers
 */
export function useCompositionHotkeys() {
  const { handleHotkey, compositions } = useCompositions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check F-keys and other shortcuts
      if (e.key.startsWith('F') && e.key.length <= 3) {
        const handled = handleHotkey(e.key);
        if (handled) {
          e.preventDefault();
        }
      }

      // Check Ctrl/Cmd + number
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        const handled = handleHotkey(`Ctrl+${e.key}`);
        if (handled) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHotkey, compositions]);
}

/**
 * Hook for overlay visibility based on active composition
 */
export function useOverlayVisibility(overlayId: string) {
  const { state } = useCompositions();

  const isVisible = state?.overlayStates[overlayId]?.visible ?? 
    state?.overlays.find(o => o.id === overlayId)?.visible ?? 
    false;

  const overlay = state?.overlays.find(o => o.id === overlayId);

  return {
    isVisible,
    overlay,
  };
}
