'use client';

import { useState, useCallback } from 'react';
import { 
  Overlay, 
  OverlayType, 
  OverlayTextElement,
  AnchorPosition,
  AnimationType,
  DEFAULT_LOWER_THIRD,
  DEFAULT_LOGO,
} from '@/types/composition';
import { getCompositionEngine } from '@/lib/streamStudio/CompositionEngine';

// ============================================================================
// TYPES
// ============================================================================

interface ProOverlayEditorProps {
  overlays: Overlay[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Overlay>) => void;
  onRemove: (id: string) => void;
  onAdd: (overlay: Overlay) => void;
  onDuplicate: (id: string) => void;
  className?: string;
}

// ============================================================================
// OVERLAY TYPE ICONS
// ============================================================================

const overlayTypeIcons: Record<OverlayType, JSX.Element> = {
  'lower-third': (
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
  image: (
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
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M12 6v6l4 2" />
    </svg>
  ),
  'webcam-frame': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
      <circle cx="12" cy="10" r="3" strokeWidth={1.5} />
      <path strokeWidth={1.5} d="M6 21v-1a6 6 0 0112 0v1" />
    </svg>
  ),
  chroma: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
};

const overlayTypeLabels: Record<OverlayType, string> = {
  'lower-third': 'Lower Third',
  logo: 'Logo',
  image: 'Image',
  text: 'Text',
  ticker: 'Ticker',
  alert: 'Alert',
  countdown: 'Countdown',
  clock: 'Clock',
  'webcam-frame': 'Webcam Frame',
  chroma: 'Chroma Key',
};

// ============================================================================
// OVERLAY LIST ITEM
// ============================================================================

interface OverlayListItemProps {
  overlay: Overlay;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  isEditing: boolean;
}

