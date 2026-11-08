import { describe, expect, it } from "vitest";
import { Noise2D } from "../../../src/core/noise";
import { hash2i, mulberry32 } from "../../../src/core/rng";

const SEED = 7311;

describe("Noise2D", () => {
  it("is deterministic for the same seed", () => {
    const a = new Noise2D(SEED), b = new Noise2D(SEED);
    for (let i = 0; i < 50; i++) expect(a.sample(i * 0.37, i * -0.21)).toBe(b.sample(i * 0.37, i * -0.21));
  });
  it("differs between seeds", () => {
    const a = new Noise2D(SEED), b = new Noise2D(SEED + 1);
    let diff = 0;
    for (let i = 0; i < 50; i++) diff += Math.abs(a.sample(i * 0.37, i * 0.5) - b.sample(i * 0.37, i * 0.5));
    expect(diff).toBeGreaterThan(0.5);
  });
  it("stays within [-1, 1] for sample, fbm and [0, 1] for ridged", () => {
    const n = new Noise2D(SEED);
    for (let i = 0; i < 500; i++) {
      const x = i * 1.13, y = i * -0.71;
      expect(Math.abs(n.sample(x, y))).toBeLessThanOrEqual(1.0001);
      expect(Math.abs(n.fbm(x, y, 4))).toBeLessThanOrEqual(1.0001);
      const r = n.ridged(x, y, 4);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1.0001);
    }
  });
});

describe("rng", () => {
  it("mulberry32 repeats for equal seeds and stays in [0,1)", () => {
    const a = mulberry32(42), b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it("hash2i gives different hashes for neighbouring chunks", () => {
    expect(hash2i(0, 0, SEED)).not.toBe(hash2i(1, 0, SEED));
    expect(hash2i(0, 0, SEED)).not.toBe(hash2i(0, 1, SEED));
    expect(hash2i(3, -2, SEED)).toBe(hash2i(3, -2, SEED));
  });
});
