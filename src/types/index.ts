// ─── User & Auth Types ───────────────────────────────────────────────
export type UserRole = 'viewer' | 'creator' | 'admin' | 'network_operator';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  metadata: Record<string, unknown>;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// ─── Channel Types ───────────────────────────────────────────────────
export interface Channel {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  banner_url: string | null;
  subscriber_count: number;
  is_verified: boolean;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  settings: ChannelSettings;
}

export interface ChannelSettings {
  is_public: boolean;
  allow_comments: boolean;
  default_visibility: 'public' | 'unlisted' | 'private';
  monetization_enabled: boolean;
  custom_branding: Record<string, unknown>;
}

// ─── Media Types ─────────────────────────────────────────────────────
export type MediaType = 'video' | 'audio' | 'live_stream' | 'clip';
export type MediaStatus = 'draft' | 'processing' | 'published' | 'archived' | 'failed';
export type MediaVisibility = 'public' | 'unlisted' | 'private' | 'subscribers_only';

export interface MediaItem {
  id: string;
  channel_id: string;
  title: string;
  description: string;
  type: MediaType;
  status: MediaStatus;
  visibility: MediaVisibility;
  thumbnail_url: string | null;
  media_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  like_count: number;
  tags: string[];
  category: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: MediaMetadata;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  bitrate?: number;
  codec?: string;
  format?: string;
  file_size_bytes?: number;
  storage_provider?: string;
  storage_path?: string;
  cdn_url?: string;
  transcoding_status?: 'pending' | 'processing' | 'complete' | 'failed';
}

// ─── Streaming Types ─────────────────────────────────────────────────
export type StreamStatus = 'idle' | 'connecting' | 'live' | 'ending' | 'ended' | 'error';
export type InputType = 'camera' | 'screen' | 'audio' | 'external' | 'browser';
export type ConnectionType = 'usb' | 'wifi' | 'bluetooth' | 'network' | 'browser';

export interface StreamSession {
  id: string;
  channel_id: string;
  title: string;
  description: string;
  status: StreamStatus;
  started_at: string | null;
  ended_at: string | null;
  viewer_count: number;
  peak_viewer_count: number;
  stream_key: string;
  ingest_url: string;
  playback_url: string | null;
  recording_enabled: boolean;
  settings: StreamSettings;
}

export interface StreamSettings {
  resolution: '720p' | '1080p' | '4k';
  framerate: 30 | 60;
  bitrate: number;
  audio_bitrate: number;
  low_latency: boolean;
  dvr_enabled: boolean;
}

export interface StreamInput {
  id: string;
  type: InputType;
  connection: ConnectionType;
  label: string;
  device_id: string;
  is_active: boolean;
  is_muted: boolean;
  volume: number;
  video_settings?: {
    width: number;
    height: number;
    framerate: number;
  };
  audio_settings?: {
    sample_rate: number;
    channels: number;
  };
}

export interface StreamScene {
  id: string;
  name: string;
  layout: SceneLayout;
  sources: SceneSource[];
  is_active: boolean;
  transition: 'cut' | 'fade' | 'slide' | 'zoom';
  transition_duration: number;
}

export type SceneLayout = 'single' | 'side_by_side' | 'pip' | 'grid_2x2' | 'grid_3x3' | 'custom';

export interface SceneSource {
  input_id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  z_index: number;
  crop?: { top: number; bottom: number; left: number; right: number };
  opacity: number;
}

export interface StreamOverlay {
  id: string;
  type: 'lower_third' | 'logo' | 'text' | 'image' | 'ticker' | 'timer';
  content: Record<string, string>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  is_visible: boolean;
  style: Record<string, string>;
  animation: 'none' | 'fade' | 'slide_left' | 'slide_right' | 'slide_up';
}

// ─── Analytics Types ─────────────────────────────────────────────────
export interface AnalyticsOverview {
  total_views: number;
  total_watch_time_hours: number;
  subscriber_count: number;
  subscriber_growth: number;
  revenue: number;
  top_content: MediaItem[];
  view_trend: DataPoint[];
  subscriber_trend: DataPoint[];
}

export interface DataPoint {
  date: string;
  value: number;
}

// ─── Monetization Types ──────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface MonetizationConfig {
  enabled: boolean;
  tier: SubscriptionTier;
  features: string[];
  price_monthly: number;
  price_yearly: number;
  usage_limits: {
    storage_gb: number;
    bandwidth_gb: number;
    streams_per_month: number;
    team_members: number;
  };
}

// ─── API Types ───────────────────────────────────────────────────────
export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  permissions: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ─── Notification Types ──────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

// ─── Feature Flag Types ──────────────────────────────────────────────
export interface FeatureFlags {
  streaming: boolean;
  monetization: boolean;
  whitelabel: boolean;
  api_access: boolean;
  [key: string]: boolean;
}
