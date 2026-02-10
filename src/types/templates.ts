// ============================================================================
// THUMBNAIL TEMPLATE SYSTEM
// ============================================================================

import { ThumbnailPlatform, ThumbnailLayer, TextLayer, ImageLayer, ShapeLayer } from './thumbnail';

// Template Categories
export type TemplateCategory = 
  | 'podcast'
  | 'interview'
  | 'reaction'
  | 'commentary'
  | 'education'
  | 'church'
  | 'business'
  | 'emergency'
  | 'shorts'
  | 'gaming'
  | 'vlog';

// Template definition matching the spec
export interface ThumbnailTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  platform: ThumbnailPlatform;
  
  // Canvas settings
  canvas: {
    width: number;
    height: number;
  };
  
  // Safe areas for text placement
  safeAreas: boolean;
  
  // Template layers (editable)
  layers: TemplateLayer[];
  
  // Preview
  previewUrl?: string;
  
  // Metadata
  author?: string;
  version: string;
  tags: string[];
  isDefault: boolean;
  isPremium: boolean;
  
  // Install info
  installCount: number;
  rating: number;
  createdAt: string;
}

export interface TemplateLayer {
  type: 'image' | 'text' | 'shape' | 'gradient';
  role: 'background' | 'headline' | 'subheadline' | 'face' | 'logo' | 'accent' | 'badge' | 'overlay';
  editable: boolean;
  
  // Position (relative to canvas, can be percentage or pixels)
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  
  // Text-specific
  content?: string;
  font?: string;
  size?: number;
  weight?: number;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
  
  // Image-specific
  src?: string;
  fit?: 'cover' | 'contain' | 'fill';
  mask?: 'none' | 'circle' | 'rounded';
  
  // Shape-specific
  shape?: 'rectangle' | 'circle' | 'triangle';
  fill?: string;
  cornerRadius?: number;
  
  // Common
  opacity?: number;
  rotation?: number;
  zIndex: number;
}

// ============================================================================
// DEFAULT TEMPLATE PACK: "YouTube Bold Starter Pack"
// ============================================================================

