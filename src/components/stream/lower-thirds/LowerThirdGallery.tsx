'use client';

import { useState, useCallback } from 'react';
import { 
  LowerThirdStyle, 
  LowerThirdPayload, 
  LowerThirdPreset,
  LowerThirdAnimation,
  LowerThirdPosition,
  DEFAULT_COLORS,
  DEFAULT_FONT,
  ANIMATION_DURATIONS,
} from './types';
import { 
  LOWER_THIRD_STYLE_PRESETS, 
  LOWER_THIRD_PRESETS,
  getAllStylePresets,
  createPayloadFromPreset,
} from './presets';
import { LowerThirdEngine } from './LowerThirdEngine';

// ============================================================================
// STYLE OPTION CARD
// ============================================================================

interface StyleCardProps {
  preset: LowerThirdPreset;
  isSelected: boolean;
  onSelect: () => void;
}

function StyleCard({ preset, isSelected, onSelect }: StyleCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        relative p-3 rounded-lg border-2 text-left transition-all w-full
        ${isSelected 
          ? 'border-brand-500 bg-brand-500/10' 
          : 'border-surface-700 bg-surface-800/50 hover:border-surface-600'
        }
      `}
    >
      {/* Preview */}
      <div 
        className="h-12 rounded mb-2 flex items-end p-2"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <div 
          className="px-2 py-1 rounded text-[10px]"
          style={{ 
            backgroundColor: preset.colors.primary,
            borderLeft: `3px solid ${preset.colors.secondary}`,
            color: preset.colors.textPrimary,
          }}
        >
          <div style={{ fontWeight: preset.font.nameWeight }}>{preset.presetName}</div>
          <div 
            className="text-[8px]"
            style={{ color: preset.colors.textSecondary }}
          >
            Sample Title
          </div>
        </div>
      </div>
      
      {/* Label */}
      <p className="text-xs font-medium text-white">{preset.presetName}</p>
      <p className="text-[10px] text-surface-500 capitalize">{preset.animation}</p>
      
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ============================================================================
// ANIMATION SELECTOR
// ============================================================================

const ANIMATIONS: { id: LowerThirdAnimation; label: string; icon: string }[] = [
  { id: 'slide', label: 'Slide', icon: '➡️' },
  { id: 'fade', label: 'Fade', icon: '🌫️' },
  { id: 'pop', label: 'Pop', icon: '💥' },
  { id: 'wipe', label: 'Wipe', icon: '🎬' },
  { id: 'reveal', label: 'Reveal', icon: '📤' },
  { id: 'bounce', label: 'Bounce', icon: '⬆️' },
  { id: 'scale', label: 'Scale', icon: '↔️' },
  { id: 'bar-grow', label: 'Bar Grow', icon: '📊' },
];

// ============================================================================
// POSITION SELECTOR
// ============================================================================

const POSITIONS: { id: LowerThirdPosition; label: string }[] = [
  { id: 'top-left', label: '↖' },
  { id: 'top-center', label: '↑' },
  { id: 'top-right', label: '↗' },
  { id: 'bottom-left', label: '↙' },
  { id: 'bottom-center', label: '↓' },
  { id: 'bottom-right', label: '↘' },
];

// ============================================================================
// LOWER THIRD GALLERY COMPONENT
// ============================================================================

interface LowerThirdGalleryProps {
  engine: LowerThirdEngine;
  onClose?: () => void;
}

export function LowerThirdGallery({ engine, onClose }: LowerThirdGalleryProps) {
  const [selectedStyle, setSelectedStyle] = useState<LowerThirdStyle>('minimal');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [animation, setAnimation] = useState<LowerThirdAnimation>('slide');
  const [position, setPosition] = useState<LowerThirdPosition>('bottom-left');
  const [duration, setDuration] = useState(5000);
  const [persistent, setPersistent] = useState(false);
  
  // Color customization
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [showColorEditor, setShowColorEditor] = useState(false);
  
  const presets = getAllStylePresets();
  const selectedPreset = LOWER_THIRD_STYLE_PRESETS[selectedStyle];
  
  // When style changes, update colors and animation
  const handleStyleSelect = (style: LowerThirdStyle) => {
    setSelectedStyle(style);
    const preset = LOWER_THIRD_STYLE_PRESETS[style];
    setColors({ ...preset.colors });
    setAnimation(preset.animation);
    setPosition(preset.position);
    if (preset.duration) {
      setDuration(preset.duration);
      setPersistent(preset.duration === 0);
    }
  };
  
  const handleShow = useCallback(() => {
    if (!name) return;
    
    const payload: LowerThirdPayload = {
      id: `lt-${Date.now()}`,
      name,
      title: title || undefined,
      position,
      animation,
      animationDuration: ANIMATION_DURATIONS[animation],
      duration: persistent ? 0 : duration,
      style: selectedStyle,
      colors: { ...colors },
      font: { ...selectedPreset.font },
      showLogo: selectedPreset.showLogo,
    };
    
    engine.show(payload);
  }, [name, title, position, animation, selectedStyle, colors, duration, persistent, selectedPreset, engine]);
  
  const handleHide = useCallback(() => {
    engine.hide();
  }, [engine]);
  
  // Quick preset buttons (F keys)
  const handleQuickPreset = (key: string) => {
    const preset = LOWER_THIRD_PRESETS[key];
    if (preset) {
      engine.show(preset);
    }
  };
  
  return (
    <div className="bg-surface-900 rounded-xl border border-surface-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface-800 border-b border-surface-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Lower Thirds Gallery</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-500">F1-F8 for quick presets</span>
          {onClose && (
            <button onClick={onClose} className="text-surface-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Quick Presets Bar */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {Object.keys(LOWER_THIRD_PRESETS).map((key) => (
            <button
              key={key}
              onClick={() => handleQuickPreset(key)}
              className="px-2 py-1 bg-surface-700 hover:bg-surface-600 rounded text-[10px] font-mono text-surface-300 hover:text-white whitespace-nowrap"
            >
              {key}
            </button>
          ))}
        </div>
        
        {/* Style Gallery */}
        <div>
          <label className="text-xs font-medium text-surface-400 uppercase mb-2 block">Style</label>
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <StyleCard
                key={preset.presetId}
                preset={preset}
                isSelected={selectedStyle === preset.category}
                onSelect={() => handleStyleSelect(preset.category)}
              />
            ))}
          </div>
        </div>
        
        {/* Content Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1 block">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded text-sm text-white placeholder:text-surface-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-400 mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Host"
              className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded text-sm text-white placeholder:text-surface-500"
            />
          </div>
        </div>
        
        {/* Animation & Position */}
        <div className="grid grid-cols-2 gap-4">
          {/* Animation */}
          <div>
            <label className="text-xs font-medium text-surface-400 mb-2 block">Animation</label>
            <div className="grid grid-cols-4 gap-1">
              {ANIMATIONS.map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => setAnimation(anim.id)}
                  className={`px-2 py-1.5 rounded text-[10px] font-medium text-center ${
                    animation === anim.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                  }`}
                  title={anim.label}
                >
                  <span className="text-sm">{anim.icon}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Position */}
          <div>
            <label className="text-xs font-medium text-surface-400 mb-2 block">Position</label>
            <div className="grid grid-cols-3 gap-1 max-w-[120px]">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setPosition(pos.id)}
                  className={`w-8 h-8 rounded text-sm ${
                    position === pos.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Duration */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-surface-400">
            <input
              type="checkbox"
              checked={persistent}
              onChange={(e) => setPersistent(e.target.checked)}
              className="rounded border-surface-600 bg-surface-800 text-brand-500"
            />
            Persistent (no auto-hide)
          </label>
          
          {!persistent && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-surface-400">Duration:</label>
              <input
                type="number"
                min="1"
                max="60"
                value={duration / 1000}
                onChange={(e) => setDuration(Number(e.target.value) * 1000)}
                className="w-16 px-2 py-1 bg-surface-800 border border-surface-700 rounded text-xs text-white text-center"
              />
              <span className="text-xs text-surface-500">sec</span>
            </div>
          )}
        </div>
        
        {/* Color Customization */}
        <div>
          <button
            onClick={() => setShowColorEditor(!showColorEditor)}
            className="flex items-center gap-2 text-xs text-surface-400 hover:text-white"
          >
            <span>{showColorEditor ? '▼' : '▶'}</span>
            <span>Customize Colors</span>
          </button>
          
          {showColorEditor && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div>
                <label className="text-[10px] text-surface-500 block mb-1">Primary</label>
                <input
                  type="color"
                  value={colors.primary}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="w-full h-8 rounded bg-surface-800 border border-surface-700 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-surface-500 block mb-1">Accent</label>
                <input
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="w-full h-8 rounded bg-surface-800 border border-surface-700 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-surface-500 block mb-1">Name Text</label>
                <input
                  type="color"
                  value={colors.textPrimary}
                  onChange={(e) => setColors({ ...colors, textPrimary: e.target.value })}
                  className="w-full h-8 rounded bg-surface-800 border border-surface-700 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-surface-500 block mb-1">Title Text</label>
                <input
                  type="color"
                  value={colors.textSecondary}
                  onChange={(e) => setColors({ ...colors, textSecondary: e.target.value })}
                  className="w-full h-8 rounded bg-surface-800 border border-surface-700 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Preview */}
        <div className="h-24 bg-black rounded-lg relative overflow-hidden">
          {name && (
            <div 
              className="absolute bottom-3 left-3 px-3 py-2 rounded"
              style={{ 
                backgroundColor: colors.primary,
                borderLeft: `4px solid ${colors.secondary}`,
              }}
            >
              <div 
                className="text-sm font-semibold"
                style={{ color: colors.textPrimary, fontFamily: selectedPreset.font.family }}
              >
                {name}
              </div>
              {title && (
                <div 
                  className="text-xs"
                  style={{ color: colors.textSecondary, fontFamily: selectedPreset.font.family }}
                >
                  {title}
                </div>
              )}
            </div>
          )}
          {!name && (
            <div className="absolute inset-0 flex items-center justify-center text-surface-600 text-xs">
              Enter name to preview
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleShow}
            disabled={!name}
            className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
          >
            Show Lower Third
          </button>
          <button
            onClick={handleHide}
            className="px-4 py-2.5 bg-surface-700 hover:bg-surface-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}

export default LowerThirdGallery;
