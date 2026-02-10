'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getCollaborativeEngine,
  CollaborativeSession,
  CollaboratorParticipant,
  ParticipantRole,
  ControlRequest,
  ROLE_PERMISSIONS,
  CueMessage,
} from '@/lib/streamStudio/CollaborativeControl';

// ============================================================================
// ROLE BADGE
// ============================================================================

interface RoleBadgeProps {
  role: ParticipantRole;
  size?: 'sm' | 'md';
  className?: string;
}

const ROLE_COLORS: Record<ParticipantRole, { bg: string; text: string; icon: string }> = {
  host: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '👑' },
  producer: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🎬' },
  'co-host': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: '🎙️' },
  guest: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '👤' },
  viewer: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', icon: '👁️' },
};

export function RoleBadge({ role, size = 'md', className = '' }: RoleBadgeProps) {
  const colors = ROLE_COLORS[role];
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';
  
  return (
    <span className={`inline-flex items-center gap-1 ${colors.bg} ${colors.text} rounded font-medium ${sizeClasses} ${className}`}>
      <span>{colors.icon}</span>
      <span className="capitalize">{role}</span>
    </span>
  );
}

// ============================================================================
// PARTICIPANT AVATAR
// ============================================================================

interface ParticipantAvatarProps {
  participant: CollaboratorParticipant;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  showActivity?: boolean;
}