export const DEFAULT_TEMPLATES: ThumbnailTemplate[] = [
  // PODCAST TEMPLATE
  {
    id: 'yt_podcast_bold_01',
    name: 'Bold Podcast',
    description: 'Eye-catching podcast thumbnail with dual faces and bold text',
    category: 'podcast',
    platform: 'youtube',
    canvas: { width: 1280, height: 720 },
    safeAreas: true,
    layers: [
      {
        type: 'shape',
        role: 'background',
        editable: true,
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        shape: 'rectangle',
        fill: '#1a1a2e',
        zIndex: 0,
      },
      {
        type: 'shape',
        role: 'accent',
        editable: true,
        x: 0,
        y: 580,
        width: 1280,
        height: 140,
        shape: 'rectangle',
        fill: '#ff0000',
        zIndex: 1,
      },
      {
        type: 'text',
        role: 'headline',
        editable: true,
        x: 640,
        y: 620,
        width: 1200,
        height: 80,
        content: 'YOUR PODCAST TITLE',
        font: 'Anton',
        size: 72,
        weight: 700,
        color: '#ffffff',
        stroke: '#000000',
        strokeWidth: 3,
        shadow: true,
        shadowColor: '#000000',
        shadowBlur: 10,
        align: 'center',
        uppercase: true,
        zIndex: 5,
      },
      {
        type: 'image',
        role: 'face',
        editable: true,
        x: 100,
        y: 80,
        width: 400,
        height: 480,
        fit: 'cover',
        mask: 'rounded',
        zIndex: 2,
      },
      {
        type: 'image',
        role: 'face',
        editable: true,
        x: 780,
        y: 80,
        width: 400,
        height: 480,
        fit: 'cover',
        mask: 'rounded',
        zIndex: 2,
      },
    ],
    tags: ['podcast', 'interview', 'duo', 'bold'],
    isDefault: true,
    isPremium: false,
    installCount: 0,
    rating: 0,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },

  // REACTION TEMPLATE
  {
    id: 'yt_reaction_bold_01',
    name: 'Shock Reaction',
    description: 'High-impact reaction thumbnail with large face and text overlay',
    category: 'reaction',
    platform: 'youtube',
    canvas: { width: 1280, height: 720 },
    safeAreas: true,
    layers: [
      {
        type: 'image',
        role: 'background',
        editable: true,
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        fit: 'cover',
        zIndex: 0,
      },
      {
        type: 'shape',
        role: 'overlay',
        editable: false,
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        shape: 'rectangle',
        fill: 'rgba(0,0,0,0.3)',
        zIndex: 1,
      },
      {
        type: 'image',
        role: 'face',
        editable: true,
        x: 800,
        y: 100,
        width: 450,
        height: 550,
        fit: 'cover',
        mask: 'none',
        zIndex: 2,
      },
      {
        type: 'text',
        role: 'headline',
        editable: true,
        x: 50,
        y: 200,
        width: 700,
        height: 300,
        content: 'I CAN\'T BELIEVE THIS!',
        font: 'Impact',
        size: 84,
        weight: 900,
        color: '#ffff00',
        stroke: '#ff0000',
        strokeWidth: 5,
        shadow: true,
        shadowColor: '#000000',
        shadowBlur: 15,
        align: 'left',
        uppercase: true,
        zIndex: 3,
      },
      {
        type: 'shape',
        role: 'badge',
        editable: true,
        x: 50,
        y: 550,
        width: 250,
        height: 60,
        shape: 'rectangle',
        fill: '#ff0000',
        cornerRadius: 10,
        zIndex: 4,
      },
      {
        type: 'text',
        role: 'badge',
        editable: true,
        x: 175,
        y: 560,
        width: 240,
        height: 50,
        content: 'REACTION',
        font: 'Arial Black',
        size: 36,
        weight: 900,
        color: '#ffffff',
        align: 'center',
        uppercase: true,
        zIndex: 5,
      },
    ],
    tags: ['reaction', 'shock', 'emotion', 'viral'],
    isDefault: true,
    isPremium: false,
    installCount: 0,
    rating: 0,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },

  // EDUCATION TEMPLATE
  {
    id: 'yt_education_clean_01',
    name: 'Clean Education',
    description: 'Professional educational thumbnail with clear text hierarchy',
    category: 'education',
    platform: 'youtube',
    canvas: { width: 1280, height: 720 },
    safeAreas: true,
    layers: [
      {
        type: 'shape',
        role: 'background',
        editable: true,
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        shape: 'rectangle',
        fill: '#0a1628',
        zIndex: 0,
      },
      {
        type: 'shape',
        role: 'accent',
        editable: true,
        x: 0,
        y: 0,
        width: 20,
        height: 720,
        shape: 'rectangle',
        fill: '#3b82f6',
        zIndex: 1,
      },
      {
        type: 'text',
        role: 'headline',
        editable: true,
        x: 60,
        y: 180,
        width: 700,
        height: 200,
        content: 'How to Master Any Skill',
        font: 'Inter',
        size: 64,
        weight: 800,
        color: '#ffffff',
        align: 'left',
        zIndex: 2,
      },
      {
        type: 'text',
        role: 'subheadline',
        editable: true,
        x: 60,
        y: 400,
        width: 700,
        height: 100,
        content: 'The Complete Beginner\'s Guide',
        font: 'Inter',
        size: 32,
        weight: 500,
        color: '#94a3b8',
        align: 'left',
        zIndex: 3,
      },
      {
        type: 'image',
        role: 'face',
        editable: true,
        x: 850,
        y: 120,
        width: 350,
        height: 480,
        fit: 'cover',
        mask: 'rounded',
        zIndex: 4,
      },
      {
        type: 'shape',
        role: 'badge',
        editable: true,
        x: 60,
        y: 520,
        width: 180,
        height: 50,
        shape: 'rectangle',
        fill: '#3b82f6',
        cornerRadius: 8,
        zIndex: 5,
      },
      {
        type: 'text',
        role: 'badge',
        editable: true,
        x: 150,
        y: 530,
        width: 170,
        height: 40,
        content: 'TUTORIAL',
        font: 'Inter',
        size: 24,
        weight: 700,
        color: '#ffffff',
        align: 'center',
        uppercase: true,
        zIndex: 6,
      },
    ],
    tags: ['education', 'tutorial', 'clean', 'professional'],
    isDefault: true,
    isPremium: false,
    installCount: 0,
    rating: 0,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },

  // CHURCH TEMPLATE
  {
    id: 'yt_church_sermon_01',
    name: 'Sermon Series',
    description: 'Elegant church sermon thumbnail with scripture reference',
    category: 'church',
    platform: 'youtube',
    canvas: { width: 1280, height: 720 },
    safeAreas: true,
    layers: [
      {
        type: 'image',
        role: 'background',
        editable: true,
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        fit: 'cover',
        zIndex: 0,
      },
      {
        type: 'shape',
        role: 'overlay',
        editable: false,
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        shape: 'rectangle',
        fill: 'rgba(0,0,0,0.6)',
        zIndex: 1,
      },
      {
        type: 'text',
        role: 'headline',
        editable: true,
        x: 640,
        y: 250,
        width: 1100,
        height: 150,
        content: 'FINDING HOPE',
        font: 'Playfair Display',
        size: 96,
        weight: 700,
        color: '#ffffff',
        shadow: true,
        shadowColor: '#000000',
        shadowBlur: 20,
        align: 'center',
        uppercase: true,
        zIndex: 2,
      },
      {
        type: 'text',
        role: 'subheadline',
        editable: true,
        x: 640,
        y: 420,
        width: 1000,
        height: 80,
        content: 'Romans 15:13 • Week 3 of 6',
        font: 'Inter',
        size: 32,
        weight: 400,
        color: '#d4af37',
        align: 'center',
        zIndex: 3,
      },
      {
        type: 'image',
        role: 'logo',
        editable: true,
        x: 580,
        y: 550,
        width: 120,
        height: 120,
        fit: 'contain',
        zIndex: 4,
      },
    ],
    tags: ['church', 'sermon', 'faith', 'religious'],
    isDefault: true,
    isPremium: false,
    installCount: 0,
    rating: 0,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },

  // BUSINESS TEMPLATE
  {
    id: 'yt_business_pro_01',
    name: 'Professional Business',
    description: 'Corporate-style thumbnail for business content',
    category: 'business',
    platform: 'youtube',
    canvas: { width: 1280, height: 720 },
    safeAreas: true,
    layers: [
      {
        type: 'shape',
        role: 'background',
        editable: true,
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        shape: 'rectangle',
        fill: '#0f172a',
        zIndex: 0,
      },
      {
        type: 'shape',
        role: 'accent',
        editable: true,
        x: 0,
        y: 640,
        width: 1280,
        height: 80,
        shape: 'rectangle',
        fill: '#f59e0b',
        zIndex: 1,
      },
      {
        type: 'text',
        role: 'headline',
        editable: true,
        x: 640,
        y: 200,
        width: 1100,
        height: 200,
        content: '5 Strategies That 10x Revenue',
        font: 'Inter',
        size: 68,
        weight: 800,
        color: '#ffffff',
        align: 'center',
        zIndex: 2,
      },
      {
        type: 'text',
        role: 'subheadline',
        editable: true,
        x: 640,
        y: 420,
        width: 800,
        height: 80,
        content: 'Proven Methods from Industry Leaders',
        font: 'Inter',
        size: 28,
        weight: 400,
        color: '#94a3b8',
        align: 'center',
        zIndex: 3,
      },
      {
        type: 'text',
        role: 'badge',
        editable: true,
        x: 640,
        y: 660,
        width: 400,
        height: 50,
        content: 'BUSINESS MASTERCLASS',
        font: 'Inter',
        size: 24,
        weight: 700,
        color: '#0f172a',
        align: 'center',
        uppercase: true,
        zIndex: 4,
      },
    ],
    tags: ['business', 'corporate', 'professional', 'revenue'],
    isDefault: true,
    isPremium: false,
    installCount: 0,
    rating: 0,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },

  // SHORTS TEMPLATE
  {
    id: 'yt_shorts_viral_01',
    name: 'Viral Short',
    description: 'Vertical thumbnail optimized for YouTube Shorts',
    category: 'shorts',
    platform: 'youtube-shorts',
    canvas: { width: 1080, height: 1920 },
    safeAreas: true,
    layers: [
      {
        type: 'shape',
        role: 'background',
        editable: true,
        x: 0,
        y: 0,
        width: 1080,
        height: 1920,
        shape: 'rectangle',
        fill: '#000000',
        zIndex: 0,
      },
      {
        type: 'image',
        role: 'background',
        editable: true,
        x: 0,
        y: 0,
        width: 1080,
        height: 1920,
        fit: 'cover',
        zIndex: 1,
      },
      {
        type: 'text',
        role: 'headline',
        editable: true,
        x: 540,
        y: 200,
        width: 980,
        height: 400,
        content: 'WAIT FOR IT...',
        font: 'Impact',
        size: 96,
        weight: 900,
        color: '#ffffff',
        stroke: '#ff0000',
        strokeWidth: 4,
        shadow: true,
        shadowColor: '#000000',
        shadowBlur: 20,
        align: 'center',
        uppercase: true,
        zIndex: 2,
      },
    ],
    tags: ['shorts', 'vertical', 'viral', 'tiktok'],
    isDefault: true,
    isPremium: false,
    installCount: 0,
    rating: 0,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },

  // EMERGENCY / BREAKING NEWS TEMPLATE
  {
    id: 'yt_emergency_alert_01',
    name: 'Breaking News Alert',
    description: 'Urgent news-style thumbnail for time-sensitive content',
    category: 'emergency',
    platform: 'youtube',
    canvas: { width: 1280, height: 720 },
    safeAreas: true,
    layers: [
      {
        type: 'shape',
        role: 'background',
        editable: true,
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        shape: 'rectangle',
        fill: '#1a0000',
        zIndex: 0,
      },
      {
        type: 'shape',
        role: 'accent',
        editable: false,
        x: 0,
        y: 0,
        width: 1280,
        height: 120,
        shape: 'rectangle',
        fill: '#ff0000',
        zIndex: 1,
      },
      {
        type: 'text',
        role: 'badge',
        editable: true,
        x: 640,
        y: 60,
        width: 500,
        height: 60,
        content: '⚠️ BREAKING NEWS ⚠️',
        font: 'Arial Black',
        size: 48,
        weight: 900,
        color: '#ffffff',
        align: 'center',
        uppercase: true,
        zIndex: 2,
      },
      {
        type: 'text',
        role: 'headline',
        editable: true,
        x: 640,
        y: 350,
        width: 1150,
        height: 250,
        content: 'URGENT UPDATE',
        font: 'Impact',
        size: 120,
        weight: 900,
        color: '#ffffff',
        stroke: '#ff0000',
        strokeWidth: 4,
        shadow: true,
        shadowColor: '#000000',
        shadowBlur: 20,
        align: 'center',
        uppercase: true,
        zIndex: 3,
      },
      {
        type: 'text',
        role: 'subheadline',
        editable: true,
        x: 640,
        y: 550,
        width: 1000,
        height: 80,
        content: 'Watch Now for Full Details',
        font: 'Inter',
        size: 36,
        weight: 600,
        color: '#ffcccc',
        align: 'center',
        zIndex: 4,
      },
    ],
    tags: ['breaking', 'news', 'urgent', 'alert', 'emergency'],
    isDefault: true,
    isPremium: false,
    installCount: 0,
    rating: 0,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
  },
];

