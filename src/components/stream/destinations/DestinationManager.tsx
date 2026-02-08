"use client";

import { useState } from "react";
import { Destination } from "../overlays/types";

export function DestinationManager() {
  const [destinations, setDestinations] = useState<Destination[]>([
    {
      id: "yt-main",
      name: "YouTube",
      platform: "youtube",
      enabled: false,
      status: "idle",
    },
    {
      id: "tw-main",
      name: "Twitch",
      platform: "twitch",
      enabled: false,
      status: "idle",
    },
    {
      id: "fb-main",
      name: "Facebook Live",
      platform: "facebook",
      enabled: false,
      status: "idle",
    },
    {
      id: "li-main",
      name: "LinkedIn Live",
      platform: "linkedin",
      enabled: false,
      status: "idle",
    },
  ]);

  const toggleDestination = (id: string) => {
    setDestinations(prev =>
      prev.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      youtube: "📺",
      twitch: "🎮",
      facebook: "👥",
      linkedin: "💼",
      custom: "🔗",
    };
    return icons[platform] || "📡";
  };

  const activeCount = destinations.filter(d => d.enabled).length;

  return (
    <div className="space-y-4 p-4 bg-surface-800 rounded-lg border border-surface-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Stream Destinations</h3>
        <span className="text-xs text-surface-400">
          {activeCount} active
        </span>
      </div>

      <div className="space-y-2">
        {destinations.map(dest => (
          <div
            key={dest.id}
            className={`p-3 rounded-lg border transition-all ${
              dest.enabled
                ? 'bg-surface-700/50 border-primary-500/50'
                : 'bg-surface-900 border-surface-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getPlatformIcon(dest.platform)}</span>
                <div>
                  <div className="text-sm font-medium text-white">{dest.name}</div>
                  <div className="text-xs text-surface-400 capitalize">
                    {dest.status || 'idle'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleDestination(dest.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  dest.enabled
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                }`}
              >
                {dest.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {dest.enabled && (
              <div className="mt-2 pt-2 border-t border-surface-700">
                <button className="text-xs text-primary-400 hover:text-primary-300">
                  Configure RTMP →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-surface-700">
        <button className="w-full px-4 py-2 bg-surface-700 text-white rounded text-sm font-medium hover:bg-surface-600 transition-colors">
          + Add Custom RTMP
        </button>
      </div>

      {activeCount > 0 && (
        <div className="p-3 bg-primary-600/10 border border-primary-500/30 rounded-lg">
          <div className="text-xs text-primary-400">
            <strong>Multi-streaming active:</strong> Your stream will broadcast to {activeCount} destination{activeCount > 1 ? 's' : ''} simultaneously when you go live.
          </div>
        </div>
      )}
    </div>
  );
}
