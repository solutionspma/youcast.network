import { useEffect, useRef, useState } from "react";
import { OverlayEngine } from "./overlays/OverlayEngine";
import { OverlayLayer } from "./overlays/types";

export function useOverlays() {
  const engineRef = useRef(new OverlayEngine());
  const [layers, setLayers] = useState<OverlayLayer[]>([]);

  useEffect(() => {
    return engineRef.current.subscribe((newLayers) => {
      setLayers(newLayers);
    });
  }, []);

  return {
    engine: engineRef.current,
    layers,
  };
}
