// ============================================================================
// COLLABORATIVE CONTROL SYSTEM
// Producer vs Host role-based control with real-time sync
// ============================================================================

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export type ParticipantRole = 'host' | 'producer' | 'co-host' | 'guest' | 'viewer';

export interface RolePermissions {
  // Composition control
  canSwitchCompositions: boolean;
  canEditCompositions: boolean;
  canCreateCompositions: boolean;
  canDeleteCompositions: boolean;
  
  // Overlay control
  canToggleOverlays: boolean;
  canEditOverlays: boolean;
  canCreateOverlays: boolean;
  canDeleteOverlays: boolean;
  
  // Audio control
  canControlOwnAudio: boolean;
  canControlAllAudio: boolean;
  canMuteOthers: boolean;
  canAccessMixer: boolean;
  
  // Video control
  canControlOwnVideo: boolean;
  canControlAllVideo: boolean;
  canChangeLayout: boolean;
  
  // Soundboard
  canPlaySounds: boolean;
  canEditSoundboard: boolean;
  
  // Stream control
  canStartStream: boolean;
  canStopStream: boolean;
  canChangeDestinations: boolean;
  
  // Settings
  canAccessSettings: boolean;
  canInviteParticipants: boolean;
  canRemoveParticipants: boolean;
  canChangeRoles: boolean;
  
  // Communication
  canUseIntercom: boolean;
  canSendAlerts: boolean;
  canPinMessages: boolean;
}

export const ROLE_PERMISSIONS: Record<ParticipantRole, RolePermissions> = {
  host: {
    canSwitchCompositions: true,
    canEditCompositions: true,
    canCreateCompositions: true,
    canDeleteCompositions: true,
    canToggleOverlays: true,
    canEditOverlays: true,
    canCreateOverlays: true,
    canDeleteOverlays: true,
    canControlOwnAudio: true,
    canControlAllAudio: true,
    canMuteOthers: true,
    canAccessMixer: true,
    canControlOwnVideo: true,
    canControlAllVideo: true,
    canChangeLayout: true,
    canPlaySounds: true,
    canEditSoundboard: true,
    canStartStream: true,
    canStopStream: true,
    canChangeDestinations: true,
    canAccessSettings: true,
    canInviteParticipants: true,
    canRemoveParticipants: true,
    canChangeRoles: true,
    canUseIntercom: true,
    canSendAlerts: true,
    canPinMessages: true,
  },
  
  producer: {
    canSwitchCompositions: true,
    canEditCompositions: true,
    canCreateCompositions: true,
    canDeleteCompositions: true,
    canToggleOverlays: true,
    canEditOverlays: true,
    canCreateOverlays: true,
    canDeleteOverlays: true,
    canControlOwnAudio: true,
    canControlAllAudio: true,
    canMuteOthers: true,
    canAccessMixer: true,
    canControlOwnVideo: true,
    canControlAllVideo: true,
    canChangeLayout: true,
    canPlaySounds: true,
    canEditSoundboard: true,
    canStartStream: true,
    canStopStream: true,
    canChangeDestinations: true,
    canAccessSettings: true,
    canInviteParticipants: true,
    canRemoveParticipants: true,
    canChangeRoles: false, // Only host can change roles
    canUseIntercom: true,
    canSendAlerts: true,
    canPinMessages: true,
  },
  
  'co-host': {
    canSwitchCompositions: true,
    canEditCompositions: false,
    canCreateCompositions: false,
    canDeleteCompositions: false,
    canToggleOverlays: true,
    canEditOverlays: false,
    canCreateOverlays: false,
    canDeleteOverlays: false,
    canControlOwnAudio: true,
    canControlAllAudio: false,
    canMuteOthers: false,
    canAccessMixer: true,
    canControlOwnVideo: true,
    canControlAllVideo: false,
    canChangeLayout: false,
    canPlaySounds: true,
    canEditSoundboard: false,
    canStartStream: false,
    canStopStream: false,
    canChangeDestinations: false,
    canAccessSettings: false,
    canInviteParticipants: false,
    canRemoveParticipants: false,
    canChangeRoles: false,
    canUseIntercom: true,
    canSendAlerts: true,
    canPinMessages: false,
  },
  
  guest: {
    canSwitchCompositions: false,
    canEditCompositions: false,
    canCreateCompositions: false,
    canDeleteCompositions: false,
    canToggleOverlays: false,
    canEditOverlays: false,
    canCreateOverlays: false,
    canDeleteOverlays: false,
    canControlOwnAudio: true,
    canControlAllAudio: false,
    canMuteOthers: false,
    canAccessMixer: false,
    canControlOwnVideo: true,
    canControlAllVideo: false,
    canChangeLayout: false,
    canPlaySounds: false,
    canEditSoundboard: false,
    canStartStream: false,
    canStopStream: false,
    canChangeDestinations: false,
    canAccessSettings: false,
    canInviteParticipants: false,
    canRemoveParticipants: false,
    canChangeRoles: false,
    canUseIntercom: true,
    canSendAlerts: false,
    canPinMessages: false,
  },
  
  viewer: {
    canSwitchCompositions: false,
    canEditCompositions: false,
    canCreateCompositions: false,
    canDeleteCompositions: false,
    canToggleOverlays: false,
    canEditOverlays: false,
    canCreateOverlays: false,
    canDeleteOverlays: false,
    canControlOwnAudio: false,
    canControlAllAudio: false,
    canMuteOthers: false,
    canAccessMixer: false,
    canControlOwnVideo: false,
    canControlAllVideo: false,
    canChangeLayout: false,
    canPlaySounds: false,
    canEditSoundboard: false,
    canStartStream: false,
    canStopStream: false,
    canChangeDestinations: false,
    canAccessSettings: false,
    canInviteParticipants: false,
    canRemoveParticipants: false,
    canChangeRoles: false,
    canUseIntercom: false,
    canSendAlerts: false,
    canPinMessages: false,
  },
};

