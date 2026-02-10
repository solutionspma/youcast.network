// ============================================================================
// THUMBNAIL STUDIO TYPES
// ============================================================================

// Platform Presets
export type ThumbnailPlatform = 
  | 'youtube'
  | 'youtube-shorts'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'custom';

export interface PlatformPreset {
  id: ThumbnailPlatform;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  safeArea?: { top: number; bottom: number; left: number; right: number };
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  { id: 'youtube', name: 'YouTube Thumbnail', width: 1280, height: 720, aspectRatio: '16:9' },
  { id: 'youtube-shorts', name: 'YouTube Shorts', width: 1080, height: 1920, aspectRatio: '9:16' },
  { id: 'tiktok', name: 'TikTok Cover', width: 1080, height: 1920, aspectRatio: '9:16' },
  { id: 'instagram', name: 'Instagram Post', width: 1080, height: 1080, aspectRatio: '1:1' },
  { id: 'facebook', name: 'Facebook Video', width: 1280, height: 720, aspectRatio: '16:9' },
  { id: 'linkedin', name: 'LinkedIn Video', width: 1200, height: 627, aspectRatio: '1.91:1' },
  { id: 'custom', name: 'Custom Size', width: 1280, height: 720, aspectRatio: 'custom' },
];

// Layer Types
export type LayerType = 'image' | 'text' | 'shape' | 'gradient';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  color: string;
  stroke?: string;
  strokeWidth?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  letterSpacing: number;
  lineHeight: number;
  uppercase: boolean;
  align: 'left' | 'center' | 'right';
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  mask?: 'none' | 'circle' | 'rounded' | 'custom';
  maskRadius?: number;
  blur?: number;
  backgroundRemoved?: boolean;
  dropShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'line';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  sides?: number; // for polygon
}

export interface GradientLayer extends BaseLayer {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  colors: { offset: number; color: string }[];
  angle?: number; // for linear
}

export type ThumbnailLayer = TextLayer | ImageLayer | ShapeLayer | GradientLayer;

// Canvas State
export interface ThumbnailCanvas {
  id: string;
  name: string;
  platform: ThumbnailPlatform;
  width: number;
  height: number;
  backgroundColor: string;
  layers: ThumbnailLayer[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Template
export interface ThumbnailTemplate {
  id: string;
  name: string;
  category: 'podcast' | 'gaming' | 'business' | 'church' | 'education' | 'entertainment' | 'news' | 'sports';
  thumbnail: string; // preview image
  platform: ThumbnailPlatform;
  canvas: Omit<ThumbnailCanvas, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'version'>;
  premium: boolean;
}

// History for undo/redo
export interface HistoryState {
  past: ThumbnailCanvas[];
  present: ThumbnailCanvas;
  future: ThumbnailCanvas[];
}

// AI Generation
export interface AIThumbnailRequest {
  topic: string;
  platform: ThumbnailPlatform;
  tone: 'bold' | 'minimal' | 'playful' | 'professional' | 'dramatic';
  includeFaces: boolean;
  keywords?: string[];
}

export interface AIThumbnailSuggestion {
  headlines: string[];
  subheadlines: string[];
  colorSchemes: { primary: string; secondary: string; accent: string }[];
  layoutRecommendations: string[];
  backgroundSuggestions: string[];
}

// Export Options
export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number; // 0-100 for jpg/webp
  scale: number; // 1x, 2x, etc.
}

// Attachment Target
export interface ThumbnailAttachment {
  thumbnailId: string;
  targetType: 'stream' | 'recording' | 'scheduled' | 'social';
  targetId: string;
  platform: ThumbnailPlatform;
}

// Permissions
export type ThumbnailPermission = 'view' | 'edit' | 'create' | 'delete' | 'export';

export interface ThumbnailUserRole {
  role: 'host' | 'producer' | 'observer';
  permissions: ThumbnailPermission[];
}

export const ROLE_PERMISSIONS: Record<string, ThumbnailPermission[]> = {
  host: ['view', 'edit', 'create', 'delete', 'export'],
  producer: ['view', 'edit', 'create', 'export'],
  observer: ['view'],
};

// Default Text Styles
export const DEFAULT_TEXT_STYLE: Omit<TextLayer, 'id' | 'name' | 'x' | 'y' | 'width' | 'height' | 'zIndex'> = {
  type: 'text',
  content: 'Your Text Here',
  fontFamily: 'Inter',
  fontWeight: 700,
  fontSize: 72,
  color: '#ffffff',
  stroke: '#000000',
  strokeWidth: 2,
  letterSpacing: 0,
  lineHeight: 1.2,
  uppercase: false,
  align: 'center',
  rotation: 0,
  opacity: 1,
  locked: false,
  visible: true,
};

// Available Fonts
export const AVAILABLE_FONTS = [
  'Inter',
  'Anton',
  'Bebas Neue',
  'Montserrat',
  'Oswald',
  'Playfair Display',
  'Roboto',
  'Poppins',
  'Raleway',
  'Open Sans',
  'Lato',
  'Source Sans Pro',
  'Bangers',
  'Permanent Marker',
  'Impact',
];
