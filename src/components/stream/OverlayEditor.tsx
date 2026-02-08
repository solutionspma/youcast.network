'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface Overlay {
  id: string;
  name: string;
  type: 'lower_third' | 'logo' | 'text' | 'ticker' | 'alert' | 'countdown';
  visible: boolean;
  position: { x: number; y: number };
  content?: string;
}

interface OverlayEditorProps {
  overlays: Overlay[];
  onToggleOverlay: (id: string) => void;
  onAddOverlay: () => void;
  onRemoveOverlay: (id: string) => void;
  onEditOverlay: (id: string) => void;
}

const overlayIcons: Record<Overlay['type'], JSX.Element> = {
  lower_third: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="14" width="20" height="6" rx="1" />
      <line x1="5" y1="17" x2="19" y2="17" />
    </svg>
  ),
  logo: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  text: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  ),
  ticker: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="10" width="20" height="4" rx="1" />
      <path d="M6 12h12" strokeDasharray="2 2" />
    </svg>
  ),
  alert: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  countdown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const overlayTypeLabels: Record<Overlay['type'], string> = {
  lower_third: 'Lower Third',
  logo: 'Logo',
  text: 'Text',
  ticker: 'Ticker',
  alert: 'Alert',
  countdown: 'Countdown',
};

export default function OverlayEditor({ overlays, onToggleOverlay, onAddOverlay, onRemoveOverlay, onEditOverlay }: OverlayEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Overlays</h3>
        <button
          onClick={onAddOverlay}
          className="w-6 h-6 flex items-center justify-center rounded bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-white transition-colors text-lg leading-none"
        >
          +
        </button>
      </div>

      <div className="space-y-1.5">
        {overlays.map((overlay) => (
          <div
            key={overlay.id}
            className={`group flex items-center gap-2.5 p-2.5 rounded-lg transition-all border ${
              overlay.visible
                ? 'bg-surface-700/60 border-brand-500/20'
                : 'bg-surface-800/40 border-transparent hover:bg-surface-800/60'
            }`}
          >
            {/* Icon */}
            <div className={`flex-shrink-0 ${overlay.visible ? 'text-brand-400' : 'text-surface-500'}`}>
              {overlayIcons[overlay.type]}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${overlay.visible ? 'text-white' : 'text-surface-400'}`}>
                {overlay.name}
              </p>
              <p className="text-[10px] text-surface-500">{overlayTypeLabels[overlay.type]}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {/* Toggle Visibility */}
              <button
                onClick={() => onToggleOverlay(overlay.id)}
                className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                  overlay.visible
                    ? 'bg-brand-500/20 text-brand-400 hover:bg-brand-500/30'
                    : 'text-surface-500 hover:bg-surface-600 hover:text-white'
                }`}
                title={overlay.visible ? 'Hide' : 'Show'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {overlay.visible ? (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  )}
                </svg>
              </button>

              {/* Edit */}
              <button
                onClick={() => onEditOverlay(overlay.id)}
                className="w-7 h-7 flex items-center justify-center rounded text-surface-500 hover:bg-surface-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Edit"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Remove */}
              <button
                onClick={() => onRemoveOverlay(overlay.id)}
                className="w-7 h-7 flex items-center justify-center rounded text-surface-500 hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {overlays.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-surface-500">No overlays configured</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={onAddOverlay}>Add Overlay</Button>
          </div>
        )}
      </div>

      {/* Quick Add Presets */}
      <div>
        <h4 className="text-xs text-surface-500 mb-2 uppercase tracking-wider">Quick Add</h4>
        <div className="grid grid-cols-3 gap-1">
          {(['lower_third', 'logo', 'text', 'ticker', 'alert', 'countdown'] as Overlay['type'][]).map((type) => (
            <button
              key={type}
              onClick={onAddOverlay}
              className="p-2 rounded bg-surface-800/50 hover:bg-surface-700/50 text-surface-500 hover:text-surface-300 transition-colors flex flex-col items-center gap-1"
            >
              {overlayIcons[type]}
              <span className="text-[9px]">{overlayTypeLabels[type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
