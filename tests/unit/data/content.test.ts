import { describe, expect, it } from "vitest";
import landmarks from "../../../src/data/landmarks.json";
import regions from "../../../src/data/regions.json";
import world from "../../../src/data/world.json";
import rides from "../../../src/data/rides.json";

describe("content data", () => {
  it("has 40 landmarks with unique ids", () => {
    expect(landmarks.length).toBe(40);
    expect(new Set(landmarks.map((l) => l.id)).size).toBe(40);
  });
  it("has six regions and every landmark belongs to one", () => {
    expect(regions.length).toBe(6);
    const ids = new Set(regions.map((r) => r.id));
    for (const l of landmarks) expect(ids.has(l.region), l.id).toBe(true);
  });
  it("has the three projects with live links", () => {
    const projects = landmarks.filter((l) => "project" in l && l.project);
    expect(projects.map((p) => p.id).sort()).toEqual(["bennet-forge", "scanlyfix-lighthouse", "third-eye-tower"]);
    for (const p of projects) expect(p.card?.link).toMatch(/^https:\/\//);
  });
  it("spawn faces an existing landmark", () => {
    expect(landmarks.some((l) => l.id === world.spawn.faceTowards)).toBe(true);
  });
  it("every ride has a model path and camera profile", () => {
    for (const id of ["charizard", "gengar", "greninja"] as const) {
      expect(rides[id].model).toMatch(/\.glb$/);
      expect(rides[id].camera.distance).toBeGreaterThan(0);
    }
  });
});
