import { describe, expect, it } from "vitest";
import { Noise2D } from "../../../src/core/noise";
import { RegionField } from "../../../src/world/regions";
import { Terrain } from "../../../src/world/terrain";
import type { LandmarkDef, RegionDef, WorldConfig } from "../../../src/world/types";
import world from "../../../src/data/world.json";
import regions from "../../../src/data/regions.json";
import landmarks from "../../../src/data/landmarks.json";

const W = world as WorldConfig;
const R = regions as RegionDef[];
const L = landmarks as LandmarkDef[];

function make() {
  const noise = new Noise2D(W.seed);
  const field = new RegionField(R, noise, W.regionBlendWidth, W.regionWarp);
  return { field, terrain: new Terrain(W, field, noise, L) };
}

describe("RegionField", () => {
  it("assigns each region its own centre", () => {
    const { field } = make();
    R.forEach((r, i) => expect(field.regionAt(r.center[0], r.center[1])).toBe(i));
  });
  it("blend t is within [0, 0.5] and primary != secondary", () => {
    const { field } = make();
    for (let i = 0; i < 200; i++) {
      const s = field.sample(i * 13 - 1300, i * -11 + 1100);
      expect(s.t).toBeGreaterThanOrEqual(0);
      expect(s.t).toBeLessThanOrEqual(0.5);
      expect(s.primary).not.toBe(s.secondary);
    }
  });
});

describe("Terrain", () => {
  it("is deterministic", () => {
    const a = make().terrain, b = make().terrain;
    expect(a.heightAt(123, -456)).toBe(b.heightAt(123, -456));
  });
  it("sinks beyond the island radius into the ocean", () => {
    const { terrain } = make();
    for (let a = 0; a < Math.PI * 2; a += 0.4) {
      const r = W.islandRadius * 1.2;
      expect(terrain.surfaceAt(Math.cos(a) * r, Math.sin(a) * r)).toBe("water");
    }
  });
  it("puts every landmark on dry land, including island landmarks", () => {
    const { terrain } = make();
    for (const lm of L) {
      const h = terrain.heightAt(lm.pos[0], lm.pos[1]);
      expect(h, lm.id).toBeGreaterThan(W.waterY);
    }
  });
  it("flattens the ground under a landmark stamp", () => {
    const { terrain } = make();
    const s = terrain.stamps[0];
    const h0 = terrain.heightAt(s.x, s.z);
    const h1 = terrain.heightAt(s.x + s.radius * 0.3, s.z);
    expect(Math.abs(h0 - h1)).toBeLessThan(0.01);
    expect(terrain.inStamp(s.x, s.z)).toBe(true);
  });
  it("spawn point is over the world, above the floor", () => {
    const { terrain } = make();
    expect(W.spawn.y).toBeGreaterThan(terrain.floorAt(W.spawn.x, W.spawn.z) + 10);
  });
});
