'use client';

import { useState, useCallback } from 'react';
import StreamPreview from '@/components/stream/StreamPreview';
import InputManager from '@/components/stream/InputManager';
import SceneSwitcher from '@/components/stream/SceneSwitcher';
import AudioMixer from '@/components/stream/AudioMixer';
import OverlayEditor from '@/components/stream/OverlayEditor';
import StreamControls from '@/components/stream/StreamControls';
import StreamChat from '@/components/stream/StreamChat';
import Badge from '@/components/ui/Badge';

// ——— Mock Data ———
type MockInput = { id: string; name: string; type: 'camera' | 'screen' | 'audio' | 'media'; status: 'active' | 'inactive' | 'error' };

const initialInputs: MockInput[] = [
  { id: 'cam-1', name: 'Main Camera', type: 'camera', status: 'active' },
  { id: 'cam-2', name: 'Wide Angle', type: 'camera', status: 'inactive' },
  { id: 'screen-1', name: 'Screen Share', type: 'screen', status: 'inactive' },
  { id: 'audio-1', name: 'USB Microphone', type: 'audio', status: 'active' },
  { id: 'media-1', name: 'Intro Video', type: 'media', status: 'inactive' },
];

const initialScenes = [
  { id: 'scene-1', name: 'Main Camera', layout: 'single' as const, sourceCount: 2 },
  { id: 'scene-2', name: 'Split Screen', layout: 'split' as const, sourceCount: 2 },
  { id: 'scene-3', name: 'Picture-in-Picture', layout: 'pip' as const, sourceCount: 2 },
  { id: 'scene-4', name: 'Full Grid', layout: 'grid' as const, sourceCount: 4 },
  { id: 'scene-5', name: 'Screen + Cam', layout: 'custom' as const, sourceCount: 2 },
  { id: 'scene-6', name: 'Starting Soon', layout: 'single' as const, sourceCount: 1 },
];

const initialAudioChannels = [
  { id: 'mic-1', name: 'USB Microphone', type: 'microphone' as const, level: 75, muted: false, peakLevel: 62 },
  { id: 'desktop-1', name: 'Desktop Audio', type: 'desktop' as const, level: 50, muted: false, peakLevel: 45 },
  { id: 'media-1', name: 'Media Player', type: 'media' as const, level: 40, muted: true, peakLevel: 0 },
  { id: 'music-1', name: 'Background Music', type: 'music' as const, level: 20, muted: false, peakLevel: 18 },
];

const initialOverlays = [
  { id: 'lt-1', name: 'Host Name Card', type: 'lower_third' as const, visible: true, position: { x: 10, y: 80 } },
  { id: 'logo-1', name: 'Youcast Logo', type: 'logo' as const, visible: true, position: { x: 90, y: 5 } },
  { id: 'ticker-1', name: 'News Ticker', type: 'ticker' as const, visible: false, position: { x: 0, y: 95 } },
  { id: 'alert-1', name: 'Sub Alerts', type: 'alert' as const, visible: false, position: { x: 50, y: 20 } },
];

const mockChatMessages = [
  { id: '1', username: 'ViewerPro', message: 'Great stream! Love the setup 🔥', timestamp: '2m ago', type: 'message' as const },
  { id: '2', username: 'System', message: 'Stream started', timestamp: '5m ago', type: 'system' as const },
  { id: '3', username: 'ModeratorX', message: 'Welcome everyone! Remember to follow the rules.', timestamp: '4m ago', type: 'moderator' as const },
  { id: '4', username: 'SuperFan', message: 'Amazing content as always!', timestamp: '3m ago', type: 'superchat' as const, amount: 10 },
  { id: '5', username: 'TechGuru', message: 'What mic are you using?', timestamp: '2m ago', type: 'message' as const },
  { id: '6', username: 'NewViewer', message: 'First time here, this is incredible', timestamp: '1m ago', type: 'message' as const },
  { id: '7', username: 'StreamLover', message: 'Can you show the overlay setup?', timestamp: '30s ago', type: 'message' as const },
];

// ——— Active Panel Tabs ———
type RightPanel = 'chat' | 'overlays';
type LeftPanel = 'sources' | 'scenes' | 'audio';

