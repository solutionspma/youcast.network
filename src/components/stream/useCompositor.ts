import { useEffect, useRef } from "react";
import { renderCompositor } from "./compositor/renderCompositor";
import { OverlayLayer } from "./overlays/types";
import { LowerThirdPayload } from "./lower-thirds/types";

export function useCompositor(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  videoRef: React.RefObject<HTMLVideoElement>,
  overlayLayers: OverlayLayer[],
  lowerThirdPayload: LowerThirdPayload | null,
  getLowerThirdProgress: () => number,
  isLowerThirdExiting: boolean = false
) {
  const rafRef = useRef<number>();

  useEffect(() => {
    const loop = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (!canvas) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Prepare lower third data for compositor
      const lowerThirdData = lowerThirdPayload
        ? {
            payload: lowerThirdPayload,
            progress: getLowerThirdProgress(),
            isExiting: isLowerThirdExiting,
          }
        : undefined;

      // Render everything through compositor
      renderCompositor(
        ctx,
        video,
        overlayLayers,
        canvas,
        lowerThirdData
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [canvasRef, videoRef, overlayLayers, lowerThirdPayload, getLowerThirdProgress, isLowerThirdExiting]);
}
