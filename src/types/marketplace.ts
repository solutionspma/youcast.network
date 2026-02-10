// ============================================================================
// PRESET MARKETPLACE FORMAT
// Portable, versioned specification for sharing/selling stream presets
// ============================================================================

/**
 * Marketplace Preset Manifest
 * The root object in a .youcast-preset package
 */
export interface PresetManifest {
  /** Always "youcast-preset" */
  format: 'youcast-preset';
  
  /** Manifest version */
  version: '1.0';
  
  /** Unique package identifier (reverse-dns style) */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Short description (max 280 chars) */
  description: string;
  
  /** Long description (markdown supported) */
  longDescription?: string;
  
  /** Preset category */
  category: PresetCategory;
  
  /** Searchable tags */
  tags: string[];
  
  /** Version number (semver) */
  presetVersion: string;
  
  /** Author information */
  author: PresetAuthor;
  
  /** License */
  license: PresetLicense;
  
  /** Pricing (null = free) */
  pricing: PresetPricing | null;
  
  /** Preview assets */
  preview: PresetPreview;
  
  /** Compatibility requirements */
  compatibility: PresetCompatibility;
  
  /** What's included */
  contents: PresetContents;
  
  /** Installation instructions */
  installation?: string;
  
  /** Changelog */
  changelog?: PresetChangelog[];
  
  /** Package metadata */
  meta: PresetMeta;
}

// ============================================================================
// AUTHOR & LICENSING
// ============================================================================

export interface PresetAuthor {
  name: string;
  username?: string;        // YouCast username
  url?: string;             // Personal/portfolio URL
  avatar?: string;          // Avatar URL
  verified?: boolean;       // Verified creator badge
  supportEmail?: string;
}

export interface PresetLicense {
  /** SPDX identifier or custom */
  type: 'CC0' | 'CC-BY' | 'CC-BY-NC' | 'CC-BY-SA' | 'proprietary' | 'custom';
  
  /** Full license text (for custom) */
  text?: string;
  
  /** What buyers can do */
  permissions: LicensePermission[];
  
  /** What buyers cannot do */
  restrictions: LicenseRestriction[];
}

export type LicensePermission = 
  | 'commercial-use'      // Can use in monetized streams
  | 'modification'        // Can modify the preset
  | 'redistribution'      // Can share with team members
  | 'broadcast'           // Can use in live broadcasts
  | 'recording';          // Can use in recorded content

export type LicenseRestriction =
  | 'no-resale'           // Cannot resell the preset
  | 'no-sublicensing'     // Cannot license to others
  | 'attribution-required' // Must credit the author
  | 'no-ai-training';      // Cannot use to train AI

export interface PresetPricing {
  /** Price in cents (USD) */
  priceUsd: number;
  
  /** Optional sale price */
  salePriceUsd?: number;
  
  /** Sale end date */
  saleEndsAt?: string;
  
  /** One-time or subscription */
  type: 'one-time' | 'subscription';
  
  /** For subscriptions: billing period */
  billingPeriod?: 'monthly' | 'yearly';
  
  /** Refund policy */
  refundable: boolean;
  refundDays?: number;
}

// ============================================================================
// CATEGORIES & DISCOVERY
// ============================================================================

export type PresetCategory =
  | 'gaming'
  | 'just-chatting'
  | 'music'
  | 'podcast'
  | 'sports'
  | 'events'
  | 'corporate'
  | 'church'
  | 'education'
  | 'creative'
  | 'news'
  | 'esports'
  | 'other';

// ============================================================================
// PREVIEW ASSETS
// ============================================================================

export interface PresetPreview {
  /** Thumbnail image (16:9, min 1280x720) */
  thumbnail: string;
  
  /** Additional screenshots */
  screenshots?: string[];
  
  /** Preview video (MP4, max 60s) */
  video?: string;
  
  /** Animated preview (WebP/GIF) */
  animated?: string;
  
