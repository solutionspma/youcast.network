'use client';

import { useState, useEffect, useCallback } from 'react';
import { Composition, BroadcastState, TransitionType } from '@/types/composition';
import { getCompositionEngine } from '@/lib/streamStudio/CompositionEngine';

interface CompositionSwitcherProps {
  className?: string;
  compact?: boolean;
}

const TRANSITION_OPTIONS: { id: TransitionType; label: string; icon: JSX.Element }[] = [
  { 
    id: 'cut', 
    label: 'Cut',
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
  },
  { 
    id: 'fade', 
    label: 'Fade',
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
  },
  { 
    id: 'slide-left', 
    label: 'Slide',
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
  },
  { 
    id: 'zoom', 
    label: 'Zoom',
    icon: <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" /><path fillRule="evenodd" d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /></svg>
  },
];

export default function CompositionSwitcher({ className = '', compact = false }: CompositionSwitcherProps) {
  const [state, setState] = useState<BroadcastState | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('fade');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const engine = getCompositionEngine();

  useEffect(() => {
    return engine.subscribe(setState);
  }, []);

  const handleCompositionClick = useCallback((id: string) => {
    engine.setPreview(id);
  }, []);

  const handleCompositionDoubleClick = useCallback((id: string) => {
    engine.switchToComposition(id);
  }, []);

  const handleTransitionToPreview = useCallback(() => {
    engine.transitionPreviewToProgram();
  }, []);

  const handleCutToPreview = useCallback(() => {
    engine.cutToPreview();
  }, []);

  const handleAddComposition = useCallback(() => {
    if (newName.trim()) {
      engine.addComposition({ name: newName.trim() });
      setNewName('');
      setIsAddingNew(false);
    }
  }, [newName]);

  const handleDeleteComposition = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this composition?')) {
      engine.deleteComposition(id);
    }
  }, []);

  const handleDuplicateComposition = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    engine.duplicateComposition(id);
  }, []);

  if (!state) {
    return <div className="animate-pulse bg-surface-800 rounded-lg h-48" />;
  }

  const activeComposition = state.compositions.find(c => c.id === state.activeCompositionId);
  const previewComposition = state.compositions.find(c => c.id === state.previewCompositionId);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Compositions
        </h3>
        <button
          onClick={() => setIsAddingNew(true)}
          className="w-6 h-6 flex items-center justify-center rounded bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add New Input */}
      {isAddingNew && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComposition()}
            placeholder="Composition name..."
            className="flex-1 bg-surface-800 border border-surface-700 rounded px-3 py-1.5 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500"
            autoFocus
          />
          <button
            onClick={handleAddComposition}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setIsAddingNew(false); setNewName(''); }}
            className="px-2 py-1.5 text-surface-400 hover:text-white text-sm transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Composition Grid */}
      <div className={`grid ${compact ? 'grid-cols-3 gap-1.5' : 'grid-cols-2 gap-2'}`}>
        {state.compositions.map((comp) => {
          const isActive = comp.id === state.activeCompositionId;
          const isPreview = comp.id === state.previewCompositionId;

          return (
            <button
              key={comp.id}
              onClick={() => handleCompositionClick(comp.id)}
              onDoubleClick={() => handleCompositionDoubleClick(comp.id)}
              className={`
                relative group text-left transition-all rounded-lg border-2
                ${compact ? 'p-2' : 'p-3'}
                ${isActive 
                  ? 'border-live-500 bg-live-500/10 ring-1 ring-live-500/30' 
                  : isPreview 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-surface-700 bg-surface-800/50 hover:border-surface-600 hover:bg-surface-700/50'
                }
              `}
            >
              {/* Icon / Color indicator */}
              <div className="flex items-center gap-2 mb-1.5">
                <span 
                  className="text-lg leading-none"
                  style={{ filter: isActive ? 'none' : 'grayscale(50%)' }}
                >
                  {comp.icon || '🎬'}
                </span>
                {!compact && comp.color && (
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: comp.color }}
                  />
                )}
              </div>

              {/* Name */}
              <p className={`font-medium truncate ${compact ? 'text-[10px]' : 'text-xs'} ${
                isActive ? 'text-white' : 'text-surface-300'
              }`}>
                {comp.name}
              </p>

              {/* Hotkey indicator */}
              {comp.hotkey && !compact && (
                <span className="text-[9px] text-surface-500 mt-0.5 block">
                  {comp.hotkey}
                </span>
              )}

              {/* Status badge */}
              {(isActive || isPreview) && (
                <span className={`
                  absolute top-1 right-1 text-[8px] font-bold uppercase px-1 py-0.5 rounded
                  ${isActive ? 'bg-live-500 text-white' : 'bg-amber-500 text-black'}
                `}>
                  {isActive ? 'LIVE' : 'PRV'}
                </span>
              )}

              {/* Context actions (on hover) */}
              {!compact && (
                <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDuplicateComposition(comp.id, e)}
                    className="w-5 h-5 flex items-center justify-center rounded bg-surface-700/80 hover:bg-surface-600 text-surface-400 hover:text-white text-[10px]"
                    title="Duplicate"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteComposition(comp.id, e)}
                    className="w-5 h-5 flex items-center justify-center rounded bg-surface-700/80 hover:bg-red-500/30 text-surface-400 hover:text-red-400 text-[10px]"
                    title="Delete"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Transition progress overlay */}
              {state.isTransitioning && comp.id === state.activeCompositionId && (
                <div 
                  className="absolute inset-0 bg-live-500/20 rounded-lg transition-all"
                  style={{ 
                    clipPath: `inset(0 ${100 - state.transitionProgress * 100}% 0 0)` 
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Transition Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-surface-400 uppercase tracking-wider">Transition</span>
        </div>
        
        {/* Transition type selector */}
        <div className="flex gap-1">
          {TRANSITION_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTransition(t.id)}
              className={`
                flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1
                ${selectedTransition === t.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white'
                }
              `}
            >
              {t.icon}
              {!compact && <span>{t.label}</span>}
            </button>
          ))}
        </div>

        {/* Main transition buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCutToPreview}
            disabled={!previewComposition || previewComposition.id === activeComposition?.id}
            className={`
              flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2
              ${previewComposition && previewComposition.id !== activeComposition?.id
                ? 'bg-surface-700 hover:bg-surface-600 text-white'
                : 'bg-surface-800 text-surface-600 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            CUT
          </button>
          
          <button
            onClick={handleTransitionToPreview}
            disabled={!previewComposition || previewComposition.id === activeComposition?.id}
            className={`
              flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2
              ${previewComposition && previewComposition.id !== activeComposition?.id
                ? 'bg-brand-600 hover:bg-brand-500 text-white'
                : 'bg-surface-800 text-surface-600 cursor-not-allowed'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            TRANS
          </button>
        </div>
      </div>

      {/* Preview / Program labels */}
      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded bg-surface-800/50 border border-surface-700">
            <span className="text-[9px] uppercase tracking-wider text-amber-500 font-bold">Preview</span>
            <p className="text-xs text-surface-300 truncate mt-0.5">
              {previewComposition?.name || '—'}
            </p>
          </div>
          <div className="p-2 rounded bg-live-500/10 border border-live-500/30">
            <span className="text-[9px] uppercase tracking-wider text-live-500 font-bold">Program</span>
            <p className="text-xs text-white truncate mt-0.5">
              {activeComposition?.name || '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
