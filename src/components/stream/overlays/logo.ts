export type LogoData = {
  img: HTMLImageElement;
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

export function drawLogo(ctx: CanvasRenderingContext2D, data: LogoData) {
  if (!data.img.complete) return;
  
  ctx.globalAlpha = data.opacity;
  ctx.drawImage(
    data.img,
    data.x,
    data.y,
    data.img.width * data.scale,
    data.img.height * data.scale
  );
  ctx.globalAlpha = 1;
}