// ============================================================================
// PARTICIPANT & SESSION TYPES
// ============================================================================

export interface CollaboratorParticipant {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  role: ParticipantRole;
  permissions: RolePermissions;
  
  // Connection state
  isConnected: boolean;
  lastSeen: string;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  
  // Media state
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  
  // Activity
  isActive: boolean;
  currentActivity?: ParticipantActivity;
}

export interface ParticipantActivity {
  type: 'editing-overlay' | 'editing-composition' | 'controlling-audio' | 'typing' | 'idle';
  targetId?: string;
  startedAt: string;
}

export interface CollaborativeSession {
  id: string;
  streamId: string;
  createdAt: string;
  createdBy: string;
  
  // Participants
  participants: CollaboratorParticipant[];
  maxParticipants: number;
  
  // Control mode
  controlMode: ControlMode;
  activeController: string | null;
  
  // Locks
  controlLocks: ControlLock[];
  
  // Intercom
  intercomEnabled: boolean;
  intercomChannel: string;
  
  // Settings
  settings: SessionSettings;
}

export type ControlMode = 
  | 'producer-controlled'  // Producer has full control, host focuses on content
  | 'host-controlled'      // Host has full control
  | 'shared'               // Both can control (with conflict resolution)
  | 'request-based';       // Must request control before making changes

export interface ControlLock {
  id: string;
  controlType: ControlType;
  resourceId?: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
  reason?: string;
}

export type ControlType = 
  | 'compositions'
  | 'overlays'
  | 'audio-mixer'
  | 'soundboard'
  | 'stream-controls'
  | 'overlay-specific'
  | 'composition-specific';

export interface SessionSettings {
  // Auto-release locks after inactivity
  autoReleaseLockMs: number;
  
  // Require confirmation for destructive actions
  requireConfirmation: boolean;
  
  // Allow guests to request control
  guestCanRequestControl: boolean;
  
  // Intercom settings
  intercomPushToTalk: boolean;
  intercomHotkey: string;
  
  // Notifications
  notifyOnJoin: boolean;
  notifyOnLeave: boolean;
  notifyOnControlChange: boolean;
}

// ============================================================================
// CONTROL REQUEST SYSTEM
// ============================================================================

export interface ControlRequest {
  id: string;
  requesterId: string;
  controlType: ControlType;
  resourceId?: string;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  respondedBy?: string;
  respondedAt?: string;
}

// ============================================================================
// INTERCOM / PRIVATE COMMUNICATION
// ============================================================================

