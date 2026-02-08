"use client";

import { useState, useRef } from "react";
import { OverlayEngine } from "./OverlayEngine";

export function OverlayControlPanel({ engine }: { engine: OverlayEngine }) {
  const [logoOpacity, setLogoOpacity] = useState(0.8);
  const [logoScale, setLogoScale] = useState(0.15);
  const [chromaEnabled, setChromaEnabled] = useState(false);
  const [chromaThreshold, setChromaThreshold] = useState(150);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      engine.setLayer({
        id: "logo-main",
        type: "logo",
        zIndex: 100,
        enabled: true,
        data: {
          img,
          x: 20,
          y: 20,
          scale: logoScale,
          opacity: logoOpacity,
        },
      });
    };
    img.src = URL.createObjectURL(file);
  };

  const toggleChromaKey = () => {
    const newEnabled = !chromaEnabled;
    setChromaEnabled(newEnabled);
    
    if (newEnabled) {
      engine.setLayer({
        id: "chroma-main",
        type: "chroma",
        zIndex: 0,
        enabled: true,
        data: {
          threshold: chromaThreshold,
          smoothing: 2,
        },
      });
    } else {
      engine.toggle("chroma-main", false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-surface-800 rounded-lg border border-surface-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Overlays</h3>
        <span className="text-xs text-surface-400">F9-F10 shortcuts</span>
      </div>

      {/* Logo/Watermark */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-surface-300">
          Logo / Watermark
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded text-sm text-white hover:border-surface-600 transition-colors"
        >
          Upload Logo
        </button>

        <div>
          <label className="block text-xs text-surface-400 mb-1">Opacity</label>
          <input
            type="range"
            min="0"
            max="100"
            value={logoOpacity * 100}
            onChange={(e) => {
              const opacity = Number(e.target.value) / 100;
              setLogoOpacity(opacity);
              const layers = engine.getAllLayers();
              const logoLayer = layers.find(l => l.id === "logo-main");
              if (logoLayer) {
                engine.setLayer({
                  ...logoLayer,
                  data: { ...logoLayer.data, opacity },
                });
              }
            }}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-surface-400 mb-1">Scale</label>
          <input
            type="range"
            min="5"
            max="50"
            value={logoScale * 100}
            onChange={(e) => {
              const scale = Number(e.target.value) / 100;
              setLogoScale(scale);
              const layers = engine.getAllLayers();
              const logoLayer = layers.find(l => l.id === "logo-main");
              if (logoLayer) {
                engine.setLayer({
                  ...logoLayer,
                  data: { ...logoLayer.data, scale },
                });
              }
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Chroma Key */}
      <div className="space-y-3 pt-3 border-t border-surface-700">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-surface-300">
            Chroma Key (Green Screen)
          </label>
          <button
            onClick={toggleChromaKey}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              chromaEnabled
                ? 'bg-green-600 text-white'
                : 'bg-surface-700 text-surface-300'
            }`}
          >
            {chromaEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {chromaEnabled && (
          <div>
            <label className="block text-xs text-surface-400 mb-1">
              Sensitivity: {chromaThreshold}
            </label>
            <input
              type="range"
              min="50"
              max="255"
              value={chromaThreshold}
              onChange={(e) => {
                const threshold = Number(e.target.value);
                setChromaThreshold(threshold);
                engine.setLayer({
                  id: "chroma-main",
                  type: "chroma",
                  zIndex: 0,
                  enabled: true,
                  data: { threshold, smoothing: 2 },
                });
              }}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
