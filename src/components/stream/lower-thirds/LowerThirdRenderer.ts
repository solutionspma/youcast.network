import { LowerThirdPayload } from "./types";

export function renderLowerThird(
  ctx: CanvasRenderingContext2D,
  payload: LowerThirdPayload,
  progress: number,
  canvas: HTMLCanvasElement
) {
  const padding = 20;
  const height = 70;
  const width = 420;

  let x = padding;
  if (payload.position === "bottom-center") {
    x = canvas.width / 2 - width / 2;
  }
  if (payload.position === "bottom-right") {
    x = canvas.width - width - padding;
  }

  const baseY = canvas.height - height - padding;
  let y = baseY;

  if (payload.animation === "slide") {
    y = baseY + (1 - progress) * 40;
  }

  ctx.globalAlpha = payload.animation === "fade" ? progress : 1;

  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(payload.name, x + 16, y + 30);

  if (payload.title) {
    ctx.font = "14px sans-serif";
    ctx.fillText(payload.title, x + 16, y + 52);
  }

  ctx.globalAlpha = 1;
}
