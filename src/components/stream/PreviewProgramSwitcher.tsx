'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface VideoSource {
  id: string;
  name: string;
  icon: string;
  type: 'camera' | 'screen' | 'media' | 'guest' | 'graphic';
  thumbnail?: string;
  active: boolean;
}

interface CompositionState {
  id: string;
  name: string;
  icon: string;
  video: {
    primary: string | null;    // Source ID
    secondary: string | null;  // PIP source
    layout: 'fullscreen' | 'pip' | 'split' | 'grid';
  };
  overlays: {
    logo: boolean;
    lowerThird: boolean;
    watermark: boolean;
    custom: string[];
  };
  audio: {
    muteMics: boolean;
    playMusic: boolean;
    ducking: boolean;
  };
  transition: {
    type: 'cut' | 'fade' | 'slide' | 'zoom' | 'wipe';
    duration: number;
    direction?: 'left' | 'right' | 'up' | 'down';
  };
}

type TransitionType = 'cut' | 'fade' | 'slide' | 'zoom' | 'wipe';

// ============================================================================
// DEFAULT COMPOSITIONS
// ============================================================================

const DEFAULT_COMPOSITIONS: CompositionState[] = [
  {
    id: 'starting',
    name: 'Starting Soon',
    icon: '⏰',
    video: { primary: 'graphic-starting', secondary: null, layout: 'fullscreen' },
    overlays: { logo: true, lowerThird: false, watermark: false, custom: [] },
    audio: { muteMics: true, playMusic: true, ducking: false },
    transition: { type: 'fade', duration: 1000 },
  },
  {
    id: 'fullcam',
    name: 'Full Camera',
    icon: '📹',
    video: { primary: 'cam1', secondary: null, layout: 'fullscreen' },
    overlays: { logo: true, lowerThird: false, watermark: false, custom: [] },
    audio: { muteMics: false, playMusic: false, ducking: false },
    transition: { type: 'cut', duration: 0 },
  },
  {
    id: 'screenshare',
    name: 'Screen + PIP',
    icon: '🖥️',
    video: { primary: 'screen', secondary: 'cam1', layout: 'pip' },
    overlays: { logo: true, lowerThird: false, watermark: false, custom: [] },
    audio: { muteMics: false, playMusic: false, ducking: true },
    transition: { type: 'slide', duration: 500, direction: 'left' },
  },
  {
    id: 'brb',
    name: 'Be Right Back',
    icon: '🔄',
    video: { primary: 'graphic-brb', secondary: null, layout: 'fullscreen' },
    overlays: { logo: true, lowerThird: false, watermark: false, custom: [] },
    audio: { muteMics: true, playMusic: true, ducking: false },
    transition: { type: 'fade', duration: 800 },
  },
  {
    id: 'ending',
    name: 'Ending Soon',
    icon: '👋',
    video: { primary: 'graphic-ending', secondary: null, layout: 'fullscreen' },
    overlays: { logo: true, lowerThird: false, watermark: false, custom: [] },
    audio: { muteMics: true, playMusic: true, ducking: false },
    transition: { type: 'fade', duration: 1500 },
  },
];

const DEFAULT_SOURCES: VideoSource[] = [
  { id: 'cam1', name: 'Camera 1', icon: '📹', type: 'camera', active: true },
  { id: 'cam2', name: 'Camera 2', icon: '📷', type: 'camera', active: false },
  { id: 'screen', name: 'Screen Share', icon: '🖥️', type: 'screen', active: false },
  { id: 'media', name: 'Media Player', icon: '🎬', type: 'media', active: false },
  { id: 'guest1', name: 'Remote Guest', icon: '👤', type: 'guest', active: false },
  { id: 'graphic-starting', name: 'Starting Slate', icon: '⏰', type: 'graphic', active: false },
  { id: 'graphic-brb', name: 'BRB Slate', icon: '🔄', type: 'graphic', active: false },
  { id: 'graphic-ending', name: 'Ending Slate', icon: '👋', type: 'graphic', active: false },
];

// ============================================================================
// MINI SOURCE THUMBNAIL
// ============================================================================

