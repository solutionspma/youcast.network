import { OverlayLayer } from "../overlays/types";
import { drawLogo } from "../overlays/logo";
import { drawImageOverlay } from "../overlays/image";
import { applyChromaKey } from "../overlays/chroma";
import { renderLowerThird } from "../lower-thirds/LowerThirdRenderer";

export function renderCompositor(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement | null,
  layers: OverlayLayer[],
  canvas: HTMLCanvasElement,
  lowerThirdData?: { payload: any; progress: number }
) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw base video (if available)
  if (video && video.readyState >= 2) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  } else {
    // Black background when no video
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Apply chroma key if enabled (must happen on video layer)
  const chromaLayer = layers.find(l => l.type === 'chroma' && l.enabled);
  if (chromaLayer) {
    applyChromaKey(ctx, canvas, chromaLayer.data);
  }

  // 3. Render overlays in z-index order
  const sortedLayers = [...layers]
    .filter(l => l.enabled && l.type !== 'chroma')
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    switch (layer.type) {
      case "logo":
        drawLogo(ctx, layer.data);
        break;
      case "image":
        drawImageOverlay(ctx, layer.data);
        break;
      case "lower-third":
        if (lowerThirdData) {
          renderLowerThird(ctx, lowerThirdData.payload, lowerThirdData.progress, canvas);
        }
        break;
    }
  }
}