function OverlayListItem({ overlay, onToggle, onEdit, onDuplicate, onRemove, isEditing }: OverlayListItemProps) {
  return (
    <div
      className={`
        group flex items-center gap-2.5 p-2.5 rounded-lg transition-all border
        ${isEditing ? 'border-brand-500 bg-brand-500/10' : ''}
        ${overlay.visible
          ? 'bg-surface-700/60 border-brand-500/20'
          : 'bg-surface-800/40 border-transparent hover:bg-surface-800/60'
        }
      `}
    >
      {/* Layer indicator */}
      <span className="text-[9px] text-surface-500 w-4 text-center font-mono">
        {overlay.layer}
      </span>

      {/* Icon */}
      <div className={`flex-shrink-0 ${overlay.visible ? 'text-brand-400' : 'text-surface-500'}`}>
        {overlayTypeIcons[overlay.type]}
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
          onClick={onToggle}
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
          onClick={onEdit}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            isEditing
              ? 'bg-brand-500 text-white'
              : 'text-surface-500 hover:bg-surface-600 hover:text-white opacity-0 group-hover:opacity-100'
          }`}
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          className="w-7 h-7 flex items-center justify-center rounded text-surface-500 hover:bg-surface-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          title="Duplicate"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded text-surface-500 hover:bg-red-500/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// OVERLAY EDITOR PANEL
// ============================================================================

interface OverlayEditorPanelProps {
  overlay: Overlay;
  onUpdate: (updates: Partial<Overlay>) => void;
  onClose: () => void;
}

function OverlayEditorPanel({ overlay, onUpdate, onClose }: OverlayEditorPanelProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'position' | 'style' | 'animation'>('content');

  const tabs = [
    { id: 'content', label: 'Content' },
    { id: 'position', label: 'Position' },
    { id: 'style', label: 'Style' },
    { id: 'animation', label: 'Animation' },
  ] as const;

  return (
    <div className="mt-3 p-3 bg-surface-800 rounded-lg border border-surface-700">
      <div className="flex items-center justify-between mb-3">
        <input
          type="text"
          value={overlay.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="bg-transparent text-sm font-medium text-white focus:outline-none border-b border-transparent hover:border-surface-600 focus:border-brand-500"
        />
        <button onClick={onClose} className="text-surface-400 hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
              activeTab === id
                ? 'bg-brand-500/20 text-brand-400'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'content' && (
        <div className="space-y-3">
          {(overlay.type === 'lower-third' || overlay.type === 'text') && overlay.text && (
            <>
              {overlay.text.map((textElement, i) => (
                <div key={i}>
                  <label className="block text-[10px] text-surface-500 mb-1">
                    Text Line {i + 1}
                  </label>
                  <input
                    type="text"
                    value={textElement.content}
                    onChange={(e) => {
                      const newText = [...overlay.text!];
                      newText[i] = { ...newText[i], content: e.target.value };
                      onUpdate({ text: newText });
                    }}
                    className="w-full bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="number"
                      value={textElement.size}
                      onChange={(e) => {
                        const newText = [...overlay.text!];
                        newText[i] = { ...newText[i], size: parseInt(e.target.value) };
                        onUpdate({ text: newText });
                      }}
                      className="w-16 bg-surface-700 border border-surface-600 rounded px-2 py-1 text-xs text-white"
                      placeholder="Size"
                    />
                    <input
                      type="color"
                      value={textElement.color}
                      onChange={(e) => {
                        const newText = [...overlay.text!];
                        newText[i] = { ...newText[i], color: e.target.value };
                        onUpdate({ text: newText });
                      }}
                      className="w-8 h-7 rounded cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </>
          )}

          {(overlay.type === 'logo' || overlay.type === 'image') && (
            <div>
              <label className="block text-[10px] text-surface-500 mb-1">Image URL</label>
              <input
                type="text"
                value={overlay.imageUrl || ''}
                onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] text-surface-500 mb-1">Layer (z-index)</label>
            <input
              type="number"
              value={overlay.layer}
              onChange={(e) => onUpdate({ layer: parseInt(e.target.value) })}
              min={0}
              max={100}
              className="w-20 bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
            />
          </div>
        </div>
      )}

      {activeTab === 'position' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-surface-500 mb-1">X</label>
              <input
                type="number"
                value={overlay.position.x}
                onChange={(e) => onUpdate({ position: { ...overlay.position, x: parseInt(e.target.value) } })}
                className="w-full bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-surface-500 mb-1">Y</label>
              <input
                type="number"
                value={overlay.position.y}
                onChange={(e) => onUpdate({ position: { ...overlay.position, y: parseInt(e.target.value) } })}
                className="w-full bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-surface-500 mb-1">Width</label>
              <input
                type="number"
                value={overlay.size.width}
                onChange={(e) => onUpdate({ size: { ...overlay.size, width: parseInt(e.target.value) } })}
                className="w-full bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-surface-500 mb-1">Height</label>
              <input
                type="number"
                value={overlay.size.height}
                onChange={(e) => onUpdate({ size: { ...overlay.size, height: parseInt(e.target.value) } })}
                className="w-full bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-surface-500 mb-1">Anchor</label>
            <div className="grid grid-cols-3 gap-1">
              {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as AnchorPosition[]).map((anchor) => (
                <button
                  key={anchor}
                  onClick={() => onUpdate({ position: { ...overlay.position, anchor } })}
                  className={`py-1 text-[9px] rounded transition-colors ${
                    overlay.position.anchor === anchor
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'bg-surface-700 text-surface-400 hover:text-white'
                  }`}
                >
                  {anchor.split('-').map(w => w[0].toUpperCase()).join('')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'style' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-surface-500 mb-1">Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={overlay.style.background || '#000000'}
                onChange={(e) => onUpdate({ style: { ...overlay.style, background: e.target.value } })}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={overlay.style.background || '#000000'}
                onChange={(e) => onUpdate({ style: { ...overlay.style, background: e.target.value } })}
                className="flex-1 bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-surface-500 mb-1">
              Opacity: {Math.round(overlay.style.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={overlay.style.opacity}
              onChange={(e) => onUpdate({ style: { ...overlay.style, opacity: parseFloat(e.target.value) } })}
              className="w-full h-1.5 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-surface-500 mb-1">Border Radius</label>
            <input
              type="number"
              value={overlay.style.borderRadius || 0}
              onChange={(e) => onUpdate({ style: { ...overlay.style, borderRadius: parseInt(e.target.value) } })}
              min={0}
              className="w-20 bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
            />
          </div>
        </div>
      )}

      {activeTab === 'animation' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-surface-500 mb-1">Enter Animation</label>
            <select
              value={overlay.animation.in}
              onChange={(e) => onUpdate({ animation: { ...overlay.animation, in: e.target.value as AnimationType } })}
              className="w-full bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
            >
              {['none', 'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom', 'bounce'].map((anim) => (
                <option key={anim} value={anim}>{anim}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-surface-500 mb-1">Exit Animation</label>
            <select
              value={overlay.animation.out}
              onChange={(e) => onUpdate({ animation: { ...overlay.animation, out: e.target.value as AnimationType } })}
              className="w-full bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
            >
              {['none', 'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom'].map((anim) => (
                <option key={anim} value={anim}>{anim}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-surface-500 mb-1">Duration: {overlay.animation.durationMs}ms</label>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={overlay.animation.durationMs}
              onChange={(e) => onUpdate({ animation: { ...overlay.animation, durationMs: parseInt(e.target.value) } })}
              className="w-full h-1.5 bg-surface-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-surface-500 mb-1">Auto-dismiss (ms, 0=never)</label>
            <input
              type="number"
              value={overlay.autoDismissMs || 0}
              onChange={(e) => onUpdate({ autoDismissMs: parseInt(e.target.value) || undefined })}
              min={0}
              step={500}
              className="w-24 bg-surface-700 border border-surface-600 rounded px-2.5 py-1.5 text-sm text-white"
            />
          </div>
        </div>
      )}

      {/* Export JSON button */}
      <button
        onClick={() => {
          const json = JSON.stringify(overlay, null, 2);
          navigator.clipboard.writeText(json);
        }}
        className="mt-3 w-full py-1.5 text-[10px] text-surface-400 hover:text-white bg-surface-700/50 hover:bg-surface-700 rounded transition-colors"
      >
        Copy JSON to Clipboard
      </button>
    </div>
  );
}

// ============================================================================
// QUICK ADD PANEL
// ============================================================================

interface QuickAddPanelProps {
  onAdd: (type: OverlayType) => void;
}

function QuickAddPanel({ onAdd }: QuickAddPanelProps) {
  return (
    <div>
      <h4 className="text-xs text-surface-500 mb-2 uppercase tracking-wider">Quick Add</h4>
      <div className="grid grid-cols-3 gap-1">
        {(['lower-third', 'logo', 'text', 'ticker', 'alert', 'countdown'] as OverlayType[]).map((type) => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="p-2 rounded bg-surface-800/50 hover:bg-surface-700/50 text-surface-500 hover:text-surface-300 transition-colors flex flex-col items-center gap-1"
          >
            {overlayTypeIcons[type]}
            <span className="text-[9px]">{overlayTypeLabels[type]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PRO OVERLAY EDITOR
// ============================================================================

export default function ProOverlayEditor({
  overlays,
  onToggle,
  onUpdate,
  onRemove,
  onAdd,
  onDuplicate,
  className = '',
}: ProOverlayEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const generateId = () => `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleQuickAdd = useCallback((type: OverlayType) => {
    let baseOverlay: Partial<Overlay> = {};
    
    if (type === 'lower-third') {
      baseOverlay = { ...DEFAULT_LOWER_THIRD };
    } else if (type === 'logo') {
      baseOverlay = { ...DEFAULT_LOGO };
    } else {
      baseOverlay = {
        version: '1.0',
        type,
        name: overlayTypeLabels[type],
        layer: 10,
        visible: false,
        position: { x: 100, y: 100, anchor: 'top-left' },
        size: { width: 300, height: 100 },
        style: { opacity: 1, borderRadius: 0 },
        animation: { in: 'fade', out: 'fade', durationMs: 300 },
      };
    }

    onAdd({
      ...baseOverlay,
      id: generateId(),
      type,
    } as Overlay);
  }, [onAdd]);

  const sortedOverlays = [...overlays].sort((a, b) => b.layer - a.layer);
  const editingOverlay = editingId ? overlays.find(o => o.id === editingId) : null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Overlays</h3>
        <span className="text-[10px] text-surface-500">{overlays.length} layers</span>
      </div>

      {/* Overlay list */}
      <div className="space-y-1.5">
        {sortedOverlays.map((overlay) => (
          <div key={overlay.id}>
            <OverlayListItem
              overlay={overlay}
              onToggle={() => onToggle(overlay.id)}
              onEdit={() => setEditingId(editingId === overlay.id ? null : overlay.id)}
              onDuplicate={() => onDuplicate(overlay.id)}
              onRemove={() => {
                if (editingId === overlay.id) setEditingId(null);
                onRemove(overlay.id);
              }}
              isEditing={editingId === overlay.id}
            />
            
            {/* Inline editor */}
            {editingId === overlay.id && editingOverlay && (
              <OverlayEditorPanel
                overlay={editingOverlay}
                onUpdate={(updates) => onUpdate(overlay.id, updates)}
                onClose={() => setEditingId(null)}
              />
            )}
          </div>
        ))}

        {overlays.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-surface-500">No overlays configured</p>
          </div>
        )}
      </div>

      {/* Quick add */}
      <QuickAddPanel onAdd={handleQuickAdd} />
    </div>
  );
}
