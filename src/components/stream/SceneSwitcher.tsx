'use client';

import { useState } from 'react';

interface Scene {
  id: string;
  name: string;
  layout: 'single' | 'split' | 'pip' | 'grid' | 'custom';
  thumbnail?: string;
  sourceCount: number;
}

interface SceneSwitcherProps {
  scenes: Scene[];
  activeSceneId: string;
  previewSceneId: string | null;
  onSwitchScene: (sceneId: string) => void;
  onPreviewScene: (sceneId: string) => void;
  onAddScene: () => void;
  transitionType: 'cut' | 'fade' | 'slide' | 'zoom';
  onTransitionChange: (type: 'cut' | 'fade' | 'slide' | 'zoom') => void;
}

const layoutIcons: Record<Scene['layout'], JSX.Element> = {
  single: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  split: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  pip: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <rect x="13" y="12" width="6" height="5" rx="1" />
    </svg>
  ),
  grid: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  custom: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 3v18" />
    </svg>
  ),
};

const transitions = [
  { id: 'cut' as const, label: 'Cut' },
  { id: 'fade' as const, label: 'Fade' },
  { id: 'slide' as const, label: 'Slide' },
  { id: 'zoom' as const, label: 'Zoom' },
];

export default function SceneSwitcher({
  scenes,
  activeSceneId,
  previewSceneId,
  onSwitchScene,
  onPreviewScene,
  onAddScene,
  transitionType,
  onTransitionChange,
}: SceneSwitcherProps) {
  return (
    <div className="space-y-4">
      {/* Scene Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Scenes</h3>
          <button
            onClick={onAddScene}
            className="w-6 h-6 flex items-center justify-center rounded bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-white transition-colors text-lg leading-none"
          >
            +
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {scenes.map((scene) => {
            const isActive = scene.id === activeSceneId;
            const isPreview = scene.id === previewSceneId;

            return (
              <button
                key={scene.id}
                onClick={() => onPreviewScene(scene.id)}
                onDoubleClick={() => onSwitchScene(scene.id)}
                className={`relative p-3 rounded-lg border-2 transition-all text-left group ${
                  isActive
                    ? 'border-live-500 bg-live-500/10'
                    : isPreview
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-surface-700 bg-surface-800/50 hover:border-surface-600 hover:bg-surface-700/50'
                }`}
              >
                {/* Layout Icon */}
                <div className={`mb-2 ${isActive ? 'text-live-400' : isPreview ? 'text-yellow-400' : 'text-surface-400'}`}>
                  {layoutIcons[scene.layout]}
                </div>

                {/* Scene Name */}
                <p className="text-xs font-medium text-white truncate">{scene.name}</p>
                <p className="text-[10px] text-surface-500 mt-0.5">
                  {scene.sourceCount} source{scene.sourceCount !== 1 ? 's' : ''} &middot; {scene.layout}
                </p>

                {/* Active / Preview label */}
                {(isActive || isPreview) && (
                  <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold uppercase px-1 py-0.5 rounded ${
                    isActive ? 'bg-live-500 text-white' : 'bg-yellow-500 text-black'
                  }`}>
                    {isActive ? 'LIVE' : 'PRV'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transition Controls */}
      <div>
        <h4 className="text-xs font-medium text-surface-400 mb-2 uppercase tracking-wider">Transition</h4>
        <div className="grid grid-cols-4 gap-1">
          {transitions.map((t) => (
            <button
              key={t.id}
              onClick={() => onTransitionChange(t.id)}
              className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                transitionType === t.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Switch Button */}
      {previewSceneId && previewSceneId !== activeSceneId && (
        <button
          onClick={() => onSwitchScene(previewSceneId)}
          className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Transition to Preview
        </button>
      )}
    </div>
  );
}