export function ParticipantAvatar({ 
  participant, 
  size = 'md',
  showStatus = true,
  showActivity = false,
}: ParticipantAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  
  const statusSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  const getStatusColor = () => {
    if (!participant.isConnected) return 'bg-zinc-500';
    switch (participant.connectionQuality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      default: return 'bg-zinc-500';
    }
  };
  
  const getActivityColor = () => {
    if (!participant.isActive) return '';
    switch (participant.currentActivity?.type) {
      case 'editing-overlay': return 'ring-2 ring-blue-500';
      case 'editing-composition': return 'ring-2 ring-purple-500';
      case 'controlling-audio': return 'ring-2 ring-green-500';
      default: return '';
    }
  };
  
  return (
    <div className="relative">
      {participant.avatar ? (
        <img 
          src={participant.avatar} 
          alt={participant.name}
          className={`${sizeClasses[size]} rounded-full object-cover ${showActivity ? getActivityColor() : ''}`}
        />
      ) : (
        <div className={`${sizeClasses[size]} rounded-full bg-zinc-700 flex items-center justify-center font-medium text-white ${showActivity ? getActivityColor() : ''}`}>
          {participant.name.charAt(0).toUpperCase()}
        </div>
      )}
      
      {showStatus && (
        <div 
          className={`absolute -bottom-0.5 -right-0.5 ${statusSize[size]} rounded-full border-2 border-zinc-900 ${getStatusColor()}`}
        />
      )}
      
      {/* Audio/Video indicators */}
      {!participant.audioEnabled && (
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px]">
          🔇
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PARTICIPANT LIST
// ============================================================================

interface ParticipantListProps {
  compact?: boolean;
  onParticipantClick?: (participant: CollaboratorParticipant) => void;
}

export function ParticipantList({ compact = false, onParticipantClick }: ParticipantListProps) {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    return engine.subscribe(setSession);
  }, []);
  
  if (!session) return null;
  
  if (compact) {
    return (
      <div className="flex items-center -space-x-2">
        {session.participants.slice(0, 4).map(p => (
          <ParticipantAvatar key={p.id} participant={p} size="sm" />
        ))}
        {session.participants.length > 4 && (
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 border-2 border-zinc-900">
            +{session.participants.length - 4}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {session.participants.map(participant => (
        <div 
          key={participant.id}
          onClick={() => onParticipantClick?.(participant)}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
        >
          <ParticipantAvatar participant={participant} showActivity />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">
                {participant.name}
              </span>
              <RoleBadge role={participant.role} size="sm" />
            </div>
            
            {participant.currentActivity && participant.currentActivity.type !== 'idle' && (
              <div className="text-xs text-zinc-500">
                {participant.currentActivity.type.replace(/-/g, ' ')}
              </div>
            )}
          </div>
          
          {/* Media indicators */}
          <div className="flex items-center gap-1">
            <span className={participant.audioEnabled ? 'text-green-400' : 'text-red-400'}>
              {participant.audioEnabled ? '🎤' : '🔇'}
            </span>
            <span className={participant.videoEnabled ? 'text-green-400' : 'text-red-400'}>
              {participant.videoEnabled ? '📷' : '📷'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CONTROL LOCK INDICATOR
// ============================================================================

interface ControlLockIndicatorProps {
  controlType: string;
  resourceId?: string;
  className?: string;
}

export function ControlLockIndicator({ controlType, resourceId, className = '' }: ControlLockIndicatorProps) {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    return engine.subscribe(setSession);
  }, []);
  
  const lock = session?.controlLocks.find(
    l => l.controlType === controlType && l.resourceId === resourceId
  );
  
  if (!lock) return null;
  
  const owner = session?.participants.find(p => p.id === lock.lockedBy);
  const isLocal = lock.lockedBy === getCollaborativeEngine().getLocalParticipant()?.id;
  
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      {isLocal ? (
        <span className="text-green-400">🔓 You</span>
      ) : (
        <>
          <span className="text-yellow-400">🔒</span>
          <span className="text-zinc-400">{owner?.name || 'Someone'}</span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// CONTROL REQUEST PANEL
// ============================================================================

export function ControlRequestPanel() {
  const [requests, setRequests] = useState<ControlRequest[]>([]);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    
    const handleEvent = (event: { type: string }) => {
      if (event.type === 'control-requested' || event.type === 'control-request-responded') {
        setRequests(engine.getPendingRequests());
      }
    };
    
    return engine.onEvent(handleEvent);
  }, []);
  
  const handleResponse = (requestId: string, approved: boolean) => {
    getCollaborativeEngine().respondToRequest(requestId, approved);
  };
  
  if (requests.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Control Requests</h3>
      
      {requests.map(request => {
        const session = getCollaborativeEngine().getSession();
        const requester = session?.participants.find(p => p.id === request.requesterId);
        
        return (
          <div key={request.id} className="bg-zinc-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              {requester && <ParticipantAvatar participant={requester} size="sm" />}
              <span className="text-sm text-white">{requester?.name}</span>
            </div>
            
            <p className="text-xs text-zinc-400">
              Requesting control of <span className="text-white">{request.controlType}</span>
              {request.reason && <span> — {request.reason}</span>}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResponse(request.id, true)}
                className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded"
              >
                Approve
              </button>
              <button
                onClick={() => handleResponse(request.id, false)}
                className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded"
              >
                Deny
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// CUE PANEL
// ============================================================================

interface CuePanelProps {
  recipientId?: string;
  className?: string;
}

const CUE_TYPES = [
  { type: 'standby' as const, label: 'Standby', color: 'bg-yellow-500', icon: '⏸️' },
  { type: 'go' as const, label: 'GO!', color: 'bg-green-500', icon: '▶️' },
  { type: 'cut' as const, label: 'CUT', color: 'bg-red-500', icon: '✂️' },
  { type: 'wrap' as const, label: 'Wrap', color: 'bg-orange-500', icon: '🔄' },
  { type: 'stretch' as const, label: 'Stretch', color: 'bg-blue-500', icon: '⏳' },
  { type: 'speed-up' as const, label: 'Speed Up', color: 'bg-purple-500', icon: '⏩' },
];

export function CuePanel({ recipientId, className = '' }: CuePanelProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<string>(recipientId || '');
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    return engine.subscribe(setSession);
  }, []);
  
  const sendCue = (cueType: CueMessage['cueType']) => {
    if (!selectedRecipient) return;
    getCollaborativeEngine().sendCue(selectedRecipient, cueType);
  };
  
  const nonViewers = session?.participants.filter(p => p.role !== 'viewer') || [];
  
  return (
    <div className={`bg-zinc-800 rounded-lg p-4 space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-white">Send Cue</h3>
      
      {!recipientId && (
        <select
          value={selectedRecipient}
          onChange={(e) => setSelectedRecipient(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-white"
        >
          <option value="">Select recipient...</option>
          {nonViewers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}
      
      <div className="grid grid-cols-3 gap-2">
        {CUE_TYPES.map(cue => (
          <button
            key={cue.type}
            onClick={() => sendCue(cue.type)}
            disabled={!selectedRecipient}
            className={`${cue.color} disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 text-white text-xs font-bold py-3 rounded flex flex-col items-center gap-1`}
          >
            <span className="text-lg">{cue.icon}</span>
            <span>{cue.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CUE DISPLAY (for recipients)
// ============================================================================

export function CueDisplay() {
  const [activeCue, setActiveCue] = useState<CueMessage | null>(null);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    const localId = engine.getLocalParticipant()?.id;
    
    const handleEvent = (event: { type: string; cue?: CueMessage }) => {
      if (event.type === 'cue-sent' && event.cue) {
        if (event.cue.recipientId === localId) {
          setActiveCue(event.cue);
          
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setActiveCue(current => current?.id === event.cue?.id ? null : current);
          }, 5000);
        }
      }
    };
    
    return engine.onEvent(handleEvent);
  }, []);
  
  const acknowledgeCue = () => {
    if (activeCue) {
      getCollaborativeEngine().acknowledgeCue(activeCue.id);
      setActiveCue(null);
    }
  };
  
  if (!activeCue) return null;
  
  const cueConfig = CUE_TYPES.find(c => c.type === activeCue.cueType);
  
  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm`}
      onClick={acknowledgeCue}
    >
      <div className={`${cueConfig?.color || 'bg-zinc-600'} px-16 py-12 rounded-2xl text-center animate-pulse cursor-pointer`}>
        <div className="text-6xl mb-4">{cueConfig?.icon}</div>
        <div className="text-4xl font-black text-white">{cueConfig?.label}</div>
        {activeCue.customText && (
          <div className="text-xl text-white/80 mt-2">{activeCue.customText}</div>
        )}
        <div className="text-sm text-white/60 mt-4">Click to dismiss</div>
      </div>
    </div>
  );
}

// ============================================================================
// CONTROL MODE SELECTOR
// ============================================================================

const CONTROL_MODES = [
  { value: 'producer-controlled' as const, label: 'Producer Controls', desc: 'Producer has full control of the show' },
  { value: 'host-controlled' as const, label: 'Host Controls', desc: 'Host manages their own show' },
  { value: 'shared' as const, label: 'Shared Control', desc: 'Both can make changes' },
  { value: 'request-based' as const, label: 'Request-Based', desc: 'Must request before changes' },
];

export function ControlModeSelector({ className = '' }: { className?: string }) {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    return engine.subscribe(setSession);
  }, []);
  
  const handleChange = (mode: typeof CONTROL_MODES[0]['value']) => {
    getCollaborativeEngine().setControlMode(mode);
  };
  
  const local = getCollaborativeEngine().getLocalParticipant();
  const canChange = local?.role === 'host' || local?.role === 'producer';
  
  if (!session) return null;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-semibold text-zinc-400 uppercase">Control Mode</label>
      
      <div className="space-y-1">
        {CONTROL_MODES.map(mode => (
          <button
            key={mode.value}
            onClick={() => canChange && handleChange(mode.value)}
            disabled={!canChange}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${
              session.controlMode === mode.value
                ? 'bg-blue-600/20 border border-blue-500'
                : 'bg-zinc-800 border border-transparent hover:bg-zinc-700'
            } ${!canChange ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-sm font-medium text-white">{mode.label}</div>
            <div className="text-xs text-zinc-400">{mode.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// INTERCOM BUTTON (Push-to-Talk)
// ============================================================================

interface IntercomButtonProps {
  className?: string;
}

export function IntercomButton({ className = '' }: IntercomButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    return engine.subscribe(setSession);
  }, []);
  
  // Keyboard handler for push-to-talk
  useEffect(() => {
    if (!session?.settings.intercomPushToTalk) return;
    
    const hotkey = session.settings.intercomHotkey;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === hotkey && !e.repeat) {
        setIsPressed(true);
        // Start transmitting (would integrate with WebRTC)
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === hotkey) {
        setIsPressed(false);
        // Stop transmitting
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [session]);
  
  const local = getCollaborativeEngine().getLocalParticipant();
  if (!local?.permissions.canUseIntercom) return null;
  
  return (
    <button
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
        isPressed
          ? 'bg-red-500 text-white scale-105'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
      } ${className}`}
    >
      <span className="text-lg">🎙️</span>
      <span>Intercom</span>
      {session?.settings.intercomPushToTalk && (
        <span className="text-xs text-zinc-500">({session.settings.intercomHotkey.replace('Key', '')})</span>
      )}
      
      {isPressed && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}
    </button>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useCollaborativeSession() {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    return engine.subscribe(setSession);
  }, []);
  
  return session;
}

export function useCanControl(controlType: string, resourceId?: string): boolean {
  const session = useCollaborativeSession();
  const [canControl, setCanControl] = useState(true);
  
  useEffect(() => {
    const engine = getCollaborativeEngine();
    setCanControl(engine.canControl(controlType as any, resourceId));
  }, [session, controlType, resourceId]);
  
  return canControl;
}

export function useLocalParticipant(): CollaboratorParticipant | null {
  const session = useCollaborativeSession();
  
  if (!session) return null;
  const engine = getCollaborativeEngine();
  return engine.getLocalParticipant();
}