// Helper to convert template layer to canvas layer
export function templateLayerToCanvasLayer(
  templateLayer: TemplateLayer,
  canvasWidth: number,
  canvasHeight: number
): ThumbnailLayer {
  // Convert percentage strings to pixels
  const parsePosition = (value: number | string, maxValue: number): number => {
    if (typeof value === 'string' && value.endsWith('%')) {
      return (parseFloat(value) / 100) * maxValue;
    }
    return typeof value === 'number' ? value : parseFloat(value);
  };

  const baseLayer = {
    id: Math.random().toString(36).substr(2, 9),
    name: `${templateLayer.role} ${templateLayer.type}`,
    x: parsePosition(templateLayer.x, canvasWidth),
    y: parsePosition(templateLayer.y, canvasHeight),
    width: parsePosition(templateLayer.width, canvasWidth),
    height: parsePosition(templateLayer.height, canvasHeight),
    rotation: templateLayer.rotation || 0,
    opacity: templateLayer.opacity || 1,
    locked: !templateLayer.editable,
    visible: true,
    zIndex: templateLayer.zIndex,
  };

  if (templateLayer.type === 'text') {
    const textLayer: TextLayer = {
      ...baseLayer,
      type: 'text',
      content: templateLayer.content || 'Edit Text',
      fontFamily: templateLayer.font || 'Inter',
      fontSize: templateLayer.size || 48,
      fontWeight: templateLayer.weight || 700,
      color: templateLayer.color || '#ffffff',
      stroke: templateLayer.stroke,
      strokeWidth: templateLayer.strokeWidth || 0,
      shadow: templateLayer.shadow ? {
        color: templateLayer.shadowColor || '#000000',
        blur: templateLayer.shadowBlur || 10,
        offsetX: 0,
        offsetY: 0,
      } : undefined,
      align: templateLayer.align || 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
      uppercase: templateLayer.uppercase || false,
    };
    return textLayer;
  }

  if (templateLayer.type === 'image') {
    return {
      ...baseLayer,
      type: 'image',
      src: templateLayer.src || '',
      mask: templateLayer.mask || 'none',
    } as ImageLayer;
  }

  if (templateLayer.type === 'shape') {
    return {
      ...baseLayer,
      type: 'shape',
      shape: templateLayer.shape || 'rectangle',
      fill: templateLayer.fill || '#ffffff',
      stroke: templateLayer.stroke,
      strokeWidth: templateLayer.strokeWidth,
      cornerRadius: templateLayer.cornerRadius || 0,
    } as ShapeLayer;
  }

  // Default to shape
  return {
    ...baseLayer,
    type: 'shape',
    shape: 'rectangle',
    fill: '#ffffff',
  } as ShapeLayer;
}

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): ThumbnailTemplate[] {
  return DEFAULT_TEMPLATES.filter(t => t.category === category);
}

// Get templates by platform
export function getTemplatesByPlatform(platform: ThumbnailPlatform): ThumbnailTemplate[] {
  return DEFAULT_TEMPLATES.filter(t => t.platform === platform);
}