  /** Color palette preview */
  colors?: string[];
}

// ============================================================================
// COMPATIBILITY
// ============================================================================

export interface PresetCompatibility {
  /** Minimum YouCast version */
  minVersion: string;
  
  /** Required features */
  requires?: PresetRequirement[];
  
  /** Recommended resolution */
  resolution?: '720p' | '1080p' | '1440p' | '4k';
  
  /** Aspect ratio */
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1';
}

export type PresetRequirement =
  | 'web-audio'           // Web Audio API
  | 'canvas'              // Canvas rendering
  | 'webgl'               // WebGL for effects
  | 'midi'                // MIDI controller support
  | 'camera'              // Camera access
  | 'screen-capture';     // Screen sharing

// ============================================================================
// CONTENTS
// ============================================================================

export interface PresetContents {
  /** Included compositions */
  compositions?: PresetComposition[];
  
  /** Included overlays */
  overlays?: PresetOverlay[];
  
  /** Included sound effects */
  sounds?: PresetSound[];
  
  /** Included fonts (must be licensed) */
  fonts?: PresetFont[];
  
  /** Transition stingers */
  stingers?: PresetStinger[];
  
  /** Background music (royalty-free) */
  music?: PresetMusic[];
  
  /** Alert templates */
  alerts?: PresetAlert[];
  
  /** Widget configurations */
  widgets?: PresetWidget[];
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export interface PresetComposition {
  /** Composition ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Icon emoji */
  icon?: string;
  
  /** Color code */
  color?: string;
  
  /** Referenced overlay IDs */
  overlays: string[];
  
  /** Audio settings */
  audio?: Record<string, PresetAudioState>;
  
  /** Video source settings */
  video?: Record<string, PresetVideoState>;
  
  /** Default transition */
  transition?: string;
  transitionDurationMs?: number;
  
  /** Suggested hotkey (user can rebind) */
  suggestedHotkey?: string;
}

export interface PresetOverlay {
  /** Overlay ID */
  id: string;
  
  /** Type identifier */
  type: string;
  
  /** Display name */
  name: string;
  
  /** Layer (z-index) */
  layer: number;
  
  /** Position */
  position: {
    x: number;
    y: number;
    anchor: string;
  };
  
  /** Size */
  size: {
    width: number;
    height: number;
  };
  
  /** Style properties */
  style: PresetOverlayStyle;
  
  /** Text elements */
  text?: PresetTextElement[];
  
  /** Image asset reference */
  image?: string;
  
  /** Animation settings */
  animation?: {
    in: string;
    out: string;
    durationMs: number;
  };
  
  /** Auto-dismiss after ms (0 = never) */
  autoDismissMs?: number;
  
  /** Editable fields (user can customize) */
  editableFields?: EditableField[];
}

export interface PresetOverlayStyle {
  background?: string;
  opacity?: number;
  borderRadius?: number;
  border?: {
    width: number;
    color: string;
    style: string;
  };
  boxShadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
  };
  backdropFilter?: string;
}

export interface PresetTextElement {
  /** Unique ID within overlay */
  id: string;
  
  /** Text content (supports {{variables}}) */
  content: string;
  
  /** Font family (reference or web-safe) */
  font: string;
  
  /** Font size in px */
  size: number;
  
  /** Font weight */
  weight: number;
  
  /** Text color */
  color: string;
  
  /** Position within overlay */
  x?: number;
  y?: number;
  
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Is this editable by user? */
  editable?: boolean;
  
  /** Placeholder text for editor */
  placeholder?: string;
}

export interface EditableField {
  /** Field path (e.g., "text.0.content") */
  path: string;
  
  /** Human label */
  label: string;
  
  /** Field type */
  type: 'text' | 'color' | 'number' | 'image' | 'select';
  
  /** For select type */
  options?: { label: string; value: string }[];
  
