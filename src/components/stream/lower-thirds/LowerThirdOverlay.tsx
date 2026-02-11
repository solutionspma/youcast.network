'use client';

import { useState, useEffect, useRef } from 'react';
import { getLowerThirdEngine } from './LowerThirdEngine';
import { 
  LowerThirdPayload, 
  DEFAULT_COLORS, 
  DEFAULT_FONT,
  ANIMATION_DURATIONS 
} from './types';

// ============================================================================
// ANIMATION KEYFRAMES (CSS-in-JS)
// ============================================================================

const getAnimationKeyframes = (animation: LowerThirdPayload['animation'], isExit: boolean) => {
  const direction = isExit ? 'reverse' : 'normal';
  
  switch (animation) {
    case 'slide':
      return {
        from: { transform: 'translateX(-120%)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      };
    case 'fade':
      return {
        from: { opacity: 0 },
        to: { opacity: 1 },
      };
    case 'pop':
      return {
        from: { transform: 'scale(0)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
      };
    case 'wipe':
      return {
        from: { clipPath: 'inset(0 100% 0 0)' },
        to: { clipPath: 'inset(0 0 0 0)' },
      };
    case 'reveal':
      return {
        from: { transform: 'translateY(100%)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      };
    case 'bounce':
      return {
        from: { transform: 'translateY(100px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      };
    case 'scale':
      return {
        from: { transform: 'scaleX(0)', opacity: 0 },
        to: { transform: 'scaleX(1)', opacity: 1 },
      };
    case 'bar-grow':
      return {
        from: { width: '4px', opacity: 0 },
        to: { width: 'auto', opacity: 1 },
      };
    default:
      return {
        from: { opacity: 0 },
        to: { opacity: 1 },
      };
  }
};

// ============================================================================
// POSITION STYLES
// ============================================================================

const getPositionStyles = (position: LowerThirdPayload['position']): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: 'absolute',
  };
  
  switch (position) {
    case 'bottom-left':
      return { ...base, bottom: '32px', left: '32px' };
    case 'bottom-center':
      return { ...base, bottom: '32px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-right':
      return { ...base, bottom: '32px', right: '32px' };
    case 'top-left':
      return { ...base, top: '32px', left: '32px' };
    case 'top-center':
      return { ...base, top: '32px', left: '50%', transform: 'translateX(-50%)' };
    case 'top-right':
      return { ...base, top: '32px', right: '32px' };
    default:
      return { ...base, bottom: '32px', left: '32px' };
  }
};

// ============================================================================
// LOWER THIRD OVERLAY COMPONENT
// ============================================================================

interface LowerThirdOverlayProps {
  className?: string;
}

export function LowerThirdOverlay({ className = '' }: LowerThirdOverlayProps) {
  const [payload, setPayload] = useState<LowerThirdPayload | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    const engine = getLowerThirdEngine();
    
    return engine.subscribe((newPayload, exiting) => {
      setPayload(newPayload);
      setIsExiting(exiting);
      
      // Start animation
      if (newPayload) {
        startTimeRef.current = performance.now();
        setAnimationProgress(0);
        
        const duration = newPayload.animationDuration || ANIMATION_DURATIONS[newPayload.animation] || 300;
        
        const animate = () => {
          const elapsed = performance.now() - startTimeRef.current;
          const progress = Math.min(elapsed / duration, 1);
          setAnimationProgress(progress);
          
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };
        
        animationRef.current = requestAnimationFrame(animate);
      }
    });
  }, []);
  
  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  if (!payload) return null;
  
  const colors = payload.colors || DEFAULT_COLORS;
  const font = payload.font || DEFAULT_FONT;
  const duration = payload.animationDuration || ANIMATION_DURATIONS[payload.animation] || 300;
  
  // Build animation class
  const animationName = `lt-${payload.animation}${isExiting ? '-exit' : '-enter'}`;
  
  return (
    <div 
      className={`pointer-events-none ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      <div 
        style={{
          ...getPositionStyles(payload.position),
          animation: `${animationName} ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${isExiting ? 'reverse' : 'forwards'}`,
          transformOrigin: payload.animation === 'scale' ? 'left center' : 'center center',
        }}
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'stretch',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Accent Bar */}
          <div 
            style={{
              width: '5px',
              backgroundColor: colors.secondary,
              flexShrink: 0,
            }}
          />
          
          {/* Content */}
          <div 
            style={{
              padding: '14px 24px',
              backgroundColor: colors.primary,
              minWidth: '200px',
            }}
          >
            {/* Name */}
            <div 
              style={{
                fontFamily: font.family,
                fontSize: `${font.nameSize}px`,
                fontWeight: font.nameWeight,
                color: colors.textPrimary,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {payload.name}
            </div>
            
            {/* Title */}
            {payload.title && (
              <div 
                style={{
                  fontFamily: font.family,
                  fontSize: `${font.titleSize}px`,
                  fontWeight: font.titleWeight,
                  color: colors.textSecondary,
                  lineHeight: 1.3,
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {payload.title}
              </div>
            )}
            
            {/* Subtitle */}
            {payload.subtitle && (
              <div 
                style={{
                  fontFamily: font.family,
                  fontSize: `${font.titleSize - 2}px`,
                  fontWeight: 400,
                  color: colors.textSecondary,
                  opacity: 0.8,
                  lineHeight: 1.3,
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                {payload.subtitle}
              </div>
            )}
          </div>
          
          {/* Logo (if enabled) */}
          {payload.showLogo && payload.logoUrl && (
            <div 
              style={{
                width: '60px',
                backgroundColor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderLeft: `1px solid ${colors.secondary}20`,
              }}
            >
              <img 
                src={payload.logoUrl} 
                alt="" 
                style={{ maxWidth: '40px', maxHeight: '40px' }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes lt-slide-enter {
          from { transform: translateX(-120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes lt-slide-exit {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-120%); opacity: 0; }
        }
        @keyframes lt-fade-enter {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lt-fade-exit {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes lt-pop-enter {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes lt-pop-exit {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0); opacity: 0; }
        }
        @keyframes lt-wipe-enter {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @keyframes lt-wipe-exit {
          from { clip-path: inset(0 0 0 0); }
          to { clip-path: inset(0 100% 0 0); }
        }
        @keyframes lt-reveal-enter {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes lt-reveal-exit {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        @keyframes lt-bounce-enter {
          0% { transform: translateY(100px); opacity: 0; }
          60% { transform: translateY(-10px); opacity: 1; }
          80% { transform: translateY(5px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes lt-bounce-exit {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100px); opacity: 0; }
        }
        @keyframes lt-scale-enter {
          from { transform: scaleX(0); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
        @keyframes lt-scale-exit {
          from { transform: scaleX(1); opacity: 1; }
          to { transform: scaleX(0); opacity: 0; }
        }
        @keyframes lt-bar-grow-enter {
          0% { max-width: 5px; opacity: 0; }
          30% { max-width: 5px; opacity: 1; }
          100% { max-width: 500px; opacity: 1; }
        }
        @keyframes lt-bar-grow-exit {
          from { max-width: 500px; opacity: 1; }
          to { max-width: 5px; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default LowerThirdOverlay;
