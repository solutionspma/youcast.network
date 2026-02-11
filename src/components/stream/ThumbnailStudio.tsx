'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ThumbnailCanvas,
  ThumbnailLayer,
  TextLayer,
  ImageLayer,
  ShapeLayer,
  ThumbnailPlatform,
  PLATFORM_PRESETS,
  AVAILABLE_FONTS,
  DEFAULT_TEXT_STYLE,
} from '@/types/thumbnail';
import {
  DEFAULT_TEMPLATES,
  ThumbnailTemplate,
  TemplateCategory,
  templateLayerToCanvasLayer,
  getTemplatesByCategory,
} from '@/types/templates';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function createDefaultCanvas(platform: ThumbnailPlatform = 'youtube'): ThumbnailCanvas {
  const preset = PLATFORM_PRESETS.find(p => p.id === platform) || PLATFORM_PRESETS[0];
  return {
    id: generateId(),
    name: 'Untitled Thumbnail',
    platform,
    width: preset.width,
    height: preset.height,
    backgroundColor: '#1a1a2e',
    layers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

// ============================================================================
// LAYER PANEL COMPONENT
// ============================================================================

function LayerPanel({
  layers,
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onReorder,
  onDelete,
}: {
  layers: ThumbnailLayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      <div className="px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <span className="text-xs font-bold text-white">Layers</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">
            No layers yet. Add text, images, or shapes.
          </div>
        ) : (
          <div className="p-1 space-y-0.5">
            {[...layers].reverse().map((layer) => (
              <div
                key={layer.id}
                onClick={() => onSelect(layer.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  selectedId === layer.id
                    ? 'bg-brand-600/30 border border-brand-500/50'
                    : 'hover:bg-zinc-800 border border-transparent'
                }`}
              >
                {/* Type Icon */}
                <span className="text-sm">
                  {layer.type === 'text' && '📝'}
                  {layer.type === 'image' && '🖼️'}
                  {layer.type === 'shape' && '⬜'}
                  {layer.type === 'gradient' && '🌈'}
                </span>
                
                {/* Name */}
                <span className="flex-1 text-xs text-white truncate">{layer.name}</span>
                
                {/* Controls */}
                <div className="flex gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                    className={`w-5 h-5 rounded text-[10px] ${layer.visible ? 'text-zinc-300' : 'text-zinc-600'}`}
                  >
                    {layer.visible ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                    className={`w-5 h-5 rounded text-[10px] ${layer.locked ? 'text-yellow-500' : 'text-zinc-600'}`}
                  >
                    {layer.locked ? '🔒' : '🔓'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(layer.id); }}
                    className="w-5 h-5 rounded text-[10px] text-red-500 hover:text-red-400"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// INSPECTOR PANEL COMPONENT
// ============================================================================

function InspectorPanel({
  layer,
  onUpdate,
}: {
  layer: ThumbnailLayer | null;
  onUpdate: (id: string, updates: Partial<ThumbnailLayer>) => void;
}) {
  if (!layer) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 text-center">
        <span className="text-xs text-zinc-500">Select a layer to edit its properties</span>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    onUpdate(layer.id, { [key]: value });
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      <div className="px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <span className="text-xs font-bold text-white">Properties</span>
      </div>
      <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
        {/* Position */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase block mb-1">Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] text-zinc-600">X</span>
              <input
                type="number"
                value={Math.round(layer.x)}
                onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <span className="text-[9px] text-zinc-600">Y</span>
              <input
                type="number"
                value={Math.round(layer.y)}
                onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase block mb-1">Size</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] text-zinc-600">W</span>
              <input
                type="number"
                value={Math.round(layer.width)}
                onChange={(e) => handleChange('width', parseInt(e.target.value) || 100)}
                className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
              />
            </div>
            <div>
              <span className="text-[9px] text-zinc-600">H</span>
              <input
                type="number"
                value={Math.round(layer.height)}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || 100)}
                className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Rotation & Opacity */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Rotation</label>
            <input
              type="number"
              value={layer.rotation}
              onChange={(e) => handleChange('rotation', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={layer.opacity}
              onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Text-specific */}
        {layer.type === 'text' && (
          <>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase block mb-1">Text</label>
              <textarea
                value={(layer as TextLayer).content}
                onChange={(e) => handleChange('content', e.target.value)}
                rows={2}
                className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase block mb-1">Font</label>
              <select
                value={(layer as TextLayer).fontFamily}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
              >
                {AVAILABLE_FONTS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Size</label>
                <input
                  type="number"
                  value={(layer as TextLayer).fontSize}
                  onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || 24)}
                  className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Weight</label>
                <select
                  value={(layer as TextLayer).fontWeight}
                  onChange={(e) => handleChange('fontWeight', parseInt(e.target.value))}
                  className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
                >
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semi Bold</option>
                  <option value={700}>Bold</option>
                  <option value={800}>Extra Bold</option>
                  <option value={900}>Black</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Color</label>
                <input
                  type="color"
                  value={(layer as TextLayer).color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 uppercase block mb-1">Stroke</label>
                <input
                  type="color"
                  value={(layer as TextLayer).stroke || '#000000'}
                  onChange={(e) => handleChange('stroke', e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(layer as TextLayer).uppercase}
                  onChange={(e) => handleChange('uppercase', e.target.checked)}
                  className="rounded"
                />
                UPPERCASE
              </label>
            </div>
          </>
        )}

        {/* Shape-specific */}
        {layer.type === 'shape' && (
          <>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase block mb-1">Fill</label>
              <input
                type="color"
                value={(layer as ShapeLayer).fill}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase block mb-1">Corner Radius</label>
              <input
                type="number"
                value={(layer as ShapeLayer).cornerRadius || 0}
                onChange={(e) => handleChange('cornerRadius', parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CANVAS RENDERER
// ============================================================================

function CanvasRenderer({
  canvas,
  selectedId,
  onSelect,
  onLayerMove,
}: {
  canvas: ThumbnailCanvas;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLayerMove: (id: string, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; layerX: number; layerY: number } | null>(null);
  const loadedImages = useRef<Map<string, HTMLImageElement>>(new Map());

  // Calculate scale to fit container
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth - 40;
    const containerHeight = container.clientHeight - 40;
    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    setScale(Math.min(scaleX, scaleY, 1));
  }, [canvas.width, canvas.height]);

  // Render canvas
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Clear and fill background
    ctx.fillStyle = canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sort layers by zIndex
    const sortedLayers = [...canvas.layers].sort((a, b) => a.zIndex - b.zIndex);

    // Render each layer
    sortedLayers.forEach(layer => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-layer.width / 2, -layer.height / 2);

      if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        const text = textLayer.uppercase ? textLayer.content.toUpperCase() : textLayer.content;
        
        ctx.font = `${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
        ctx.textAlign = textLayer.align;
        ctx.textBaseline = 'top';
        
        // Stroke
        if (textLayer.stroke && textLayer.strokeWidth) {
          ctx.strokeStyle = textLayer.stroke;
          ctx.lineWidth = textLayer.strokeWidth;
          ctx.strokeText(text, textLayer.align === 'center' ? layer.width / 2 : textLayer.align === 'right' ? layer.width : 0, 0);
        }
        
        // Fill
        ctx.fillStyle = textLayer.color;
        ctx.fillText(text, textLayer.align === 'center' ? layer.width / 2 : textLayer.align === 'right' ? layer.width : 0, 0);
      }

      if (layer.type === 'shape') {
        const shapeLayer = layer as ShapeLayer;
        ctx.fillStyle = shapeLayer.fill;
        
        if (shapeLayer.shape === 'rectangle') {
          if (shapeLayer.cornerRadius) {
            ctx.beginPath();
            ctx.roundRect(0, 0, layer.width, layer.height, shapeLayer.cornerRadius);
            ctx.fill();
          } else {
            ctx.fillRect(0, 0, layer.width, layer.height);
          }
        } else if (shapeLayer.shape === 'circle') {
          ctx.beginPath();
          ctx.ellipse(layer.width / 2, layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (layer.type === 'image') {
        const imageLayer = layer as ImageLayer;
        const img = loadedImages.current.get(imageLayer.src);
        if (img) {
          ctx.drawImage(img, 0, 0, layer.width, layer.height);
        }
      }

      ctx.restore();

      // Selection highlight
      if (layer.id === selectedId) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4);
        ctx.setLineDash([]);
      }
    });
  }, [canvas, selectedId]);

  // Load images
  useEffect(() => {
    canvas.layers.forEach(layer => {
      if (layer.type === 'image') {
        const imageLayer = layer as ImageLayer;
        if (!loadedImages.current.has(imageLayer.src)) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            loadedImages.current.set(imageLayer.src, img);
            // Trigger re-render
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, 1, 1);
          };
          img.src = imageLayer.src;
        }
      }
    });
  }, [canvas.layers]);

  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Find clicked layer (reverse order for top-most)
    const sortedLayers = [...canvas.layers].sort((a, b) => b.zIndex - a.zIndex);
    const clicked = sortedLayers.find(layer => 
      !layer.locked &&
      x >= layer.x && x <= layer.x + layer.width &&
      y >= layer.y && y <= layer.y + layer.height
    );

    if (clicked) {
      onSelect(clicked.id);
      setDragging({
        id: clicked.id,
        startX: x,
        startY: y,
        layerX: clicked.x,
        layerY: clicked.y,
      });
    } else {
      onSelect(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const dx = x - dragging.startX;
    const dy = y - dragging.startY;

    onLayerMove(dragging.id, dragging.layerX + dx, dragging.layerY + dy);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden"
    >
      <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {/* Checkerboard pattern for transparency */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(45deg, #666 25%, transparent 25%), linear-gradient(-45deg, #666 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #666 75%), linear-gradient(-45deg, transparent 75%, #666 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        />
        <canvas
          ref={canvasRef}
          width={canvas.width}
          height={canvas.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative shadow-2xl cursor-default"
          style={{ cursor: dragging ? 'grabbing' : 'default' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN THUMBNAIL STUDIO COMPONENT
// ============================================================================

export default function ThumbnailStudio({ 
  className = '',
  streamId,
  channelId,
}: { 
  className?: string;
  streamId?: string;
  channelId?: string;
}) {
  const [canvas, setCanvas] = useState<ThumbnailCanvas>(() => createDefaultCanvas('youtube'));
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ past: ThumbnailCanvas[]; future: ThumbnailCanvas[] }>({ past: [], future: [] });
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<TemplateCategory | 'all'>('all');

  const selectedLayer = canvas.layers.find(l => l.id === selectedLayerId) || null;
  
  // Get filtered templates
  const filteredTemplates = templateFilter === 'all' 
    ? DEFAULT_TEMPLATES 
    : getTemplatesByCategory(templateFilter);

  // History management
  const pushHistory = useCallback(() => {
    setHistory(h => ({
      past: [...h.past.slice(-19), canvas],
      future: [],
    }));
  }, [canvas]);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      setCanvas(previous);
      return {
        past: h.past.slice(0, -1),
        future: [canvas, ...h.future],
      };
    });
  }, [canvas]);

  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      setCanvas(next);
      return {
        past: [...h.past, canvas],
        future: h.future.slice(1),
      };
    });
  }, [canvas]);

  // Apply a template to the canvas
  const applyTemplate = useCallback((template: ThumbnailTemplate) => {
    pushHistory();
    
    // Convert template layers to canvas layers
    const newLayers: ThumbnailLayer[] = template.layers.map((layer) => 
      templateLayerToCanvasLayer(layer, template.canvas.width, template.canvas.height)
    );
    
    // Find background layer for background color
    const bgLayer = template.layers.find(l => l.role === 'background');
    const bgColor = bgLayer?.fill || '#1a1a2e';
    
    setCanvas(c => ({
      ...c,
      name: `${template.name} - Custom`,
      width: template.canvas.width,
      height: template.canvas.height,
      backgroundColor: bgColor,
      layers: newLayers,
      updatedAt: new Date().toISOString(),
    }));
    
    setSelectedLayerId(null);
    setShowTemplates(false);
  }, [pushHistory]);

  // Layer operations
  const addTextLayer = () => {
    pushHistory();
    const newLayer: TextLayer = {
      ...DEFAULT_TEXT_STYLE,
      id: generateId(),
      name: `Text ${canvas.layers.filter(l => l.type === 'text').length + 1}`,
      x: canvas.width / 2 - 200,
      y: canvas.height / 2 - 40,
      width: 400,
      height: 80,
      zIndex: canvas.layers.length,
    };
    setCanvas(c => ({ ...c, layers: [...c.layers, newLayer], updatedAt: new Date().toISOString() }));
    setSelectedLayerId(newLayer.id);
  };

  const addShapeLayer = (shape: 'rectangle' | 'circle' = 'rectangle') => {
    pushHistory();
    const newLayer: ShapeLayer = {
      id: generateId(),
      type: 'shape',
      name: `Shape ${canvas.layers.filter(l => l.type === 'shape').length + 1}`,
      shape,
      x: canvas.width / 2 - 100,
      y: canvas.height / 2 - 100,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: canvas.layers.length,
      fill: '#ff6b6b',
      cornerRadius: shape === 'rectangle' ? 8 : 0,
    };
    setCanvas(c => ({ ...c, layers: [...c.layers, newLayer], updatedAt: new Date().toISOString() }));
    setSelectedLayerId(newLayer.id);
  };

  const addImageLayer = (src: string) => {
    pushHistory();
    const newLayer: ImageLayer = {
      id: generateId(),
      type: 'image',
      name: `Image ${canvas.layers.filter(l => l.type === 'image').length + 1}`,
      src,
      x: canvas.width / 2 - 150,
      y: canvas.height / 2 - 100,
      width: 300,
      height: 200,
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      zIndex: canvas.layers.length,
      mask: 'none',
    };
    setCanvas(c => ({ ...c, layers: [...c.layers, newLayer], updatedAt: new Date().toISOString() }));
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<ThumbnailLayer>) => {
    setCanvas(c => ({
      ...c,
      layers: c.layers.map(l => l.id === id ? { ...l, ...updates } as ThumbnailLayer : l),
      updatedAt: new Date().toISOString(),
    }));
  };

  const deleteLayer = (id: string) => {
    pushHistory();
    setCanvas(c => ({
      ...c,
      layers: c.layers.filter(l => l.id !== id),
      updatedAt: new Date().toISOString(),
    }));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const toggleVisibility = (id: string) => {
    setCanvas(c => ({
      ...c,
      layers: c.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l),
    }));
  };

  const toggleLock = (id: string) => {
    setCanvas(c => ({
      ...c,
      layers: c.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l),
    }));
  };

  const changePlatform = (platform: ThumbnailPlatform) => {
    const preset = PLATFORM_PRESETS.find(p => p.id === platform);
    if (preset) {
      pushHistory();
      setCanvas(c => ({
        ...c,
        platform,
        width: preset.width,
        height: preset.height,
        updatedAt: new Date().toISOString(),
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addImageLayer(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const exportCanvas = (format: 'png' | 'jpg' = 'png') => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Copy current canvas
    const sourceCanvas = document.querySelector('canvas');
    if (sourceCanvas) {
      ctx.drawImage(sourceCanvas, 0, 0);
    }

    const link = document.createElement('a');
    link.download = `${canvas.name}.${format}`;
    link.href = exportCanvas.toDataURL(`image/${format}`, format === 'jpg' ? 0.9 : undefined);
    link.click();
  };

  return (
    <div className={`thumbnail-studio flex flex-col h-full bg-zinc-950 ${className}`}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">🖼️ Thumbnail Studio</span>
          <span className="text-xs text-zinc-500">|</span>
          <select
            value={canvas.platform}
            onChange={(e) => changePlatform(e.target.value as ThumbnailPlatform)}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white"
          >
            {PLATFORM_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.width}×{p.height})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={history.past.length === 0}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-400 rounded text-xs"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={history.future.length === 0}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-400 rounded text-xs"
          >
            ↷ Redo
          </button>
          <span className="text-xs text-zinc-500">|</span>
          <button
            onClick={() => exportCanvas('png')}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
          >
            ⬇️ Export PNG
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Layers */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-2 p-2 bg-zinc-900/50 border-r border-zinc-800 overflow-y-auto">
          {/* Templates Button */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`w-full p-2 rounded text-center font-medium transition-colors ${
              showTemplates
                ? 'bg-brand-600 text-white'
                : 'bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:opacity-90'
            }`}
          >
            <span className="text-sm">✨ Templates</span>
          </button>

          {/* Template Browser */}
          {showTemplates && (
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <div className="px-2 py-1.5 bg-zinc-800 border-b border-zinc-700 flex items-center gap-1">
                <select
                  value={templateFilter}
                  onChange={(e) => setTemplateFilter(e.target.value as TemplateCategory | 'all')}
                  className="flex-1 text-[10px] bg-zinc-700 border-none rounded px-1 py-0.5 text-white"
                >
                  <option value="all">All Templates</option>
                  <option value="podcast">Podcast</option>
                  <option value="reaction">Reaction</option>
                  <option value="education">Education</option>
                  <option value="church">Church</option>
                  <option value="business">Business</option>
                  <option value="short-form">Short Form</option>
                  <option value="emergency">Breaking News</option>
                </select>
              </div>
              <div className="max-h-48 overflow-y-auto p-1.5 space-y-1.5">
                {filteredTemplates.map((template) => {
                  const bgLayer = template.layers.find(l => l.role === 'background');
                  return (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="w-full p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-left transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <div 
                          className="w-12 h-8 rounded flex-shrink-0 flex items-center justify-center text-[8px] text-white/60"
                          style={{ backgroundColor: bgLayer?.fill || '#1a1a2e' }}
                        >
                          {template.category.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-medium text-white truncate group-hover:text-brand-400">
                            {template.name}
                          </div>
                          <div className="text-[9px] text-zinc-500 truncate">
                            {template.layers.length} layers
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Buttons */}
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={addTextLayer}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-center"
            >
              <span className="block text-lg">📝</span>
              <span className="text-[9px] text-zinc-400">Text</span>
            </button>
            <label className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-center cursor-pointer">
              <span className="block text-lg">🖼️</span>
              <span className="text-[9px] text-zinc-400">Image</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <button
              onClick={() => addShapeLayer('rectangle')}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-center"
            >
              <span className="block text-lg">⬜</span>
              <span className="text-[9px] text-zinc-400">Rectangle</span>
            </button>
            <button
              onClick={() => addShapeLayer('circle')}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-center"
            >
              <span className="block text-lg">⭕</span>
              <span className="text-[9px] text-zinc-400">Circle</span>
            </button>
          </div>

          {/* Layer Panel */}
          <LayerPanel
            layers={canvas.layers}
            selectedId={selectedLayerId}
            onSelect={setSelectedLayerId}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
            onReorder={() => {}}
            onDelete={deleteLayer}
          />

          {/* Background Color */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-2">
            <label className="text-[10px] text-zinc-500 uppercase block mb-1">Background</label>
            <input
              type="color"
              value={canvas.backgroundColor}
              onChange={(e) => {
                pushHistory();
                setCanvas(c => ({ ...c, backgroundColor: e.target.value }));
              }}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Canvas Area */}
        <CanvasRenderer
          canvas={canvas}
          selectedId={selectedLayerId}
          onSelect={setSelectedLayerId}
          onLayerMove={(id, x, y) => updateLayer(id, { x, y })}
        />

        {/* Right Panel - Inspector */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-2 p-2 bg-zinc-900/50 border-l border-zinc-800 overflow-y-auto">
          <InspectorPanel
            layer={selectedLayer}
            onUpdate={updateLayer}
          />

          {/* Canvas Info */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-2">
            <div className="text-[10px] text-zinc-500 uppercase mb-1">Canvas</div>
            <div className="text-xs text-white">{canvas.width} × {canvas.height}</div>
            <div className="text-[10px] text-zinc-500">{canvas.layers.length} layers</div>
          </div>

          {/* Quick Templates */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-2">
            <div className="text-[10px] text-zinc-500 uppercase mb-2">Quick Styles</div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { name: 'Bold', bg: '#ff0000', text: '#ffffff' },
                { name: 'Clean', bg: '#ffffff', text: '#000000' },
                { name: 'Dark', bg: '#0a0a0a', text: '#ffffff' },
                { name: 'Neon', bg: '#0f0f23', text: '#00ff88' },
              ].map(style => (
                <button
                  key={style.name}
                  onClick={() => {
                    pushHistory();
                    setCanvas(c => ({ ...c, backgroundColor: style.bg }));
                    if (selectedLayerId && selectedLayer?.type === 'text') {
                      updateLayer(selectedLayerId, { color: style.text });
                    }
                  }}
                  className="p-1.5 rounded text-[9px] border border-zinc-700 hover:border-zinc-500"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
