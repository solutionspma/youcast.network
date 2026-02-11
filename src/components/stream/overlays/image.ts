export type ImageOverlayData = {
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
};

export function drawImageOverlay(ctx: CanvasRenderingContext2D, data: ImageOverlayData) {
  if (!data?.img?.complete) return;
  
  ctx.globalAlpha = data.opacity;
  ctx.drawImage(
    data.img,
    data.x,
    data.y,
    data.width,
    data.height
  );
  ctx.globalAlpha = 1;
}
