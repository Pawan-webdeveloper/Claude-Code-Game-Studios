/**
 * Pawan's signature: canvas-drawn Indian block-print motifs from his tee (sun-and-bow emblem,
 * elephant border, floral band). Used on his rider texture and on his landmarks' banners.
 */
import * as THREE from "three";

export const PAWAN = {
  black: "#141414",
  terracotta: "#b5503c",
  green: "#2e7d5b",
  gold: "#e2b93b",
  pink: "#c84b5a",
  cream: "#e8dcc0",
  skin: "#8a5a3c",
  hair: "#1b1512",
} as const;

/** Draws the sun-with-bow-and-arrow emblem centred at (cx, cy) with radius r. */
export function drawSunBow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = PAWAN.terracotta;
  for (let i = 0; i < 11; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    ctx.save();
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, -r * 0.62);
    ctx.quadraticCurveTo(r * 0.12, -r * 0.85, 0, -r * 1.05);
    ctx.quadraticCurveTo(-r * 0.02, -r * 0.8, r * 0.08, -r * 0.62);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PAWAN.black;
  ctx.lineWidth = r * 0.04;
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22, r * 0.14, 0, Math.PI * 1.6);
    ctx.stroke();
  }
  // Bow (green with gold grip) and an upward gold arrow.
  ctx.strokeStyle = PAWAN.green;
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, r * 0.45);
  ctx.quadraticCurveTo(0, r * 0.15, r * 0.75, r * 0.45);
  ctx.stroke();
  ctx.strokeStyle = PAWAN.gold;
  ctx.lineWidth = r * 0.03;
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, r * 0.45);
  ctx.lineTo(0, r * 0.95);
  ctx.lineTo(r * 0.75, r * 0.45);
  ctx.moveTo(0, r * 1.0);
  ctx.lineTo(0, -r * 0.35);
  ctx.stroke();
  ctx.fillStyle = PAWAN.gold;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.5);
  ctx.lineTo(-r * 0.08, -r * 0.32);
  ctx.lineTo(r * 0.08, -r * 0.32);
  ctx.fill();
  ctx.restore();
}

/** Draws a row of block-print elephants alternating with fan motifs across a band. */
export function drawElephantBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const n = Math.max(2, Math.round(w / (h * 1.6)));
  const step = w / n;
  for (let i = 0; i < n; i++) {
    const cx = x + step * (i + 0.5);
    if (i % 2 === 0) {
      ctx.fillStyle = PAWAN.terracotta;
      ctx.beginPath();
      ctx.ellipse(cx, y + h * 0.5, step * 0.32, h * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - step * 0.25, y + h * 0.6, step * 0.08, h * 0.3);
      ctx.fillRect(cx + step * 0.15, y + h * 0.6, step * 0.08, h * 0.3);
      ctx.beginPath();
      ctx.arc(cx + step * 0.3, y + h * 0.38, h * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAWAN.green;
      ctx.fillRect(cx - step * 0.14, y + h * 0.32, step * 0.24, h * 0.2);
    } else {
      ctx.fillStyle = PAWAN.gold;
      ctx.beginPath();
      ctx.moveTo(cx, y + h * 0.85);
      for (let k = 0; k <= 6; k++) {
        const a = Math.PI + (k / 6) * Math.PI;
        ctx.lineTo(cx + Math.cos(a) * h * 0.4, y + h * 0.8 + Math.sin(a) * h * 0.55);
      }
      ctx.fill();
    }
  }
}

/** Draws a floral border band (green leaves, red and gold flowers). */
export function drawFloralBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const n = Math.max(2, Math.round(w / h));
  const step = w / n;
  for (let i = 0; i < n; i++) {
    const cx = x + step * (i + 0.5), cy = y + h / 2;
    ctx.fillStyle = PAWAN.green;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos((k * Math.PI) / 2) * h * 0.25, cy + Math.sin((k * Math.PI) / 2) * h * 0.25, h * 0.18, h * 0.08, (k * Math.PI) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = i % 2 ? PAWAN.gold : PAWAN.pink;
    ctx.beginPath();
    ctx.arc(cx, cy, h * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A banner texture (sun-and-bow over an elephant border) for Pawan's landmarks. */
export function bannerTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 384;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = PAWAN.black;
  ctx.fillRect(0, 0, c.width, c.height);
  drawFloralBand(ctx, 0, 6, 256, 40);
  drawSunBow(ctx, 128, 170, 90);
  drawElephantBand(ctx, 0, 300, 256, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
