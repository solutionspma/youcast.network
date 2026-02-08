import { useEffect } from "react";
import { LOWER_THIRD_PRESETS } from "./presets";
import { LowerThirdEngine } from "./LowerThirdEngine";

export function useLowerThirdHotkeys(engine: LowerThirdEngine) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const preset = LOWER_THIRD_PRESETS[e.key];
      if (preset) {
        e.preventDefault();
        engine.show({ ...preset });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [engine]);
}
