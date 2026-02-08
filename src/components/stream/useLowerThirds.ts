import { useEffect, useRef } from "react";
import { LowerThirdEngine } from "./lower-thirds/LowerThirdEngine";
import { renderLowerThird } from "./lower-thirds/LowerThirdRenderer";
import { LowerThirdPayload } from "./lower-thirds/types";

export function useLowerThirds(
  canvasRef: React.RefObject<HTMLCanvasElement>
) {
  const engineRef = useRef(new LowerThirdEngine());
  const payloadRef = useRef<LowerThirdPayload | null>(null);
  const animStart = useRef<number | null>(null);

  useEffect(() => {
    return engineRef.current.subscribe((payload) => {
      payloadRef.current = payload;
      animStart.current = performance.now();
    });
  }, []);

  useEffect(() => {
    let raf: number;

    const loop = (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (payloadRef.current) {
        const elapsed = t - (animStart.current ?? t);
        const progress = Math.min(elapsed / 300, 1);
        renderLowerThird(ctx, payloadRef.current, progress, canvas);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef]);

  return engineRef.current;
}
