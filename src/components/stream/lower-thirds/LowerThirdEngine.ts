import { LowerThirdPayload } from "./types";

type Listener = (payload: LowerThirdPayload | null) => void;

export class LowerThirdEngine {
  private current: LowerThirdPayload | null = null;
  private listeners = new Set<Listener>();
  private timeout?: number;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  show(payload: LowerThirdPayload) {
    this.clear();
    this.current = payload;
    this.emit();

    if (payload.duration) {
      this.timeout = window.setTimeout(() => {
        this.hide();
      }, payload.duration);
    }
  }

  hide() {
    this.clear();
    this.current = null;
    this.emit();
  }

  private clear() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }

  private emit() {
    this.listeners.forEach((l) => l(this.current));
  }
}
