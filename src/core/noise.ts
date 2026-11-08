/**
 * Seeded 2D simplex noise plus fractal helpers. Pure functions, no Three.js, unit-testable.
 */
import { mulberry32 } from "./rng";

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const GRAD: ReadonlyArray<[number, number]> = [
  [1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1],
];

/** A seeded 2D simplex noise field returning values in roughly [-1, 1]. */
export class Noise2D {
  private readonly perm = new Uint8Array(512);

  /** @param seed any integer; equal seeds produce identical fields. */
  constructor(seed: number) {
    const rand = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  /** Simplex noise at (x, y), range ~[-1, 1]. */
  sample(x: number, y: number): number {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const pm = this.perm;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { const g = GRAD[pm[ii + pm[jj]] & 7]; t0 *= t0; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { const g = GRAD[pm[ii + i1 + pm[jj + j1]] & 7]; t1 *= t1; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { const g = GRAD[pm[ii + 1 + pm[jj + 1]] & 7]; t2 *= t2; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
    return 70 * n;
  }

  /** Fractal Brownian motion: `octaves` layers, each double frequency / half amplitude. Range ~[-1, 1]. */
  fbm(x: number, y: number, octaves: number): number {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.sample(x * freq, y * freq);
      norm += amp; amp *= 0.5; freq *= 2;
    }
    return sum / norm;
  }

  /** Ridged multifractal for mountain ridges. Range [0, 1]. */
  ridged(x: number, y: number, octaves: number): number {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      const r = 1 - Math.abs(this.sample(x * freq, y * freq));
      sum += amp * r * r;
      norm += amp; amp *= 0.5; freq *= 2;
    }
    return sum / norm;
  }
}
