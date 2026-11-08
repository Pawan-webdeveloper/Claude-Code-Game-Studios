/**
 * Pure ride-switching rules (no Three.js). Charizard owns the sky, Gengar the land, and Greninja
 * is amphibious (land and water). Landing picks the ride for the surface below; Gengar running
 * into water becomes Greninja. Greninja can be summoned anywhere (BUG-0003).
 */
import type { Surface } from "../world/terrain";

export type RideId = "charizard" | "gengar" | "greninja";

export const RIDE_ORDER: readonly RideId[] = ["charizard", "gengar", "greninja"];

/** The ground ride that owns a surface. */
export function groundRideFor(surface: Surface): RideId {
  return surface === "water" ? "greninja" : "gengar";
}

/** Everything the switch rules need to know about this frame. */
export interface SwitchContext {
  current: RideId;
  surface: Surface;
  /** Height of the rider above the land or water surface beneath it. */
  clearance: number;
  /** True when the player is steering downward (flight) this frame. */
  descending: boolean;
  /** Clearance under which a descending Charizard lands. */
  landClearance: number;
  /** Rides whose models have finished loading. */
  loaded: ReadonlySet<RideId>;
}

/**
 * Returns the ride to switch to automatically this frame, or null to keep the current one.
 * A ride that has not loaded yet is never chosen.
 */
export function autoSwitch(ctx: SwitchContext): RideId | null {
  let target: RideId | null = null;
  if (ctx.current === "charizard") {
    if (ctx.descending && ctx.clearance < ctx.landClearance) target = groundRideFor(ctx.surface);
  } else if (ctx.current === "gengar" && ctx.surface === "water") {
    target = "greninja";
  }
  if (target === null || !ctx.loaded.has(target)) return null;
  return target;
}

/**
 * Resolves a manual switch request. Charizard and Greninja can be summoned anywhere; Gengar
 * cannot swim, so asking for Gengar over water gives Greninja. An unloaded ride keeps the current one.
 */
export function manualSwitch(
  requested: RideId,
  current: RideId,
  surface: Surface,
  loaded: ReadonlySet<RideId>,
): RideId {
  const target = requested === "gengar" && surface === "water" ? "greninja" : requested;
  return loaded.has(target) ? target : current;
}

/**
 * Surface under a ground ride with hysteresis, so a ride skimming the shoreline does not flicker
 * between Gengar and Greninja every frame.
 * @param current active ride
 * @param height terrain height under the player
 * @param waterY sea level
 * @param margin how far past the waterline the ride must go before switching
 */
export function surfaceWithHysteresis(current: RideId, height: number, waterY: number, margin: number): Surface {
  if (current === "greninja") return height > waterY + margin ? "land" : "water";
  if (current === "gengar") return height < waterY - margin ? "water" : "land";
  return height < waterY ? "water" : "land";
}
