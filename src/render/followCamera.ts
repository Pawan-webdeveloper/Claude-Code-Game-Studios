/**
 * Chase camera behind the active ride, blending between ride profiles, with drag-look orbit and
 * terrain avoidance.
 */
import * as THREE from "three";
import { damp, lerp } from "../core/math";
import type { CameraProfile, PlayerState } from "../rides/rides";
import type { Terrain } from "../world/terrain";

export class FollowCamera {
  private readonly profile: CameraProfile = { distance: 16, height: 5, lookAhead: 8 };
  private readonly desired = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();
  private initialised = false;

  constructor(readonly camera: THREE.PerspectiveCamera) {}

  /** Moves the camera toward its chase position for this frame. */
  update(dt: number, s: PlayerState, target: CameraProfile, orbitYaw: number, orbitPitch: number, terrain: Terrain): void {
    const k = damp(2.5, dt);
    this.profile.distance = lerp(this.profile.distance, target.distance, k);
    this.profile.height = lerp(this.profile.height, target.height, k);
    this.profile.lookAhead = lerp(this.profile.lookAhead, target.lookAhead, k);

    const yaw = s.heading + orbitYaw;
    const p = this.profile;
    const pitchLift = -Math.sin(s.pitch) * p.distance * 0.6 + orbitPitch * p.distance;
    this.desired.set(
      s.pos.x - Math.sin(yaw) * p.distance,
      s.pos.y + p.height + pitchLift,
      s.pos.z - Math.cos(yaw) * p.distance,
    );
    const floor = terrain.floorAt(this.desired.x, this.desired.z) + 2;
    if (this.desired.y < floor) this.desired.y = floor;

    this.lookTarget.set(
      s.pos.x + Math.sin(s.heading) * p.lookAhead,
      s.pos.y + 1.6 + Math.sin(s.pitch) * p.lookAhead,
      s.pos.z + Math.cos(s.heading) * p.lookAhead,
    );
    if (!this.initialised) {
      this.camera.position.copy(this.desired);
      this.look.copy(this.lookTarget);
      this.initialised = true;
    }
    this.camera.position.lerp(this.desired, damp(5, dt));
    this.look.lerp(this.lookTarget, damp(8, dt));
    this.camera.lookAt(this.look);
  }
}
