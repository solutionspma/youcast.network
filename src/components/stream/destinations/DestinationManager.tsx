"use client";

import { useState } from "react";
import { Destination } from "../overlays/types";

interface RTMPConfig {
  url: string;
  streamKey: string;
}

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

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [rtmpConfigs, setRtmpConfigs] = useState<Record<string, RTMPConfig>>({});
  const [tempConfig, setTempConfig] = useState<RTMPConfig>({ url: "", streamKey: "" });

  const toggleDestination = (id: string) => {
    setDestinations(prev =>
      prev.map(d => (d.id === id ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const openConfigModal = (destId: string) => {
    setSelectedDestId(destId);
    const existingConfig = rtmpConfigs[destId];
    setTempConfig(existingConfig || { url: "", streamKey: "" });
    setShowConfigModal(true);
  };

  const closeConfigModal = () => {
    setShowConfigModal(false);
    setSelectedDestId(null);
    setTempConfig({ url: "", streamKey: "" });
  };

  const saveRtmpConfig = () => {
    if (selectedDestId && tempConfig.url && tempConfig.streamKey) {
      setRtmpConfigs(prev => ({
        ...prev,
        [selectedDestId]: tempConfig,
      }));
      // Update destination with RTMP config
      setDestinations(prev =>
        prev.map(d =>
          d.id === selectedDestId
            ? { ...d, rtmpUrl: tempConfig.url, streamKey: tempConfig.streamKey }
            : d
        )
      );
      closeConfigModal();
    }
  };

  const addCustomDestination = () => {
    const newId = `custom-${Date.now()}`;
    const newDest: Destination = {
      id: newId,
      name: "Custom RTMP",
      platform: "custom",
      enabled: false,
      status: "idle",
    };
    setDestinations(prev => [...prev, newDest]);
    openConfigModal(newId);
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
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => openConfigModal(dest.id)}
                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    {rtmpConfigs[dest.id] ? "Edit RTMP →" : "Configure RTMP →"}
                  </button>
                  {rtmpConfigs[dest.id] && (
                    <span className="text-xs text-green-500">✓ Configured</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-surface-700">
        <button
          onClick={addCustomDestination}
          className="w-full px-4 py-2 bg-surface-700 text-white rounded text-sm font-medium hover:bg-surface-600 transition-colors"
        >
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

      {/* RTMP Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-lg border border-surface-700 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Configure RTMP
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  RTMP Server URL
                </label>
                <input
                  type="text"
                  value={tempConfig.url}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="rtmp://live.example.com/app"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-surface-400">
                  Example: rtmp://live.youtube.com/app
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Stream Key
                </label>
                <input
                  type="password"
                  value={tempConfig.streamKey}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, streamKey: e.target.value }))}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-surface-900 border border-surface-700 rounded text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-surface-400">
                  Find this in your platform&apos;s streaming settings
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeConfigModal}
                  className="px-4 py-2 bg-surface-700 text-white rounded text-sm font-medium hover:bg-surface-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRtmpConfig}
                  disabled={!tempConfig.url || !tempConfig.streamKey}
                  className="px-4 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
