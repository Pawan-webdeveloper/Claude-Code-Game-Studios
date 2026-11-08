import { describe, expect, it } from "vitest";
import { autoSwitch, groundRideFor, manualSwitch, surfaceWithHysteresis, type RideId } from "../../../src/rides/rideLogic";

const ALL = new Set<RideId>(["charizard", "gengar", "greninja"]);
const ONLY_CHARIZARD = new Set<RideId>(["charizard"]);
const base = { landClearance: 2.2, loaded: ALL };

describe("groundRideFor", () => {
  it("maps land to Gengar and water to Greninja", () => {
    expect(groundRideFor("land")).toBe("gengar");
    expect(groundRideFor("water")).toBe("greninja");
  });
});

describe("autoSwitch", () => {
  it("lands Charizard on land as Gengar when descending low", () => {
    expect(autoSwitch({ ...base, current: "charizard", surface: "land", clearance: 1.5, descending: true })).toBe("gengar");
  });
  it("lands Charizard on water as Greninja", () => {
    expect(autoSwitch({ ...base, current: "charizard", surface: "water", clearance: 1, descending: true })).toBe("greninja");
  });
  it("keeps flying when skimming low but not descending", () => {
    expect(autoSwitch({ ...base, current: "charizard", surface: "land", clearance: 1, descending: false })).toBeNull();
  });
  it("keeps flying when descending but still high", () => {
    expect(autoSwitch({ ...base, current: "charizard", surface: "land", clearance: 30, descending: true })).toBeNull();
  });
  it("Gengar entering water becomes Greninja", () => {
    expect(autoSwitch({ ...base, current: "gengar", surface: "water", clearance: 0, descending: false })).toBe("greninja");
  });
  it("Greninja is amphibious: it stays Greninja on land (BUG-0003)", () => {
    expect(autoSwitch({ ...base, current: "greninja", surface: "land", clearance: 0, descending: false })).toBeNull();
  });
  it("never picks a ride that has not loaded", () => {
    expect(autoSwitch({ ...base, loaded: ONLY_CHARIZARD, current: "charizard", surface: "land", clearance: 1, descending: true })).toBeNull();
  });
});

describe("manualSwitch", () => {
  it("take-off always gives Charizard", () => {
    expect(manualSwitch("charizard", "gengar", "land", ALL)).toBe("charizard");
  });
  it("Greninja can be summoned on land and on water (BUG-0003)", () => {
    expect(manualSwitch("greninja", "charizard", "land", ALL)).toBe("greninja");
    expect(manualSwitch("greninja", "gengar", "land", ALL)).toBe("greninja");
    expect(manualSwitch("greninja", "charizard", "water", ALL)).toBe("greninja");
  });
  it("Gengar cannot swim: asking for Gengar over water gives Greninja", () => {
    expect(manualSwitch("gengar", "charizard", "water", ALL)).toBe("greninja");
    expect(manualSwitch("gengar", "greninja", "land", ALL)).toBe("gengar");
  });
  it("keeps the current ride when the target is not loaded", () => {
    expect(manualSwitch("gengar", "charizard", "land", ONLY_CHARIZARD)).toBe("charizard");
  });
});

describe("surfaceWithHysteresis", () => {
  const M = 0.6;
  it("Greninja stays in the water until clearly on land", () => {
    expect(surfaceWithHysteresis("greninja", 0.3, 0, M)).toBe("water");
    expect(surfaceWithHysteresis("greninja", 0.7, 0, M)).toBe("land");
  });
  it("Gengar stays on land until clearly in the water", () => {
    expect(surfaceWithHysteresis("gengar", -0.3, 0, M)).toBe("land");
    expect(surfaceWithHysteresis("gengar", -0.7, 0, M)).toBe("water");
  });
  it("Charizard uses the plain waterline", () => {
    expect(surfaceWithHysteresis("charizard", -0.1, 0, M)).toBe("water");
    expect(surfaceWithHysteresis("charizard", 0.1, 0, M)).toBe("land");
  });
});
