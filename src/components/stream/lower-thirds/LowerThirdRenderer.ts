import { 
  LowerThirdPayload, 
  LowerThirdAnimation,
  ANIMATION_DURATIONS,
  DEFAULT_COLORS,
  DEFAULT_FONT
} from "./types";

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

// ============================================================================
// ANIMATION CALCULATORS
// ============================================================================

interface AnimationState {
  x: number;
  y: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  clipWidth: number;
}

function calculateAnimationState(
  animation: LowerThirdAnimation,
  progress: number,
  baseX: number,
  baseY: number,
  width: number,
  height: number,
  canvasWidth: number,
  isExiting: boolean = false
): AnimationState {
  // Reverse progress for exit animations
  const p = isExiting ? 1 - progress : progress;
  
  const state: AnimationState = {
    x: baseX,
    y: baseY,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    clipWidth: width,
  };
  
  switch (animation) {
    case 'slide': {
      const eased = easeOutCubic(p);
      const offsetX = (1 - eased) * (width + 50);
      state.x = baseX - offsetX;
      state.opacity = eased;
      break;
    }
    
    case 'fade': {
      state.opacity = easeOutQuart(p);
      break;
    }
    
    case 'pop': {
      const eased = easeOutBack(p);
      state.scaleX = eased;
      state.scaleY = eased;
      state.opacity = p;
      break;
    }
    
    case 'wipe': {
      const eased = easeOutCubic(p);
      state.clipWidth = width * eased;
      state.opacity = 1;
      break;
    }
    
    case 'reveal': {
      const eased = easeOutQuart(p);
      state.y = baseY + height * (1 - eased);
      state.opacity = eased;
      break;
    }
    
    case 'bounce': {
      const eased = easeOutElastic(p);
      state.y = baseY + (1 - eased) * 60;
      state.opacity = Math.min(1, p * 2);
      break;
    }
    
    case 'scale': {
      const eased = easeOutCubic(p);
      state.scaleX = eased;
      state.scaleY = 1;
      state.opacity = eased;
      break;
    }
    
    case 'bar-grow': {
      const eased = easeOutCubic(p);
      state.clipWidth = width * eased;
      // Also fade in the text slightly delayed
      state.opacity = Math.max(0, (p - 0.3) / 0.7);
      break;
    }
  }
  
  return state;
}

// ============================================================================
// POSITION CALCULATOR
// ============================================================================

