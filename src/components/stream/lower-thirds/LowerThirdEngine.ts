import { LowerThirdPayload, ANIMATION_DURATIONS, DEFAULT_COLORS, DEFAULT_FONT } from "./types";

type Listener = (payload: LowerThirdPayload | null, isExiting: boolean) => void;

export class LowerThirdEngine {
  private current: LowerThirdPayload | null = null;
  private listeners = new Set<Listener>();
  private displayTimeout?: number;
  private isExiting = false;
  private exitTimeout?: number;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    // Immediately emit current state
    fn(this.current, this.isExiting);
    return () => {
      this.listeners.delete(fn);
    };
  }

  show(payload: LowerThirdPayload) {
    this.clearTimeouts();
    this.isExiting = false;
    
    // Ensure payload has all required fields with defaults
    this.current = {
      ...payload,
      colors: payload.colors || DEFAULT_COLORS,
      font: payload.font || DEFAULT_FONT,
      animationDuration: payload.animationDuration || ANIMATION_DURATIONS[payload.animation] || 300,
    };
    
    this.emit();

    // Set auto-hide if duration > 0
    if (payload.duration && payload.duration > 0) {
      this.displayTimeout = window.setTimeout(() => {
        this.hide();
      }, payload.duration);
    }
  }

  hide() {
    if (!this.current) return;
    
    // Start exit animation
    this.isExiting = true;
    this.emit();
    
    // After exit animation completes, clear
    const exitDuration = this.current.animationDuration || 300;
    this.exitTimeout = window.setTimeout(() => {
      this.current = null;
      this.isExiting = false;
      this.emit();
    }, exitDuration);
  }

  hideInstant() {
    this.clearTimeouts();
    this.current = null;
    this.isExiting = false;
    this.emit();
  }

  getCurrent(): LowerThirdPayload | null {
    return this.current;
  }

  isShowing(): boolean {
    return this.current !== null && !this.isExiting;
  }

  private clearTimeouts() {
    if (this.displayTimeout) {
      clearTimeout(this.displayTimeout);
      this.displayTimeout = undefined;
    }
    if (this.exitTimeout) {
      clearTimeout(this.exitTimeout);
      this.exitTimeout = undefined;
    }
  }

  private emit() {
    this.listeners.forEach((l) => l(this.current, this.isExiting));
  }
}

// Singleton instance for shared state
let engineInstance: LowerThirdEngine | null = null;

export function getLowerThirdEngine(): LowerThirdEngine {
  if (!engineInstance) {
    engineInstance = new LowerThirdEngine();
  }
  return engineInstance;
}
