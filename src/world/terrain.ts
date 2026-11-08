/**
 * Terrain height field: per-region noise profiles blended across borders, an island mask that
 * sinks the edges into the ocean, and flat "stamps" under landmarks. Pure logic, unit-testable.
 */
import type { Noise2D } from "../core/noise";
import { lerp, smoothstep } from "../core/math";
import type { RegionField } from "./regions";
import type { LandmarkDef, RegionDef, WorldConfig } from "./types";

/** A flattened disc of terrain under a landmark. */
export interface Stamp {
  x: number;
  z: number;
  radius: number;
  height: number;
}

export type Surface = "land" | "water";

const STAMP_CELL = 256;

export class Terrain {
  private readonly buckets = new Map<string, Stamp[]>();
  /** Stamps in creation order (landmarks index into this). */
  readonly stamps: Stamp[] = [];

  constructor(
    private readonly cfg: WorldConfig,
    private readonly field: RegionField,
    private readonly noise: Noise2D,
    landmarks: readonly LandmarkDef[],
  ) {
    for (const lm of landmarks) {
      const [x, z] = lm.pos;
      const radius = 26 * lm.scale + 14;
      const raw = this.rawHeight(x, z);
      const minH = cfg.waterY + (lm.island ? 3 : 2.5);
      const stamp: Stamp = { x, z, radius, height: Math.max(raw, minH) };
      this.stamps.push(stamp);
      const cx0 = Math.floor((x - radius) / STAMP_CELL), cx1 = Math.floor((x + radius) / STAMP_CELL);
      const cz0 = Math.floor((z - radius) / STAMP_CELL), cz1 = Math.floor((z + radius) / STAMP_CELL);
      for (let cx = cx0; cx <= cx1; cx++)
        for (let cz = cz0; cz <= cz1; cz++) {
          const key = cx + "," + cz;
          const list = this.buckets.get(key) ?? [];
          list.push(stamp);
          this.buckets.set(key, list);
        }
    }
  }

  /** Height of one region's profile at (x, z), before blending/masking. */
  regionHeight(def: RegionDef, x: number, z: number): number {
    const t = def.terrain;
    let h = t.base + t.amp * this.noise.fbm(x * t.freq, z * t.freq, 4);
    if (t.ridged > 0) h += t.ridged * Math.pow(this.noise.ridged(x * t.freq * 0.6 + 40, z * t.freq * 0.6 - 40, 4), 2);
    return h;
  }

  /** Terrain height ignoring landmark stamps. */
  rawHeight(x: number, z: number): number {
    const s = this.field.sample(x, z);
    const a = this.regionHeight(this.field.def(s.primary), x, z);
    const b = s.t > 0.001 ? this.regionHeight(this.field.def(s.secondary), x, z) : a;
    let h = lerp(a, b, s.t);
    // Island mask: the outer ring sinks into a deep ocean.
    const r = Math.hypot(x, z) + this.noise.sample(x * 0.0012, z * 0.0012) * 160;
    const mask = 1 - smoothstep(this.cfg.islandRadius * 0.8, this.cfg.islandRadius, r);
    h = lerp(-34, h, mask);
    return h;
  }

  /** Final terrain height at (x, z), including flattened stamps under landmarks. */
  heightAt(x: number, z: number): number {
    let h = this.rawHeight(x, z);
    const list = this.buckets.get(Math.floor(x / STAMP_CELL) + "," + Math.floor(z / STAMP_CELL));
    if (list) {
      for (const s of list) {
        const d = Math.hypot(x - s.x, z - s.z);
        if (d < s.radius) h = lerp(s.height, h, smoothstep(s.radius * 0.55, s.radius, d));
      }
    }
    return h;
  }

  /** True when (x, z) lies inside a landmark's flattened stamp (props avoid these). */
  inStamp(x: number, z: number): boolean {
    const list = this.buckets.get(Math.floor(x / STAMP_CELL) + "," + Math.floor(z / STAMP_CELL));
    if (!list) return false;
    for (const s of list) if (Math.hypot(x - s.x, z - s.z) < s.radius) return true;
    return false;
  }

  /** Whether (x, z) is land or water at the configured sea level. */
  surfaceAt(x: number, z: number): Surface {
    return this.heightAt(x, z) < this.cfg.waterY ? "water" : "land";
  }

  /** Height of whatever the player stands on: terrain, or the water surface. */
  floorAt(x: number, z: number): number {
    return Math.max(this.heightAt(x, z), this.cfg.waterY);
  }
}
