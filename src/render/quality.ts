/**
 * Quality tier detection and dynamic resolution scaling to hold the frame-time budget on phones.
 */
import type * as THREE from "three";
import type { Quality } from "../world/types";

/** Picks a tier from ?q=low|medium|high, else by device (touch / small screens get medium). */
export function detectQuality(): Quality {
  const q = new URLSearchParams(location.search).get("q");
  if (q === "low" || q === "medium" || q === "high") return q;
  const touch = matchMedia("(pointer: coarse)").matches;
  return touch || Math.min(screen.width, screen.height) < 700 ? "medium" : "high";
}

/** True on touch-first devices (shows the on-screen controls). */
export const isTouch = (): boolean => matchMedia("(pointer: coarse)").matches;

export class DynamicResolution {
  private avg = 16;
  private ratio: number;
  private cooldown = 0;

  /**
   * @param renderer renderer to adjust
   * @param maxRatio device-pixel-ratio cap for the tier
   * @param budgetMs frame-time budget (33 ms = 30 fps)
   */
  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly maxRatio: number,
    private readonly budgetMs: number,
    private readonly onChange: () => void = () => {},
  ) {
    this.ratio = maxRatio;
    renderer.setPixelRatio(this.ratio);
  }

  /** Feeds one frame time (seconds) and adjusts the pixel ratio when sustained over/under budget. */
  sample(dt: number): void {
    this.avg = this.avg * 0.95 + dt * 1000 * 0.05;
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    if (this.avg > this.budgetMs * 1.1 && this.ratio > 0.6) {
      this.ratio = Math.max(0.6, this.ratio - 0.15);
      this.renderer.setPixelRatio(this.ratio);
      this.onChange();
      this.cooldown = 1.5;
    } else if (this.avg < this.budgetMs * 0.6 && this.ratio < this.maxRatio) {
      this.ratio = Math.min(this.maxRatio, this.ratio + 0.1);
      this.renderer.setPixelRatio(this.ratio);
      this.onChange();
      this.cooldown = 3;
    }
  }

  /** Current pixel ratio. */
  get pixelRatio(): number {
    return this.ratio;
  }
}
