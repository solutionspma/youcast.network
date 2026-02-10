// ============================================================================
// STREAMING TYPES - Tier Limits, VOD, Admin Controls
// ============================================================================

// User Tiers
export type UserTier = 'guest' | 'free' | 'creator' | 'pro' | 'enterprise';

export interface TierLimits {
  tier: UserTier;
  maxStreamDuration: number;        // seconds, -1 = unlimited
  maxSessionsPerWeek: number;       // -1 = unlimited
  maxStorageMB: number;             // MB of VOD storage
  vodRetentionDays: number;         // days before auto-delete
  maxOverlays: number;
  maxDestinations: number;          // simultaneous RTMP outputs
  externalRtmpEnabled: boolean;
  aiEnabled: boolean;
  analyticsEnabled: boolean;
  customBrandingEnabled: boolean;
  multiStreamEnabled: boolean;
  maxBitrate: number;               // kbps
  maxResolution: '720p' | '1080p' | '1440p' | '4k';
  templatesAccess: 'basic' | 'pro' | 'all';
  priorityTranscoding: boolean;
}

// Tier configurations - SERVER ENFORCED
export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  guest: {
    tier: 'guest',
    maxStreamDuration: 900,           // 15 minutes
    maxSessionsPerWeek: 1,
    maxStorageMB: 0,                  // No VOD storage
    vodRetentionDays: 0,
    maxOverlays: 1,
    maxDestinations: 0,               // No external RTMP
    externalRtmpEnabled: false,
    aiEnabled: false,
    analyticsEnabled: false,
    customBrandingEnabled: false,
    multiStreamEnabled: false,
    maxBitrate: 2500,
    maxResolution: '720p',
    templatesAccess: 'basic',
    priorityTranscoding: false,
  },
  free: {
    tier: 'free',
    maxStreamDuration: 3600,          // 1 hour
    maxSessionsPerWeek: 5,
    maxStorageMB: 500,                // 500MB
    vodRetentionDays: 7,
    maxOverlays: 3,
    maxDestinations: 0,               // No external RTMP
    externalRtmpEnabled: false,
    aiEnabled: false,
    analyticsEnabled: true,
    customBrandingEnabled: false,
    multiStreamEnabled: false,
    maxBitrate: 4000,
    maxResolution: '1080p',
    templatesAccess: 'basic',
    priorityTranscoding: false,
  },
  creator: {
    tier: 'creator',
    maxStreamDuration: 14400,         // 4 hours
    maxSessionsPerWeek: -1,           // Unlimited
    maxStorageMB: 10240,              // 10GB
    vodRetentionDays: 30,
    maxOverlays: 10,
    maxDestinations: 2,               // 2 simultaneous RTMP
    externalRtmpEnabled: true,
    aiEnabled: true,
    analyticsEnabled: true,
    customBrandingEnabled: true,
    multiStreamEnabled: true,
    maxBitrate: 6000,
    maxResolution: '1080p',
    templatesAccess: 'pro',
    priorityTranscoding: false,
  },
  pro: {
    tier: 'pro',
    maxStreamDuration: -1,            // Unlimited
    maxSessionsPerWeek: -1,
    maxStorageMB: 102400,             // 100GB
    vodRetentionDays: 90,
    maxOverlays: -1,                  // Unlimited
    maxDestinations: 5,
    externalRtmpEnabled: true,
    aiEnabled: true,
    analyticsEnabled: true,
    customBrandingEnabled: true,
    multiStreamEnabled: true,
    maxBitrate: 10000,
    maxResolution: '1440p',
    templatesAccess: 'all',
    priorityTranscoding: true,
  },
  enterprise: {
    tier: 'enterprise',
    maxStreamDuration: -1,
    maxSessionsPerWeek: -1,
    maxStorageMB: -1,                 // Unlimited
    vodRetentionDays: 365,
    maxOverlays: -1,
    maxDestinations: -1,              // Unlimited
    externalRtmpEnabled: true,
    aiEnabled: true,
    analyticsEnabled: true,
    customBrandingEnabled: true,
    multiStreamEnabled: true,
    maxBitrate: 20000,
    maxResolution: '4k',
    templatesAccess: 'all',
    priorityTranscoding: true,
  },
};

