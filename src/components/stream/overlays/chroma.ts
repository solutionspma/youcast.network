export type ChromaKeyData = {
  threshold: number; // 0-255, how sensitive to green
  smoothing: number; // Edge smoothing 0-10
};

export function applyChromaKey(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: ChromaKeyData
) {
  const { threshold = 150, smoothing = 2 } = data;
  
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = frame.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    // Detect green pixels
    if (g > threshold && g > r + 20 && g > b + 20) {
      // Make transparent with smoothing
      const greenStrength = (g - Math.max(r, b)) / 255;
      const alpha = Math.max(0, 1 - greenStrength * (smoothing / 10));
      d[i + 3] = Math.floor(d[i + 3] * alpha);
    }
  }

  ctx.putImageData(frame, 0, 0);
}