  /** Default value */
  defaultValue?: unknown;
}

export interface PresetSound {
  /** Sound ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Audio file path (relative to package) */
  file: string;
  
  /** Default volume (0-100) */
  volume: number;
  
  /** Play mode */
  playMode: 'oneshot' | 'toggle' | 'hold' | 'loop';
  
  /** Ducking config */
  duck?: {
    target: string;
    amount: number;
    fadeMs: number;
  };
  
  /** Suggested trigger */
  suggestedKey?: string;
  
  /** Pad color */
  color?: string;
  
  /** Icon */
  icon?: string;
}

export interface PresetFont {
  /** Font family name */
  family: string;
  
  /** Weights included */
  weights: number[];
  
  /** Font file paths */
  files: {
    weight: number;
    style: 'normal' | 'italic';
    file: string;
  }[];
  
  /** License info */
  license: string;
}

export interface PresetStinger {
  /** Stinger ID */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Video file (WebM with alpha or MP4) */
  file: string;
  
  /** Duration in ms */
  durationMs: number;
  
  /** Midpoint for switch (ms from start) */
  switchPointMs: number;
  
  /** Has alpha transparency */
  hasAlpha: boolean;
}

export interface PresetMusic {
  /** Track ID */
  id: string;
  
  /** Track name */
  name: string;
  
  /** Artist */
  artist?: string;
  
  /** Audio file */
  file: string;
  
  /** Duration in seconds */
  durationSec: number;
  
  /** BPM (for sync features) */
  bpm?: number;
  
  /** Genre tag */
  genre?: string;
  
  /** Mood tags */
  moods?: string[];
  
  /** License (must be royalty-free) */
  license: 'royalty-free' | 'creative-commons' | 'original';
}

export interface PresetAlert {
  /** Alert ID */
  id: string;
  
  /** Alert type */
  type: 'follow' | 'subscribe' | 'donation' | 'raid' | 'custom';
  
  /** Display name */
  name: string;
  
  /** Alert overlay template */
  template: PresetOverlay;
  
  /** Sound to play */
  soundId?: string;
  
  /** Duration visible */
  durationMs: number;
  
  /** Text-to-speech enabled */
  ttsEnabled?: boolean;
}

export interface PresetWidget {
  /** Widget ID */
  id: string;
  
  /** Widget type */
  type: 'chat' | 'goals' | 'leaderboard' | 'ticker' | 'clock' | 'countdown' | 'custom';
  
  /** Display name */
  name: string;
  
  /** Widget configuration */
  config: Record<string, unknown>;
  
  /** CSS styling */
  css?: string;
}

export interface PresetAudioState {
  channelId: string;
  gain: number;
  mute: boolean;
  solo?: boolean;
}

export interface PresetVideoState {
  sourceId: string;
  visible: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

// ============================================================================
// METADATA
// ============================================================================

export interface PresetMeta {
  /** Created date */
  createdAt: string;
  
  /** Last updated */
  updatedAt: string;
  
  /** Package hash for integrity */
  checksum?: string;
  
  /** Total package size in bytes */
  sizeBytes?: number;
  
  /** Download count (set by marketplace) */
  downloads?: number;
  
  /** Average rating (1-5) */
  rating?: number;
  