function SourceThumbnail({ 
  source, 
  isPreview, 
  isProgram,
  onClick 
}: { 
  source: VideoSource;
  isPreview: boolean;
  isProgram: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative aspect-video w-24 rounded-lg overflow-hidden border-2 transition-all ${
        isProgram ? 'border-red-500 shadow-lg shadow-red-500/30' :
        isPreview ? 'border-green-500 shadow-lg shadow-green-500/30' :
        'border-zinc-700 hover:border-zinc-500'
      }`}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
        <span className="text-2xl">{source.icon}</span>
      </div>
      
      {/* Labels */}
      {isProgram && (
        <div className="absolute top-1 left-1 px-1 py-0.5 bg-red-600 text-white text-[8px] font-bold rounded">
          PGM
        </div>
      )}
      {isPreview && (
        <div className="absolute top-1 left-1 px-1 py-0.5 bg-green-600 text-white text-[8px] font-bold rounded">
          PVW
        </div>
      )}
      
      {/* Name */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-1 py-0.5">
        <span className="text-[9px] text-white truncate block">{source.name}</span>
      </div>
    </button>
  );
}

// ============================================================================
// TRANSITION BAR
// ============================================================================

function TransitionBar({ 
  selectedType, 
  onTypeChange,
  onTransition,
  onCut,
  isTransitioning 
}: { 
  selectedType: TransitionType;
  onTypeChange: (type: TransitionType) => void;
  onTransition: () => void;
  onCut: () => void;
  isTransitioning: boolean;
}) {
  const types: { id: TransitionType; label: string; icon: string }[] = [
    { id: 'cut', label: 'Cut', icon: '✂️' },
    { id: 'fade', label: 'Fade', icon: '🌓' },
    { id: 'slide', label: 'Slide', icon: '➡️' },
    { id: 'zoom', label: 'Zoom', icon: '🔍' },
    { id: 'wipe', label: 'Wipe', icon: '🧹' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg">
      {/* Transition Type Selector */}
      <div className="flex gap-1">
        {types.map(t => (
          <button
            key={t.id}
            onClick={() => onTypeChange(t.id)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              selectedType === t.id
                ? 'bg-brand-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 ml-auto">
        <button
          onClick={onCut}
          disabled={isTransitioning}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 text-white text-xs font-bold rounded transition-colors"
        >
          CUT
        </button>
        <button
          onClick={onTransition}
          disabled={isTransitioning}
          className={`px-4 py-2 text-white text-xs font-bold rounded transition-all ${
            isTransitioning 
              ? 'bg-yellow-600 animate-pulse' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isTransitioning ? 'TRANS...' : 'AUTO'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSITION PRESET BUTTON
// ============================================================================

function CompositionButton({ 
  comp, 
  isActive, 
  isPreview,
  onClick 
}: { 
  comp: CompositionState;
  isActive: boolean;
  isPreview: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all min-w-[80px] ${
        isActive ? 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/20' :
        isPreview ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20' :
        'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800'
      }`}
    >
      <span className="text-xl">{comp.icon}</span>
      <span className="text-[10px] text-white font-medium">{comp.name}</span>
      {isActive && <span className="text-[8px] text-red-400 font-bold">LIVE</span>}
      {isPreview && !isActive && <span className="text-[8px] text-green-400 font-bold">NEXT</span>}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PreviewProgramSwitcher({ className = '' }: { className?: string }) {
  const [sources] = useState<VideoSource[]>(DEFAULT_SOURCES);
  const [compositions] = useState<CompositionState[]>(DEFAULT_COMPOSITIONS);
  
  const [previewId, setPreviewId] = useState<string>('fullcam');
  const [programId, setProgramId] = useState<string>('starting');
  const [previewSourceId, setPreviewSourceId] = useState<string>('cam1');
  const [programSourceId, setProgramSourceId] = useState<string>('graphic-starting');
  
  const [transitionType, setTransitionType] = useState<TransitionType>('fade');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);

  const previewComp = compositions.find(c => c.id === previewId);
  const programComp = compositions.find(c => c.id === programId);

  // Execute transition
  const executeTransition = useCallback((duration: number = 500) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTransitionProgress(0);

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setTransitionProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Commit transition
        setProgramId(previewId);
        setProgramSourceId(previewSourceId);
        setIsTransitioning(false);
        setTransitionProgress(0);
      }
    };

    requestAnimationFrame(animate);
  }, [isTransitioning, previewId, previewSourceId]);

  // Instant cut
  const executeCut = useCallback(() => {
    setProgramId(previewId);
    setProgramSourceId(previewSourceId);
  }, [previewId, previewSourceId]);

  // Handle composition click
  const handleCompositionClick = (compId: string) => {
    const comp = compositions.find(c => c.id === compId);
    if (comp) {
      setPreviewId(compId);
      setPreviewSourceId(comp.video.primary || 'cam1');
    }
  };

  // Handle source click
  const handleSourceClick = (sourceId: string) => {
    setPreviewSourceId(sourceId);
  };

  return (
    <div className={`preview-program-switcher bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <span className="text-sm font-bold text-white">🎬 Composition Switcher</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 bg-green-600/20 text-green-400 rounded">Preview</span>
          <span className="text-[10px] px-2 py-0.5 bg-red-600/20 text-red-400 rounded">Program</span>
        </div>
      </div>

      {/* Preview / Program Monitors */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {/* Preview Monitor */}
        <div className="relative">
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded">
            PREVIEW
          </div>
          <div className="aspect-video bg-zinc-900 rounded-lg border-2 border-green-500/50 overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl block mb-2">
                {sources.find(s => s.id === previewSourceId)?.icon || '📹'}
              </span>
              <span className="text-xs text-zinc-400">
                {previewComp?.name || 'Preview'}
              </span>
            </div>
          </div>
        </div>

        {/* Program Monitor */}
        <div className="relative">
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            PROGRAM
          </div>
          <div className="aspect-video bg-zinc-900 rounded-lg border-2 border-red-500/50 overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl block mb-2">
                {sources.find(s => s.id === programSourceId)?.icon || '📹'}
              </span>
              <span className="text-xs text-zinc-400">
                {programComp?.name || 'Program'}
              </span>
            </div>
            {/* Transition overlay */}
            {isTransitioning && (
              <div 
                className="absolute inset-0 bg-black/50 flex items-center justify-center"
                style={{ opacity: 1 - transitionProgress }}
              >
                <span className="text-white text-sm font-bold">Transitioning...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transition Bar */}
      <div className="px-3 pb-2">
        <TransitionBar
          selectedType={transitionType}
          onTypeChange={setTransitionType}
          onTransition={() => executeTransition(previewComp?.transition.duration || 500)}
          onCut={executeCut}
          isTransitioning={isTransitioning}
        />
      </div>

      {/* Source Thumbnails */}
      <div className="px-3 pb-2">
        <div className="text-[10px] text-zinc-500 uppercase mb-1">Sources</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sources.map(source => (
            <SourceThumbnail
              key={source.id}
              source={source}
              isPreview={source.id === previewSourceId}
              isProgram={source.id === programSourceId}
              onClick={() => handleSourceClick(source.id)}
            />
          ))}
        </div>
      </div>

      {/* Composition Presets */}
      <div className="px-3 pb-3">
        <div className="text-[10px] text-zinc-500 uppercase mb-1">Compositions</div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {compositions.map(comp => (
            <CompositionButton
              key={comp.id}
              comp={comp}
              isActive={comp.id === programId}
              isPreview={comp.id === previewId}
              onClick={() => handleCompositionClick(comp.id)}
            />
          ))}
        </div>
      </div>

      {/* Active Composition Details */}
      <div className="px-3 pb-3 border-t border-zinc-800 pt-2">
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="p-2 bg-zinc-900 rounded">
            <div className="text-zinc-500 uppercase mb-1">Layout</div>
            <div className="text-white capitalize">{previewComp?.video.layout}</div>
          </div>
          <div className="p-2 bg-zinc-900 rounded">
            <div className="text-zinc-500 uppercase mb-1">Audio</div>
            <div className="text-white">
              {previewComp?.audio.muteMics ? '🔇 Muted' : '🎙️ Live'}
              {previewComp?.audio.playMusic && ' + 🎵'}
            </div>
          </div>
          <div className="p-2 bg-zinc-900 rounded">
            <div className="text-zinc-500 uppercase mb-1">Transition</div>
            <div className="text-white capitalize">
              {previewComp?.transition.type} ({previewComp?.transition.duration}ms)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
