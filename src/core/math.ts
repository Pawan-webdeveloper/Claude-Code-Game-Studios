/** Small math helpers shared by gameplay code. */

/** Clamps v into [lo, hi]. */
export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** Hermite smoothstep of x between edges a and b. */
export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Linear interpolation. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Frame-rate independent exponential damping factor for `lerp(current, target, damp(rate, dt))`. */
export const damp = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);

/** Wraps an angle to (-PI, PI]. */
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a <= -Math.PI) a += Math.PI * 2;
  return a;
}
