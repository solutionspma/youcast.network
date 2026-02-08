import { useEffect } from "react";
import { OverlayEngine } from "./overlays/OverlayEngine";
import { LowerThirdEngine } from "./lower-thirds/LowerThirdEngine";

export function useGlobalShortcuts(
  overlayEngine: OverlayEngine,
  lowerThirdEngine: LowerThirdEngine
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      switch (e.key) {
        // F1-F2: Lower thirds (handled by existing hook)
        
        // F9: Toggle logo on
        case "F9":
          e.preventDefault();
          const logoLayer = overlayEngine.getAllLayers().find(l => l.id === "logo-main");
          if (logoLayer) {
            overlayEngine.toggle("logo-main", true);
          }
          break;

        // F10: Toggle logo off
        case "F10":
          e.preventDefault();
          overlayEngine.toggle("logo-main", false);
          break;

        // F11: Toggle chroma key
        case "F11":
          e.preventDefault();
          const chromaLayer = overlayEngine.getAllLayers().find(l => l.id === "chroma-main");
          if (chromaLayer) {
            overlayEngine.toggle("chroma-main", !chromaLayer.enabled);
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlayEngine, lowerThirdEngine]);
}