  /** Number of ratings */
  ratingCount?: number;
}

export interface PresetChangelog {
  version: string;
  date: string;
  changes: string[];
}

// ============================================================================
// PACKAGE FILE STRUCTURE
// ============================================================================

/**
 * .youcast-preset package structure (ZIP-based):
 * 
 * my-preset.youcast-preset/
 * ├── manifest.json          # PresetManifest
 * ├── preview/
 * │   ├── thumbnail.png      # 1280x720 thumbnail
 * │   ├── screenshot-1.png   # Additional screenshots
 * │   ├── screenshot-2.png
 * │   └── preview.mp4        # Video preview (optional)
 * ├── overlays/
 * │   └── *.json             # Overlay definitions
 * ├── compositions/
 * │   └── *.json             # Composition definitions
 * ├── sounds/
 * │   ├── effects/
 * │   │   └── *.mp3          # Sound effects
 * │   └── music/
 * │       └── *.mp3          # Background music
 * ├── stingers/
 * │   └── *.webm             # Transition videos
 * ├── fonts/
 * │   └── *.woff2            # Custom fonts
 * ├── images/
 * │   └── *.png              # Overlay images
 * └── LICENSE                # License file
 */

// ============================================================================
// MARKETPLACE API TYPES
// ============================================================================

export interface MarketplacePreset {
  /** Preset manifest */
  manifest: PresetManifest;
  
  /** Marketplace-specific data */
  marketplace: {
    /** Marketplace listing ID */
    listingId: string;
    
    /** Publisher account ID */
    publisherId: string;
    
    /** Listing status */
    status: 'draft' | 'pending-review' | 'published' | 'rejected' | 'removed';
    
    /** Featured/promoted */
    featured: boolean;
    
    /** Staff pick */
    staffPick: boolean;
    
    /** Published date */
    publishedAt?: string;
    
    /** View count */
    views: number;
    
    /** Purchase count */
    purchases: number;
  };
}

export interface MarketplaceSearchParams {
  query?: string;
  category?: PresetCategory;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  freeOnly?: boolean;
  sortBy?: 'relevance' | 'newest' | 'popular' | 'rating' | 'price-asc' | 'price-desc';
  page?: number;
  limit?: number;
}

export interface MarketplaceSearchResult {
  presets: MarketplacePreset[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// IMPORT/EXPORT UTILITIES
// ============================================================================

/**
 * Validate a preset manifest
 */
export function validatePresetManifest(manifest: unknown): manifest is PresetManifest {
  if (!manifest || typeof manifest !== 'object') return false;
  
  const m = manifest as Record<string, unknown>;
  
  // Required fields
  if (m.format !== 'youcast-preset') return false;
  if (m.version !== '1.0') return false;
  if (typeof m.id !== 'string' || !m.id) return false;
  if (typeof m.name !== 'string' || !m.name) return false;
  if (typeof m.description !== 'string') return false;
  if (typeof m.presetVersion !== 'string') return false;
  if (!m.author || typeof m.author !== 'object') return false;
  if (!m.license || typeof m.license !== 'object') return false;
  if (!m.preview || typeof m.preview !== 'object') return false;
  if (!m.compatibility || typeof m.compatibility !== 'object') return false;
  if (!m.contents || typeof m.contents !== 'object') return false;
  if (!m.meta || typeof m.meta !== 'object') return false;
  
  return true;
}

/**
 * Generate a preset package ID
 */
export function generatePresetId(authorUsername: string, presetSlug: string): string {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  return `com.youcast.${clean(authorUsername)}.${clean(presetSlug)}`;
}

/**
 * Create empty preset manifest template
 */
export function createPresetTemplate(name: string, author: string): PresetManifest {
  const now = new Date().toISOString();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  return {
    format: 'youcast-preset',
    version: '1.0',
    id: generatePresetId(author, slug),
    name,
    description: '',
    category: 'other',
    tags: [],
    presetVersion: '1.0.0',
    author: {
      name: author,
    },
    license: {
      type: 'CC-BY',
      permissions: ['commercial-use', 'modification', 'broadcast', 'recording'],
      restrictions: ['attribution-required'],
    },
    pricing: null,
    preview: {
      thumbnail: 'preview/thumbnail.png',
    },
    compatibility: {
      minVersion: '1.0.0',
      resolution: '1080p',
      aspectRatio: '16:9',
    },
    contents: {
      compositions: [],
      overlays: [],
      sounds: [],
    },
    meta: {
      createdAt: now,
      updatedAt: now,
    },
  };
}
