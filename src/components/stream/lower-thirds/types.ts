export type LowerThirdPosition =
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "top-left"
  | "top-center"
  | "top-right";

export type LowerThirdAnimation =
  | "slide"
  | "fade"
  | "pop"
  | "wipe"
  | "reveal"
  | "bounce"
  | "scale"
  | "bar-grow";

export type LowerThirdStyle = 
  | "news"
  | "podcast"
  | "church"
  | "sports"
  | "minimal"
  | "bold"
  | "corporate"
  | "custom";

export interface LowerThirdColors {
  primary: string;      // Main background
  secondary: string;    // Accent/border
  textPrimary: string;  // Name text color
  textSecondary: string; // Title text color
}

export interface LowerThirdFont {
  family: string;
  nameSize: number;
  titleSize: number;
  nameWeight: 400 | 500 | 600 | 700 | 800;
  titleWeight: 400 | 500 | 600 | 700 | 800;
}

export interface LowerThirdPayload {
  id: string;
  name: string;
  title?: string;
  subtitle?: string;
  position: LowerThirdPosition;
  animation: LowerThirdAnimation;
  animationDuration?: number; // animation speed in ms (default 300)
  duration?: number; // display duration in ms (0 = persistent)
  style: LowerThirdStyle;
  colors: LowerThirdColors;
  font: LowerThirdFont;
  showLogo?: boolean;
  logoUrl?: string;
  hotkey?: string; // for preset assignment
}

export interface LowerThirdPreset extends Omit<LowerThirdPayload, 'id' | 'name' | 'title'> {
  presetId: string;
  presetName: string;
  category: LowerThirdStyle;
  isCustom?: boolean;
}

export const DEFAULT_COLORS: LowerThirdColors = {
  primary: '#1a1a2e',
  secondary: '#e94560',
  textPrimary: '#ffffff',
  textSecondary: '#e0e0e0',
};

export const DEFAULT_FONT: LowerThirdFont = {
  family: 'Inter, system-ui, sans-serif',
  nameSize: 24,
  titleSize: 16,
  nameWeight: 600,
  titleWeight: 400,
};

export const ANIMATION_DURATIONS: Record<LowerThirdAnimation, number> = {
  'slide': 400,
  'fade': 300,
  'pop': 250,
  'wipe': 500,
  'reveal': 600,
  'bounce': 500,
  'scale': 300,
  'bar-grow': 400,
};
