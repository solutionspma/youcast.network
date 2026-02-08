'use client';

import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface StreamControlsProps {
  isLive: boolean;
  isPreview: boolean;
  isConnecting: boolean;
  streamHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  onGoLive: () => void;
  onStopStream: () => void;
  onStartPreview: () => void;
  onStopPreview: () => void;
  onOpenSettings: () => void;
}

const healthConfig = {
  excellent: { color: 'bg-green-500', label: 'Excellent', textColor: 'text-green-400' },
  good: { color: 'bg-green-400', label: 'Good', textColor: 'text-green-400' },
  fair: { color: 'bg-yellow-500', label: 'Fair', textColor: 'text-yellow-400' },
  poor: { color: 'bg-red-500', label: 'Poor', textColor: 'text-red-400' },
  offline: { color: 'bg-surface-500', label: 'Offline', textColor: 'text-surface-400' },
};

export default function StreamControls({
  isLive,
  isPreview,
  isConnecting,
  streamHealth,
  onGoLive,
  onStopStream,
  onStartPreview,
  onStopPreview,
  onOpenSettings,
}: StreamControlsProps) {
  const health = healthConfig[streamHealth];

  return (
    <div className="space-y-4">
      {/* Main Controls */}
      <div className="flex items-center gap-3">
        {/* Go Live / Stop */}
        {isLive ? (
          <button
            onClick={onStopStream}
            className="flex-1 py-3 rounded-xl bg-live-600 hover:bg-live-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-live-500/25"
          >
            <span className="w-3 h-3 bg-white rounded-sm" />
            End Stream
          </button>
        ) : (
          <button
            onClick={onGoLive}
            disabled={isConnecting}
            className="flex-1 py-3 rounded-xl bg-live-500 hover:bg-live-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-live-500/25 animate-pulse-live"
          >
            {isConnecting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <span className="w-3 h-3 bg-white rounded-full" />
                Go Live
              </>
            )}
          </button>
        )}

        {/* Preview Toggle */}
        {!isLive && (
          <button
            onClick={isPreview ? onStopPreview : onStartPreview}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
              isPreview
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                : 'bg-surface-700 text-surface-300 hover:bg-surface-600 hover:text-white border border-surface-600'
            }`}
          >
            {isPreview ? 'Stop Preview' : 'Preview'}
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-12 h-12 rounded-xl bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-white flex items-center justify-center transition-colors border border-surface-600"
          title="Stream Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Stream Health */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${health.color} ${streamHealth !== 'offline' && isLive ? 'animate-pulse' : ''}`} />
          <span className="text-xs text-surface-400">Stream Health</span>
        </div>
        <span className={`text-xs font-medium ${health.textColor}`}>{health.label}</span>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button className="p-2 rounded-lg bg-surface-800/50 hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors flex flex-col items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px]">Screenshot</span>
        </button>
        <button className="p-2 rounded-lg bg-surface-800/50 hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors flex flex-col items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m0 2a2 2 0 00-2 2m2-2a2 2 0 012 2M3 6a2 2 0 012-2m0 0V2m12 2V2m0 2a2 2 0 012 2m-2-2a2 2 0 00-2 2m4 0a2 2 0 00-2-2m0 0V2m-5 18v2m0-2a2 2 0 01-2-2m2 2a2 2 0 002-2M7 20a2 2 0 002 2m-2-2a2 2 0 01-2-2m12 2a2 2 0 002 2m-2-2a2 2 0 01-2-2" />
          </svg>
          <span className="text-[10px]">Clip</span>
        </button>
        <button className="p-2 rounded-lg bg-surface-800/50 hover:bg-surface-700/50 text-surface-400 hover:text-white transition-colors flex flex-col items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-[10px]">Chat</span>
        </button>
      </div>
    </div>
  );
}
