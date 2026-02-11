"use client";

import { useState } from "react";
import { LowerThirdEngine } from "./LowerThirdEngine";
import { LowerThirdPosition, LowerThirdAnimation, LowerThirdStyle, DEFAULT_COLORS, DEFAULT_FONT } from "./types";

export function LowerThirdEditor({ engine }: { engine: LowerThirdEngine }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState<LowerThirdPosition>("bottom-left");
  const [animation, setAnimation] = useState<LowerThirdAnimation>("slide");
  const [duration, setDuration] = useState<number>(5000);
  const [style, setStyle] = useState<LowerThirdStyle>("news");

  return (
    <div className="space-y-4 p-4 bg-surface-800 rounded-lg border border-surface-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Lower Thirds</h3>
        <span className="text-xs text-surface-400">F1-F2 for presets</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1">
            Name
          </label>
          <input
            type="text"
            placeholder="John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1">
            Title
          </label>
          <input
            type="text"
            placeholder="Host"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as LowerThirdPosition)}
              className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-white focus:outline-none focus:border-primary-500"
            >
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Animation
            </label>
            <select
              value={animation}
              onChange={(e) => setAnimation(e.target.value as LowerThirdAnimation)}
              className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-white focus:outline-none focus:border-primary-500"
            >
              <option value="slide">Slide</option>
              <option value="fade">Fade</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1">
            Duration (seconds)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={duration / 1000}
            onChange={(e) => setDuration(Number(e.target.value) * 1000)}
            className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-white focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!name) return;
            engine.show({
              id: crypto.randomUUID(),
              name,
              title,
              position,
              animation,
              duration,
              style,
              colors: DEFAULT_COLORS,
              font: DEFAULT_FONT,
            });
          }}
          disabled={!name}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Show
        </button>
        <button
          onClick={() => engine.hide()}
          className="flex-1 px-4 py-2 bg-surface-700 text-white rounded font-medium hover:bg-surface-600 transition-colors"
        >
          Hide
        </button>
      </div>
    </div>
  );
}