export default function StreamStudioPage() {
  // State
  const [isLive, setIsLive] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState('scene-1');
  const [previewSceneId, setPreviewSceneId] = useState<string | null>(null);
  const [transitionType, setTransitionType] = useState<'cut' | 'fade' | 'slide' | 'zoom'>('cut');
  const [inputs, setInputs] = useState(initialInputs);
  const [audioChannels, setAudioChannels] = useState(initialAudioChannels);
  const [overlays, setOverlays] = useState(initialOverlays);
  const [masterVolume, setMasterVolume] = useState(80);
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('sources');
  const [rightPanel, setRightPanel] = useState<RightPanel>('chat');
  const [duration, setDuration] = useState('00:00:00');

  // Handlers
  const handleGoLive = useCallback(() => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsLive(true);
      setIsPreview(false);
    }, 2000);
  }, []);

  const handleStopStream = useCallback(() => {
    setIsLive(false);
  }, []);

  const handleStartPreview = useCallback(() => setIsPreview(true), []);
  const handleStopPreview = useCallback(() => setIsPreview(false), []);

  const handleSwitchScene = useCallback((id: string) => {
    setActiveSceneId(id);
    setPreviewSceneId(null);
  }, []);

  const handleVolumeChange = useCallback((id: string, level: number) => {
    setAudioChannels(prev => prev.map(ch => ch.id === id ? { ...ch, level } : ch));
  }, []);

  const handleMuteToggle = useCallback((id: string) => {
    setAudioChannels(prev => prev.map(ch => ch.id === id ? { ...ch, muted: !ch.muted, peakLevel: !ch.muted ? 0 : ch.level * 0.8 } : ch));
  }, []);

  const handleToggleInput = useCallback((id: string) => {
    setInputs(prev => prev.map(inp => inp.id === id ? { ...inp, status: inp.status === 'active' ? 'inactive' as const : 'active' as const } : inp));
  }, []);

  const handleToggleOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, visible: !o.visible } : o));
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    setChatMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      username: 'You (Host)',
      message,
      timestamp: 'now',
      type: 'moderator' as const,
    }]);
  }, []);

  const activeScene = initialScenes.find(s => s.id === activeSceneId);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 -mt-0">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-900 border-b border-surface-700/50">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-white">Stream Studio</h1>
          {isLive && <Badge variant="live" size="sm">LIVE</Badge>}
          {isPreview && !isLive && <Badge variant="warning" size="sm">PREVIEW</Badge>}
          {!isLive && !isPreview && <Badge variant="default" size="sm">OFFLINE</Badge>}
        </div>
        <div className="flex items-center gap-4 text-xs text-surface-400">
          {isLive && (
            <>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                1,247
              </span>
              <span className="font-mono">{duration}</span>
            </>
          )}
          <span className="text-surface-500">youcast.network/live/my-channel</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Sources / Scenes / Audio */}
        <div className="w-64 bg-surface-900/80 border-r border-surface-700/50 flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b border-surface-700/50">
            {(['sources', 'scenes', 'audio'] as LeftPanel[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftPanel(tab)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                  leftPanel === tab
                    ? 'text-white border-b-2 border-brand-500 bg-surface-800/50'
                    : 'text-surface-500 hover:text-surface-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {leftPanel === 'sources' && (
              <InputManager
                inputs={inputs}
                onAddInput={() => {}}
                onRemoveInput={(id) => setInputs(prev => prev.filter(i => i.id !== id))}
                onToggleInput={handleToggleInput}
              />
            )}
            {leftPanel === 'scenes' && (
              <SceneSwitcher
                scenes={initialScenes}
                activeSceneId={activeSceneId}
                previewSceneId={previewSceneId}
                onSwitchScene={handleSwitchScene}
                onPreviewScene={setPreviewSceneId}
                onAddScene={() => {}}
                transitionType={transitionType}
                onTransitionChange={setTransitionType}
              />
            )}
            {leftPanel === 'audio' && (
              <AudioMixer
                channels={audioChannels}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
                masterVolume={masterVolume}
                onMasterVolumeChange={setMasterVolume}
              />
            )}
          </div>
        </div>

        {/* Center — Preview + Controls */}
        <div className="flex-1 flex flex-col bg-surface-950 p-4 overflow-y-auto">
          {/* Stream Preview */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <StreamPreview
                isLive={isLive}
                isPreview={isPreview}
                viewerCount={1247}
                duration={duration}
                activeScene={activeScene?.name || 'None'}
              />
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="mt-4 max-w-md mx-auto w-full">
            <StreamControls
              isLive={isLive}
              isPreview={isPreview}
              isConnecting={isConnecting}
              streamHealth={isLive ? 'excellent' : 'offline'}
              onGoLive={handleGoLive}
              onStopStream={handleStopStream}
              onStartPreview={handleStartPreview}
              onStopPreview={handleStopPreview}
              onOpenSettings={() => {}}
            />
          </div>
        </div>

        {/* Right Sidebar — Chat / Overlays */}
        <div className="w-80 bg-surface-900/80 border-l border-surface-700/50 flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b border-surface-700/50">
            {(['chat', 'overlays'] as RightPanel[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanel(tab)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                  rightPanel === tab
                    ? 'text-white border-b-2 border-brand-500 bg-surface-800/50'
                    : 'text-surface-500 hover:text-surface-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'chat' && (
              <StreamChat
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                viewerCount={1247}
                isLive={isLive}
              />
            )}
            {rightPanel === 'overlays' && (
              <div className="p-3 overflow-y-auto h-full">
                <OverlayEditor
                  overlays={overlays}
                  onToggleOverlay={handleToggleOverlay}
                  onAddOverlay={() => {}}
                  onRemoveOverlay={(id) => setOverlays(prev => prev.filter(o => o.id !== id))}
                  onEditOverlay={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
