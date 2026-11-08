/**
 * Region field: which of the six regions owns a point, with a soft blend near borders.
 * Pure logic (no Three.js) so it is unit-testable.
 */
import type { Noise2D } from "../core/noise";
import { smoothstep } from "../core/math";
import type { RegionDef, RegionSample } from "./types";

export class RegionField {
  /**
   * @param regions region definitions (centers are Voronoi seeds)
   * @param noise noise used to warp borders so they are organic, not straight lines
   * @param blendWidth distance over which two regions blend
   * @param warp border warp frequency and amount
   */
  constructor(
    private readonly regions: readonly RegionDef[],
    private readonly noise: Noise2D,
    private readonly blendWidth: number,
    private readonly warp: { frequency: number; amount: number },
  ) {}

  /** Number of regions. */
  get count(): number {
    return this.regions.length;
  }

  /** Region definition by index. */
  def(i: number): RegionDef {
    return this.regions[i];
  }

  /** Samples the region owning (x, z) and its blend toward the nearest neighbour. */
  sample(x: number, z: number): RegionSample {
    const f = this.warp.frequency;
    const wx = x + this.noise.sample(x * f, z * f) * this.warp.amount;
    const wz = z + this.noise.sample(x * f + 91.7, z * f - 13.3) * this.warp.amount;
    let d0 = Infinity, d1 = Infinity, i0 = 0, i1 = 0;
    for (let i = 0; i < this.regions.length; i++) {
      const c = this.regions[i].center;
      const d = Math.hypot(wx - c[0], wz - c[1]);
      if (d < d0) { d1 = d0; i1 = i0; d0 = d; i0 = i; }
      else if (d < d1) { d1 = d; i1 = i; }
    }
    const t = 0.5 * (1 - smoothstep(0, this.blendWidth, d1 - d0));
    return { primary: i0, secondary: i1, t };
  }

  /** Index of the region that dominates (x, z). */
  regionAt(x: number, z: number): number {
    return this.sample(x, z).primary;
  }
}