function calculatePosition(
  position: LowerThirdPayload['position'],
  canvasWidth: number,
  canvasHeight: number,
  width: number,
  height: number,
  padding: number
): { x: number; y: number } {
  let x = padding;
  let y = canvasHeight - height - padding;
  
  switch (position) {
    case 'bottom-left':
      x = padding;
      y = canvasHeight - height - padding;
      break;
    case 'bottom-center':
      x = (canvasWidth - width) / 2;
      y = canvasHeight - height - padding;
      break;
    case 'bottom-right':
      x = canvasWidth - width - padding;
      y = canvasHeight - height - padding;
      break;
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-center':
      x = (canvasWidth - width) / 2;
      y = padding;
      break;
    case 'top-right':
      x = canvasWidth - width - padding;
      y = padding;
      break;
  }
  
  return { x, y };
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

export function renderLowerThird(
  ctx: CanvasRenderingContext2D,
  payload: LowerThirdPayload,
  progress: number,
  canvas: HTMLCanvasElement,
  isExiting: boolean = false
) {
  const colors = payload.colors || DEFAULT_COLORS;
  const font = payload.font || DEFAULT_FONT;
  
  const padding = 24;
  const innerPadding = 16;
  const accentWidth = 4;
  
  // Calculate dimensions based on content
  ctx.font = `${font.nameWeight} ${font.nameSize}px ${font.family}`;
  const nameWidth = ctx.measureText(payload.name).width;
  
  let titleWidth = 0;
  if (payload.title) {
    ctx.font = `${font.titleWeight} ${font.titleSize}px ${font.family}`;
    titleWidth = ctx.measureText(payload.title).width;
  }
  
  const contentWidth = Math.max(nameWidth, titleWidth);
  const width = Math.max(320, contentWidth + innerPadding * 2 + accentWidth + 20);
  const height = payload.title ? 80 : 56;
  
  // Get base position
  const { x: baseX, y: baseY } = calculatePosition(
    payload.position,
    canvas.width,
    canvas.height,
    width,
    height,
    padding
  );
  
  // Calculate animation state
  const animState = calculateAnimationState(
    payload.animation,
    progress,
    baseX,
    baseY,
    width,
    height,
    canvas.width,
    isExiting
  );
  
  // Apply transformations
  ctx.save();
  ctx.globalAlpha = animState.opacity;
  
  // Handle scaling
  if (animState.scaleX !== 1 || animState.scaleY !== 1) {
    const centerX = animState.x + width / 2;
    const centerY = animState.y + height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(animState.scaleX, animState.scaleY);
    ctx.translate(-centerX, -centerY);
  }
  
  // Handle clipping for wipe/bar-grow
  if (animState.clipWidth < width) {
    ctx.beginPath();
    ctx.rect(animState.x, animState.y, animState.clipWidth, height);
    ctx.clip();
  }
  
  // Draw background
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  
  // Rounded rectangle
  const radius = 4;
  ctx.moveTo(animState.x + radius, animState.y);
  ctx.lineTo(animState.x + width - radius, animState.y);
  ctx.quadraticCurveTo(animState.x + width, animState.y, animState.x + width, animState.y + radius);
  ctx.lineTo(animState.x + width, animState.y + height - radius);
  ctx.quadraticCurveTo(animState.x + width, animState.y + height, animState.x + width - radius, animState.y + height);
  ctx.lineTo(animState.x + radius, animState.y + height);
  ctx.quadraticCurveTo(animState.x, animState.y + height, animState.x, animState.y + height - radius);
  ctx.lineTo(animState.x, animState.y + radius);
  ctx.quadraticCurveTo(animState.x, animState.y, animState.x + radius, animState.y);
  ctx.closePath();
  ctx.fill();
  
  // Draw accent bar
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(animState.x, animState.y, accentWidth, height);
  
  // Draw name
  ctx.fillStyle = colors.textPrimary;
  ctx.font = `${font.nameWeight} ${font.nameSize}px ${font.family}`;
  const nameY = payload.title 
    ? animState.y + innerPadding + font.nameSize - 4
    : animState.y + (height / 2) + (font.nameSize / 3);
  ctx.fillText(payload.name, animState.x + accentWidth + innerPadding, nameY);
  
  // Draw title
  if (payload.title) {
    ctx.fillStyle = colors.textSecondary;
    ctx.font = `${font.titleWeight} ${font.titleSize}px ${font.family}`;
    ctx.fillText(
      payload.title,
      animState.x + accentWidth + innerPadding,
      animState.y + innerPadding + font.nameSize + 8 + font.titleSize - 4
    );
  }
  
  ctx.restore();
}

// ============================================================================
// CSS-BASED RENDERER FOR DOM OVERLAY
// ============================================================================

export function getLowerThirdCSS(
  payload: LowerThirdPayload,
  progress: number,
  isExiting: boolean = false
): React.CSSProperties {
  const colors = payload.colors || DEFAULT_COLORS;
  const p = isExiting ? 1 - progress : progress;
  
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    padding: '12px 20px',
    backgroundColor: colors.primary,
    borderLeft: `4px solid ${colors.secondary}`,
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'none',
  };
  
  // Position
  switch (payload.position) {
    case 'bottom-left':
      baseStyle.bottom = '24px';
      baseStyle.left = '24px';
      break;
    case 'bottom-center':
      baseStyle.bottom = '24px';
      baseStyle.left = '50%';
      baseStyle.transform = 'translateX(-50%)';
      break;
    case 'bottom-right':
      baseStyle.bottom = '24px';
      baseStyle.right = '24px';
      break;
    case 'top-left':
      baseStyle.top = '24px';
      baseStyle.left = '24px';
      break;
    case 'top-center':
      baseStyle.top = '24px';
      baseStyle.left = '50%';
      baseStyle.transform = 'translateX(-50%)';
      break;
    case 'top-right':
      baseStyle.top = '24px';
      baseStyle.right = '24px';
      break;
  }
  
  // Animation transforms
  switch (payload.animation) {
    case 'slide':
      baseStyle.transform = `translateX(${(1 - easeOutCubic(p)) * -100}%)`;
      baseStyle.opacity = p;
      break;
    case 'fade':
      baseStyle.opacity = easeOutQuart(p);
      break;
    case 'pop':
      baseStyle.transform = `scale(${easeOutBack(p)})`;
      baseStyle.opacity = p;
      break;
    case 'bounce':
      baseStyle.transform = `translateY(${(1 - easeOutElastic(p)) * 60}px)`;
      baseStyle.opacity = Math.min(1, p * 2);
      break;
    case 'scale':
      baseStyle.transform = `scaleX(${easeOutCubic(p)})`;
      baseStyle.transformOrigin = 'left center';
      baseStyle.opacity = p;
      break;
  }
  
  return baseStyle;
}

export function getAnimationDuration(animation: LowerThirdAnimation): number {
  return ANIMATION_DURATIONS[animation] || 300;
}
