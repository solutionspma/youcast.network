import { useEffect, useRef, useState } from "react";
import { LowerThirdEngine } from "./lower-thirds/LowerThirdEngine";
import { LowerThirdPayload } from "./lower-thirds/types";

export function useLowerThirds() {
  const engineRef = useRef(new LowerThirdEngine());
  const [payload, setPayload] = useState<LowerThirdPayload | null>(null);
  const [animStart, setAnimStart] = useState<number>(0);

  useEffect(() => {
    return engineRef.current.subscribe((newPayload) => {
      setPayload(newPayload);
      setAnimStart(performance.now());
    });
  }, []);

  // Calculate animation progress
  const getProgress = () => {
    if (!payload || !animStart) return 1;
    const elapsed = performance.now() - animStart;
    return Math.min(elapsed / 300, 1);
  };

  return {
    engine: engineRef.current,
    payload,
    getProgress,
  };
}