// ============================================================================
// VOD (Video on Demand) Types
// ============================================================================

export type VODStatus = 'recording' | 'processing' | 'ready' | 'failed' | 'deleted';
export type VODVisibility = 'public' | 'unlisted' | 'private';

export interface VODMetadata {
  id: string;
  streamId: string;
  userId: string;
  channelId: string;
  
  // Content info
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number;               // seconds
  
  // Status
  status: VODStatus;
  visibility: VODVisibility;
  
  // Storage
  storageUrl: string;
  storageBucket: string;
  fileSizeMB: number;
  format: 'mp4' | 'webm' | 'hls';
  
  // Quality variants
  qualities: VODQuality[];
  
  // Engagement
  viewCount: number;
  likeCount: number;
  commentCount: number;
  
  // Timestamps
  recordedAt: string;
  processedAt?: string;
  expiresAt?: string;             // Auto-delete date based on tier
  createdAt: string;
  updatedAt: string;
}

export interface VODQuality {
  resolution: string;             // '1080p', '720p', '480p'
  bitrate: number;                // kbps
  url: string;
  codec: string;
}

// ============================================================================
// Admin Control Types
// ============================================================================

export interface AdminUser {
  email: string;
  role: 'master' | 'admin' | 'moderator';
  permissions: AdminPermission[];
}

export type AdminPermission = 
  | 'view_all_users'
  | 'view_all_streams'
  | 'view_all_activity'
  | 'impersonate_user'
  | 'kill_stream'
  | 'disable_destination'
  | 'suspend_account'
  | 'ban_account'
  | 'edit_tiers'
  | 'manage_admins'
  | 'view_revenue'
  | 'manage_marketplace';

// Master admin list - NEVER modify on client side
export const MASTER_ADMINS = [
  'solutions@pitchmarketing.agency',
];

export interface AdminAction {
  id: string;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'stream' | 'vod' | 'destination' | 'account';
  targetId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  reversible: boolean;
}

export interface StreamKillRequest {
  streamId: string;
  reason: string;
  adminEmail: string;
  notifyUser: boolean;
}

export interface AccountSuspension {
  userId: string;
  reason: string;
  duration?: number;              // hours, undefined = permanent
  adminEmail: string;
  suspendedAt: string;
  expiresAt?: string;
}

// ============================================================================
// Trending Types
// ============================================================================

export interface TrendingStream {
  id: string;
  title: string;
  thumbnailUrl?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  viewCount: number;
  likeCount: number;
  isLive: boolean;
  duration?: number;              // For VODs
  category?: string;
  tags?: string[];
  startedAt?: string;             // For live streams
  recordedAt?: string;            // For VODs
  trendScore: number;             // Calculated trending score
}

export interface TrendingQuery {
  timeWindow: '1h' | '24h' | '7d' | '30d';
  category?: string;
  includeVODs: boolean;
  includeLive: boolean;
  excludePrivate: boolean;
  limit: number;
  offset: number;
}

// ============================================================================
// Stream Session Tracking (for tier enforcement)
// ============================================================================

export interface StreamSession {
  id: string;
  userId: string;
  streamId: string;
  tier: UserTier;
  startedAt: string;
  endedAt?: string;
  duration: number;               // seconds
  wasKilled: boolean;
  killReason?: string;
  limitsApplied: TierLimits;
}

export interface StreamLimitViolation {
  type: 'duration' | 'sessions' | 'bitrate' | 'resolution' | 'destinations';
  limit: number;
  actual: number;
  enforced: boolean;
  timestamp: string;
}