export interface IntercomMessage {
  id: string;
  senderId: string;
  recipientId: string | 'all' | 'producers' | 'hosts';
  type: 'voice' | 'text' | 'alert' | 'cue';
  content?: string;
  timestamp: string;
  read: boolean;
}

export interface CueMessage {
  id: string;
  senderId: string;
  recipientId: string;
  cueType: 'standby' | 'go' | 'cut' | 'wrap' | 'stretch' | 'speed-up' | 'custom';
  customText?: string;
  priority: 'normal' | 'urgent';
  timestamp: string;
  acknowledged: boolean;
}

// ============================================================================
// COLLABORATIVE CONTROL ENGINE
// ============================================================================

export type CollaborativeEvent =
  | { type: 'participant-joined'; participant: CollaboratorParticipant }
  | { type: 'participant-left'; participantId: string }
  | { type: 'participant-updated'; participant: CollaboratorParticipant }
  | { type: 'control-locked'; lock: ControlLock }
  | { type: 'control-unlocked'; lockId: string }
  | { type: 'control-requested'; request: ControlRequest }
  | { type: 'control-request-responded'; request: ControlRequest }
  | { type: 'intercom-message'; message: IntercomMessage }
  | { type: 'cue-sent'; cue: CueMessage }
  | { type: 'cue-acknowledged'; cueId: string }
  | { type: 'control-mode-changed'; mode: ControlMode; by: string }
  | { type: 'session-settings-changed'; settings: SessionSettings };

type CollaborativeListener = (event: CollaborativeEvent) => void;

export class CollaborativeControlEngine {
  private session: CollaborativeSession | null = null;
  private localParticipantId: string | null = null;
  private listeners = new Set<CollaborativeListener>();
  private stateListeners = new Set<(session: CollaborativeSession | null) => void>();
  
  // Pending requests
  private pendingRequests = new Map<string, ControlRequest>();
  
  // Lock timers
  private lockTimers = new Map<string, ReturnType<typeof setTimeout>>();
  
  // WebSocket/Realtime connection (abstract)
  private sendMessage: ((msg: unknown) => void) | null = null;

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /**
   * Create a new collaborative session
   */
  createSession(
    streamId: string,
    creatorId: string,
    creatorName: string,
    creatorRole: ParticipantRole = 'host'
  ): CollaborativeSession {
    const now = new Date().toISOString();
    
    const creator: CollaboratorParticipant = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: creatorId,
      name: creatorName,
      role: creatorRole,
      permissions: ROLE_PERMISSIONS[creatorRole],
      isConnected: true,
      lastSeen: now,
      connectionQuality: 'excellent',
      audioEnabled: true,
      videoEnabled: true,
      screenShareEnabled: false,
      isActive: true,
    };
    
    this.localParticipantId = creator.id;
    
