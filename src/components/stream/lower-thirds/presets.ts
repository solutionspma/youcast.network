import { 
  LowerThirdPreset, 
  LowerThirdPayload, 
  DEFAULT_COLORS, 
  DEFAULT_FONT,
  LowerThirdStyle 
} from "./types";

// ============================================================================
// STYLE-SPECIFIC PRESETS
// ============================================================================

export const LOWER_THIRD_STYLE_PRESETS: Record<LowerThirdStyle, LowerThirdPreset> = {
  news: {
    presetId: 'style-news',
    presetName: 'News',
    category: 'news',
    position: 'bottom-left',
    animation: 'wipe',
    animationDuration: 500,
    duration: 0,
    style: 'news',
    colors: {
      primary: '#cc0000',
      secondary: '#ffffff',
      textPrimary: '#ffffff',
      textSecondary: '#ffffff',
    },
    font: {
      family: 'Roboto Condensed, Arial Narrow, sans-serif',
      nameSize: 28,
      titleSize: 18,
      nameWeight: 700,
      titleWeight: 500,
    },
    showLogo: true,
  },
  podcast: {
    presetId: 'style-podcast',
    presetName: 'Podcast',
    category: 'podcast',
    position: 'bottom-left',
    animation: 'slide',
    animationDuration: 400,
    duration: 0,
    style: 'podcast',
    colors: {
      primary: '#2d2d2d',
      secondary: '#8b5cf6',
      textPrimary: '#ffffff',
      textSecondary: '#a78bfa',
    },
    font: {
      family: 'Poppins, sans-serif',
      nameSize: 24,
      titleSize: 14,
      nameWeight: 600,
      titleWeight: 400,
    },
    showLogo: false,
  },
  church: {
    presetId: 'style-church',
    presetName: 'Church',
    category: 'church',
    position: 'bottom-center',
    animation: 'fade',
    animationDuration: 500,
    duration: 0,
    style: 'church',
    colors: {
      primary: 'rgba(0, 0, 0, 0.7)',
      secondary: '#d4af37',
      textPrimary: '#ffffff',
      textSecondary: '#d4af37',
    },
    font: {
      family: 'Playfair Display, Georgia, serif',
      nameSize: 26,
      titleSize: 16,
      nameWeight: 600,
      titleWeight: 400,
    },
    showLogo: false,
  },
  sports: {
    presetId: 'style-sports',
    presetName: 'Sports',
    category: 'sports',
    position: 'bottom-left',
    animation: 'bar-grow',
    animationDuration: 350,
    duration: 0,
    style: 'sports',
    colors: {
      primary: '#1e3a5f',
      secondary: '#ff6b00',
      textPrimary: '#ffffff',
      textSecondary: '#ff6b00',
    },
    font: {
      family: 'Oswald, Impact, sans-serif',
      nameSize: 30,
      titleSize: 18,
      nameWeight: 700,
      titleWeight: 500,
    },
    showLogo: true,
  },
  minimal: {
    presetId: 'style-minimal',
    presetName: 'Minimal',
    category: 'minimal',
    position: 'bottom-left',
    animation: 'fade',
    animationDuration: 300,
    duration: 5000,
    style: 'minimal',
    colors: {
      primary: 'transparent',
      secondary: 'transparent',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
    },
    font: {
      family: 'Inter, system-ui, sans-serif',
      nameSize: 20,
      titleSize: 14,
      nameWeight: 500,
      titleWeight: 400,
    },
    showLogo: false,
  },
  bold: {
    presetId: 'style-bold',
    presetName: 'Bold',
    category: 'bold',
    position: 'bottom-left',
    animation: 'pop',
    animationDuration: 250,
    duration: 0,
    style: 'bold',
    colors: {
      primary: '#000000',
      secondary: '#00ff88',
      textPrimary: '#ffffff',
      textSecondary: '#00ff88',
    },
    font: {
      family: 'Bebas Neue, Impact, sans-serif',
      nameSize: 36,
      titleSize: 18,
      nameWeight: 700,
      titleWeight: 700,
    },
    showLogo: false,
  },
  corporate: {
    presetId: 'style-corporate',
    presetName: 'Corporate',
    category: 'corporate',
    position: 'bottom-left',
    animation: 'reveal',
    animationDuration: 500,
    duration: 0,
    style: 'corporate',
    colors: {
      primary: '#ffffff',
      secondary: '#0066cc',
      textPrimary: '#1a1a1a',
      textSecondary: '#0066cc',
    },
    font: {
      family: 'Open Sans, Arial, sans-serif',
      nameSize: 22,
      titleSize: 14,
      nameWeight: 600,
      titleWeight: 400,
    },
    showLogo: true,
  },
  custom: {
    presetId: 'style-custom',
    presetName: 'Custom',
    category: 'custom',
    position: 'bottom-left',
    animation: 'slide',
    animationDuration: 400,
    duration: 5000,
    style: 'custom',
    colors: DEFAULT_COLORS,
    font: DEFAULT_FONT,
    showLogo: false,
  },
};

