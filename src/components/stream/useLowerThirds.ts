import { useEffect, useState } from "react";
import { getLowerThirdEngine, LowerThirdEngine } from "./lower-thirds/LowerThirdEngine";
import { LowerThirdPayload } from "./lower-thirds/types";
import { LOWER_THIRD_PRESETS } from "./lower-thirds/presets";

export function useLowerThirds() {
  const [payload, setPayload] = useState<LowerThirdPayload | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [engine] = useState<LowerThirdEngine>(() => getLowerThirdEngine());

  useEffect(() => {
    return engine.subscribe((newPayload, exiting) => {
      setPayload(newPayload);
      setIsExiting(exiting);
    });
  }, [engine]);

  // Register hotkey handlers for F1-F8
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (LOWER_THIRD_PRESETS[key]) {
        e.preventDefault();
        engine.show(LOWER_THIRD_PRESETS[key]);
      }
      // Escape to hide
      if (e.key === 'Escape' && engine.isShowing()) {
        e.preventDefault();
        engine.hide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);

  return {
    engine,
    payload,
    isExiting,
    isShowing: engine.isShowing(),
    show: (payload: LowerThirdPayload) => engine.show(payload),
    hide: () => engine.hide(),
    hideInstant: () => engine.hideInstant(),
  };
}