    this.session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      streamId,
      createdAt: now,
      createdBy: creator.id,
      participants: [creator],
      maxParticipants: 10,
      controlMode: creatorRole === 'producer' ? 'producer-controlled' : 'host-controlled',
      activeController: creator.id,
      controlLocks: [],
      intercomEnabled: true,
      intercomChannel: `intercom_${streamId}`,
      settings: {
        autoReleaseLockMs: 30000, // 30 seconds
        requireConfirmation: true,
        guestCanRequestControl: true,
        intercomPushToTalk: true,
        intercomHotkey: 'KeyT',
        notifyOnJoin: true,
        notifyOnLeave: true,
        notifyOnControlChange: true,
      },
    };
    
    this.emitState();
    return this.session;
  }

  /**
   * Join an existing session
   */
  joinSession(
    session: CollaborativeSession,
    userId: string,
    name: string,
    role: ParticipantRole
  ): CollaboratorParticipant {
    const now = new Date().toISOString();
    
    const participant: CollaboratorParticipant = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      name,
      role,
      permissions: ROLE_PERMISSIONS[role],
      isConnected: true,
      lastSeen: now,
      connectionQuality: 'excellent',
      audioEnabled: true,
      videoEnabled: role !== 'viewer',
      screenShareEnabled: false,
      isActive: true,
    };
    
    this.session = session;
    this.session.participants.push(participant);
    this.localParticipantId = participant.id;
    
    this.emitEvent({ type: 'participant-joined', participant });
    this.emitState();
    
    return participant;
  }

  /**
   * Leave the session
   */
  leaveSession(): void {
    if (!this.session || !this.localParticipantId) return;
    
    // Release all locks held by this participant
    this.releaseAllLocks(this.localParticipantId);
    
    // Remove from participants
    this.session.participants = this.session.participants.filter(
      p => p.id !== this.localParticipantId
    );
    
    this.emitEvent({ type: 'participant-left', participantId: this.localParticipantId });
    
    this.session = null;
    this.localParticipantId = null;
    this.emitState();
  }

  /**
   * Get current session
   */
  getSession(): CollaborativeSession | null {
    return this.session;
  }

  /**
   * Get local participant
   */
  getLocalParticipant(): CollaboratorParticipant | null {
    if (!this.session || !this.localParticipantId) return null;
    return this.session.participants.find(p => p.id === this.localParticipantId) || null;
  }

  // ===========================================================================
  // PERMISSION CHECKING
  // ===========================================================================

  /**
   * Check if local participant has a specific permission
   */
  hasPermission(permission: keyof RolePermissions): boolean {
    const local = this.getLocalParticipant();
    if (!local) return false;
    return local.permissions[permission];
  }

  /**
   * Check if local participant can control a specific resource
   */
  canControl(controlType: ControlType, resourceId?: string): boolean {
    const local = this.getLocalParticipant();
    if (!local) return false;
    
    // Check basic permissions
    const permissionMap: Record<ControlType, keyof RolePermissions> = {
      'compositions': 'canSwitchCompositions',
      'overlays': 'canToggleOverlays',
      'audio-mixer': 'canAccessMixer',
      'soundboard': 'canPlaySounds',
      'stream-controls': 'canStartStream',
      'overlay-specific': 'canEditOverlays',
      'composition-specific': 'canEditCompositions',
    };
    
    if (!local.permissions[permissionMap[controlType]]) {
      return false;
    }
    
    // Check control mode
    if (this.session?.controlMode === 'producer-controlled') {
      if (local.role !== 'producer' && local.role !== 'host') {
        return false;
      }
    }
    
    // Check locks
    const lock = this.findLock(controlType, resourceId);
    if (lock && lock.lockedBy !== this.localParticipantId) {
      return false;
    }
    
    return true;
  }

  // ===========================================================================
  // CONTROL LOCKING
  // ===========================================================================

  /**
   * Acquire a control lock
   */
  acquireLock(
    controlType: ControlType,
    resourceId?: string,
    reason?: string,
    durationMs: number = 30000
  ): ControlLock | null {
    if (!this.session || !this.localParticipantId) return null;
    if (!this.canControl(controlType, resourceId)) return null;
    
    const now = new Date();
    const expires = new Date(now.getTime() + durationMs);
    
    const lock: ControlLock = {
      id: `lock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      controlType,
      resourceId,
      lockedBy: this.localParticipantId,
      lockedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      reason,
    };
    
    // Remove any existing lock for this resource
    this.session.controlLocks = this.session.controlLocks.filter(
      l => !(l.controlType === controlType && l.resourceId === resourceId)
    );
    
    this.session.controlLocks.push(lock);
    
    // Set auto-release timer
    const timer = setTimeout(() => {
      this.releaseLock(lock.id);
    }, durationMs);
    this.lockTimers.set(lock.id, timer);
    
    this.emitEvent({ type: 'control-locked', lock });
    this.emitState();
    
    return lock;
  }

  /**
   * Release a control lock
   */
  releaseLock(lockId: string): void {
    if (!this.session) return;
    
    const lock = this.session.controlLocks.find(l => l.id === lockId);
    if (!lock) return;
    
    // Only owner or admin can release
    const local = this.getLocalParticipant();
    if (lock.lockedBy !== this.localParticipantId && 
        local?.role !== 'host' && local?.role !== 'producer') {
      return;
    }
    
    this.session.controlLocks = this.session.controlLocks.filter(l => l.id !== lockId);
    
    const timer = this.lockTimers.get(lockId);
    if (timer) {
      clearTimeout(timer);
      this.lockTimers.delete(lockId);
    }
    
    this.emitEvent({ type: 'control-unlocked', lockId });
    this.emitState();
  }

  /**
   * Release all locks held by a participant
   */
  private releaseAllLocks(participantId: string): void {
    if (!this.session) return;
    
    const locks = this.session.controlLocks.filter(l => l.lockedBy === participantId);
    locks.forEach(lock => this.releaseLock(lock.id));
  }

  /**
   * Find existing lock
   */
  private findLock(controlType: ControlType, resourceId?: string): ControlLock | null {
    if (!this.session) return null;
    
    return this.session.controlLocks.find(
      l => l.controlType === controlType && l.resourceId === resourceId
    ) || null;
  }

  /**
   * Get who has control of something
   */
  getControlOwner(controlType: ControlType, resourceId?: string): CollaboratorParticipant | null {
    const lock = this.findLock(controlType, resourceId);
    if (!lock) return null;
    
    return this.session?.participants.find(p => p.id === lock.lockedBy) || null;
  }

  // ===========================================================================
  // CONTROL REQUESTS
  // ===========================================================================

  /**
   * Request control of something
   */
  requestControl(
    controlType: ControlType,
    resourceId?: string,
    reason?: string
  ): ControlRequest | null {
    if (!this.session || !this.localParticipantId) return null;
    
    const request: ControlRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      requesterId: this.localParticipantId,
      controlType,
      resourceId,
      reason,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    
    this.pendingRequests.set(request.id, request);
    
    this.emitEvent({ type: 'control-requested', request });
    
    // Auto-expire after 30 seconds
    setTimeout(() => {
      const req = this.pendingRequests.get(request.id);
      if (req && req.status === 'pending') {
        req.status = 'expired';
        this.emitEvent({ type: 'control-request-responded', request: req });
        this.pendingRequests.delete(request.id);
      }
    }, 30000);
    
    return request;
  }

  /**
   * Respond to a control request
   */
  respondToRequest(requestId: string, approved: boolean): void {
    const request = this.pendingRequests.get(requestId);
    if (!request || request.status !== 'pending') return;
    
    const local = this.getLocalParticipant();
    if (!local || (local.role !== 'host' && local.role !== 'producer')) return;
    
    request.status = approved ? 'approved' : 'denied';
    request.respondedBy = this.localParticipantId!;
    request.respondedAt = new Date().toISOString();
    
    if (approved) {
      // Release existing lock and give control
      const existingLock = this.findLock(request.controlType, request.resourceId);
      if (existingLock) {
        this.releaseLock(existingLock.id);
      }
      
      // Note: The requester should acquire the lock themselves
    }
    
    this.emitEvent({ type: 'control-request-responded', request });
    this.pendingRequests.delete(requestId);
  }

  /**
   * Get pending requests
   */
  getPendingRequests(): ControlRequest[] {
    return Array.from(this.pendingRequests.values()).filter(r => r.status === 'pending');
  }

  // ===========================================================================
  // INTERCOM & CUES
  // ===========================================================================

  /**
   * Send intercom message
   */
  sendIntercomMessage(
    recipientId: string | 'all' | 'producers' | 'hosts',
    content: string,
    type: 'text' | 'voice' | 'alert' = 'text'
  ): IntercomMessage {
    const message: IntercomMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      senderId: this.localParticipantId!,
      recipientId,
      type,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    this.emitEvent({ type: 'intercom-message', message });
    return message;
  }

  /**
   * Send a cue to a participant
   */
  sendCue(
    recipientId: string,
    cueType: CueMessage['cueType'],
    customText?: string,
    priority: 'normal' | 'urgent' = 'normal'
  ): CueMessage {
    const cue: CueMessage = {
      id: `cue_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      senderId: this.localParticipantId!,
      recipientId,
      cueType,
      customText,
      priority,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    
    this.emitEvent({ type: 'cue-sent', cue });
    return cue;
  }

  /**
   * Acknowledge a cue
   */
  acknowledgeCue(cueId: string): void {
    this.emitEvent({ type: 'cue-acknowledged', cueId });
  }

  // ===========================================================================
  // CONTROL MODE
  // ===========================================================================

  /**
   * Change control mode
   */
  setControlMode(mode: ControlMode): void {
    if (!this.session || !this.localParticipantId) return;
    
    const local = this.getLocalParticipant();
    if (!local || (local.role !== 'host' && local.role !== 'producer')) return;
    
    this.session.controlMode = mode;
    
    this.emitEvent({ type: 'control-mode-changed', mode, by: this.localParticipantId });
    this.emitState();
  }

  // ===========================================================================
  // PARTICIPANT MANAGEMENT
  // ===========================================================================

  /**
   * Update participant role
   */
  updateParticipantRole(participantId: string, newRole: ParticipantRole): void {
    if (!this.session) return;
    
    const local = this.getLocalParticipant();
    if (!local?.permissions.canChangeRoles) return;
    
    const participant = this.session.participants.find(p => p.id === participantId);
    if (!participant) return;
    
    participant.role = newRole;
    participant.permissions = ROLE_PERMISSIONS[newRole];
    
    this.emitEvent({ type: 'participant-updated', participant });
    this.emitState();
  }

  /**
   * Remove participant
   */
  removeParticipant(participantId: string): void {
    if (!this.session) return;
    
    const local = this.getLocalParticipant();
    if (!local?.permissions.canRemoveParticipants) return;
    
    this.releaseAllLocks(participantId);
    this.session.participants = this.session.participants.filter(p => p.id !== participantId);
    
    this.emitEvent({ type: 'participant-left', participantId });
    this.emitState();
  }

  /**
   * Update activity status
   */
  setActivity(activity: ParticipantActivity | undefined): void {
    const local = this.getLocalParticipant();
    if (!local) return;
    
    local.currentActivity = activity;
    local.isActive = !!activity && activity.type !== 'idle';
    local.lastSeen = new Date().toISOString();
    
    this.emitEvent({ type: 'participant-updated', participant: local });
    this.emitState();
  }

  // ===========================================================================
  // EVENTS
  // ===========================================================================

  /**
   * Subscribe to events
   */
  onEvent(listener: CollaborativeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (session: CollaborativeSession | null) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.session);
    return () => this.stateListeners.delete(listener);
  }

  private emitEvent(event: CollaborativeEvent): void {
    this.listeners.forEach(l => l(event));
    
    // Also send over network if connected
    if (this.sendMessage) {
      this.sendMessage(event);
    }
  }

  private emitState(): void {
    this.stateListeners.forEach(l => l(this.session ? { ...this.session } : null));
  }

  // ===========================================================================
  // NETWORK INTEGRATION
  // ===========================================================================

  /**
   * Set the network send function (WebSocket, etc.)
   */
  setNetworkSender(sender: (msg: unknown) => void): void {
    this.sendMessage = sender;
  }

  /**
   * Handle incoming network message
   */
  handleNetworkMessage(event: CollaborativeEvent): void {
    // Update local state based on remote event
    switch (event.type) {
      case 'participant-joined':
        if (this.session) {
          const existing = this.session.participants.find(p => p.id === event.participant.id);
          if (!existing) {
            this.session.participants.push(event.participant);
          }
        }
        break;
        
      case 'participant-left':
        if (this.session) {
          this.session.participants = this.session.participants.filter(
            p => p.id !== event.participantId
          );
        }
        break;
        
      case 'control-locked':
        if (this.session) {
          this.session.controlLocks.push(event.lock);
        }
        break;
        
      case 'control-unlocked':
        if (this.session) {
          this.session.controlLocks = this.session.controlLocks.filter(
            l => l.id !== event.lockId
          );
        }
        break;
    }
    
    // Emit to local listeners
    this.listeners.forEach(l => l(event));
    this.emitState();
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  dispose(): void {
    this.lockTimers.forEach(timer => clearTimeout(timer));
    this.lockTimers.clear();
    this.pendingRequests.clear();
    this.listeners.clear();
    this.stateListeners.clear();
    this.session = null;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let collaborativeEngine: CollaborativeControlEngine | null = null;

export function getCollaborativeEngine(): CollaborativeControlEngine {
  if (!collaborativeEngine) {
    collaborativeEngine = new CollaborativeControlEngine();
  }
  return collaborativeEngine;
}

export function resetCollaborativeEngine(): void {
  if (collaborativeEngine) {
    collaborativeEngine.dispose();
  }
  collaborativeEngine = new CollaborativeControlEngine();
}