// ============================================================================
// HOTKEY-BOUND PRESETS (F1-F12)
// ============================================================================

export const LOWER_THIRD_PRESETS: Record<string, LowerThirdPayload> = {
  F1: {
    id: "lt-f1",
    name: "Host Name",
    title: "Host",
    ...LOWER_THIRD_STYLE_PRESETS.minimal,
    hotkey: 'F1',
  },
  F2: {
    id: "lt-f2",
    name: "Guest Name",
    title: "Guest",
    ...LOWER_THIRD_STYLE_PRESETS.minimal,
    hotkey: 'F2',
  },
  F3: {
    id: "lt-f3",
    name: "Speaker Name",
    title: "Speaker",
    ...LOWER_THIRD_STYLE_PRESETS.church,
    hotkey: 'F3',
  },
  F4: {
    id: "lt-f4",
    name: "Breaking News",
    title: "LIVE",
    ...LOWER_THIRD_STYLE_PRESETS.news,
    hotkey: 'F4',
  },
  F5: {
    id: "lt-f5",
    name: "Player Name",
    title: "Position / Team",
    ...LOWER_THIRD_STYLE_PRESETS.sports,
    hotkey: 'F5',
  },
  F6: {
    id: "lt-f6",
    name: "Youcast Network",
    title: "Live",
    ...LOWER_THIRD_STYLE_PRESETS.bold,
    position: "bottom-center",
    hotkey: 'F6',
  },
  F7: {
    id: "lt-f7",
    name: "Episode Title",
    title: "Podcast Episode #1",
    ...LOWER_THIRD_STYLE_PRESETS.podcast,
    hotkey: 'F7',
  },
  F8: {
    id: "lt-f8",
    name: "CEO / Presenter",
    title: "Company Name",
    ...LOWER_THIRD_STYLE_PRESETS.corporate,
    hotkey: 'F8',
  },
};

// ============================================================================
// GALLERY HELPERS
// ============================================================================

export function getAllStylePresets(): LowerThirdPreset[] {
  return Object.values(LOWER_THIRD_STYLE_PRESETS);
}

export function getPresetsByCategory(category: LowerThirdStyle): LowerThirdPreset[] {
  return Object.values(LOWER_THIRD_STYLE_PRESETS).filter(p => p.category === category);
}

export function getHotkeyPresets(): LowerThirdPayload[] {
  return Object.values(LOWER_THIRD_PRESETS);
}

export function createPayloadFromPreset(
  preset: LowerThirdPreset,
  name: string,
  title?: string
): LowerThirdPayload {
  return {
    id: `lt-${Date.now()}`,
    name,
    title,
    position: preset.position,
    animation: preset.animation,
    animationDuration: preset.animationDuration,
    duration: preset.duration,
    style: preset.style,
    colors: { ...preset.colors },
    font: { ...preset.font },
    showLogo: preset.showLogo,
    logoUrl: preset.logoUrl,
  };
}
